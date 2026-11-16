import { test, expect } from '@playwright/test';
import { chooseMode } from './helpers.js';

test('声调示例与轻声词语可以点读，má 使用替换录音', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.audioEvents = [];
    window.Audio = class extends NativeAudio {
      constructor(path) {
        super(path);
        this.addEventListener('playing', () => window.audioEvents.push({ path, event: 'playing' }));
        this.addEventListener('ended', () => window.audioEvents.push({ path, event: 'ended' }));
        this.addEventListener('error', () => window.audioEvents.push({ path, event: 'error' }));
      }
    };
  });
  await page.goto('/');
  await chooseMode(page, 'tones');
  await expect(page.locator('.tone-example')).toHaveCount(4);
  await expect(page.locator('.tone-tile')).toHaveCount(16);
  await expect(page.locator('.neutral-tone-examples button')).toHaveCount(6);
  await page.locator('.tone-tile[data-sound="ma2"]').click();
  await expect.poll(() => page.evaluate(() => window.audioEvents)).toContainEqual({ path: '/audio/ma2-yue-tan.ogg', event: 'playing' });
  await expect.poll(() => page.evaluate(() => window.audioEvents)).toContainEqual({ path: '/audio/ma2-yue-tan.ogg', event: 'ended' });
  await page.locator('.neutral-tone-examples [data-word="妈妈"]').click();
  await expect.poll(() => page.evaluate(() => window.audioEvents)).toContainEqual({ path: '/audio/word-妈妈.mp3', event: 'ended' });
  expect(await page.evaluate(() => window.audioEvents.filter(entry => entry.event === 'error'))).toEqual([]);

  const decoded = await page.evaluate(async () => {
    const manifest = await fetch('/audio/manifest.json').then(response => response.json());
    const paths = [
      ...Array.from(document.querySelectorAll('.tone-tile'), element => manifest.files[`syllable:${element.dataset.sound}`]),
      ...Array.from(document.querySelectorAll('.neutral-tone-examples button'), element => manifest.files[`word:${element.dataset.word}`]),
    ];
    const context = new AudioContext();
    try {
      return await Promise.all(paths.map(async path => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        let peak = 0;
        for (const sample of buffer.getChannelData(0)) peak = Math.max(peak, Math.abs(sample));
        return { path, duration: buffer.duration, peak };
      }));
    } finally {
      await context.close();
    }
  });
  expect(decoded).toHaveLength(22);
  for (const audio of decoded) {
    expect(audio.duration, audio.path).toBeGreaterThan(0.1);
    expect(audio.peak, audio.path).toBeGreaterThan(0.01);
  }
});

test('声调示例在桌面、平板和手机上没有横向溢出', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 820, height: 1180 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await chooseMode(page, 'tones');
    await expect(page.locator('.tone-tile')).toHaveCount(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  }
});
