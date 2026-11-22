import { test, expect } from '@playwright/test';
import { stored, selectTopic, setLearningPreference } from './helpers.js';
import { poems } from '../../src/poetry-data.js';

async function poemText(page) {
  return page.locator('.ct-poem-lines').evaluate(element => {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('rt, rp').forEach(node => node.remove());
    return copy.textContent;
  });
}

test('形近字和多音字对照可读，关闭拼音仍保留辨析所需的读音说明', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '形近字辨析');
  await expect(page.locator('.ct-literacy-topic')).toHaveClass(/ct-sentence-topic/);
  await expect(page.locator('.ct-lesson')).toHaveClass(/ct-sentence-card/);
  await expect(page.locator('.learning-aside')).toBeVisible();
  await expect(page.locator('.ct-comparison')).toContainText('眼睛');
  await expect(page.locator('.ct-comparison article')).toHaveCount(3);
  await page.locator('.nav-tabs [data-action="ct-category"][data-id="details"]').click();
  await expect(page.locator('.ct-comparison')).toContainText('上横长、下横短');
  await selectTopic(page, '同音字与多音字');
  await page.locator('.nav-tabs [data-action="ct-category"][data-id="polyphones"]').click();
  await page.locator('[data-action="ct-lesson"][data-id$=":de"]').click();
  for (const reading of ['dé', 'děi', 'de']) await expect(page.locator('.ct-comparison')).toContainText(reading);
  await setLearningPreference(page, 'showPinyin', false);
  await expect(page.locator('.ct-comparison ruby')).toHaveCount(0);
  await expect(page.locator('.ct-comparison')).toContainText('在“得到”中读 dé');
  await page.getByRole('tab', { name: '练习', exact: true }).click();
  await setLearningPreference(page, 'showPinyin', true);
  await expect(page.locator('.ct-comparison')).toHaveCount(0);
  await expect(page.locator('.ct-quiz ruby')).toHaveCount(0);
  const round = (await stored(page)).topics['character-readings'].round;
  await page.locator('.ct-quiz').getByRole('button', { name: round.questions[0].answer, exact: true }).click();
  expect((await stored(page)).topics['character-readings'].round.responses[0].correct).toBe(true);
});

test('古诗原文、拼音、遮文背诵与草稿独立保存，手机七言诗不溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await expect(page.locator('.ct-lesson')).toHaveClass(/ct-sentence-card/);
  await expect(page.locator('.ct-poem-author')).toHaveText('唐 · 骆宾王');
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(18);
  await page.locator('#ct-draft').fill('我看到白鹅的红脚掌划开水面。');
  await page.locator('[data-action="ct-activity-recite"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ct-poem-lines')).toContainText('原文已遮住');
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-action="ct-activity-recite"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#ct-draft')).toHaveValue('我看到白鹅的红脚掌划开水面。');
  await page.locator('[data-action="ct-next"]').click();
  expect(await poemText(page)).toContain('春眠不觉晓');
  await expect(page.locator('#ct-draft')).toHaveValue('');
  await page.locator('[data-action="ct-lesson"][data-id$=":little-pond"]').click();
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(28);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const rows = await page.locator('.ct-poem-lines > p').evaluateAll(elements => elements.map(element =>
    new Set([...element.querySelectorAll('ruby')].map(ruby => Math.round(ruby.getBoundingClientRect().top))).size));
  await page.screenshot({ path: 'artifacts/literacy-poetry-mobile.png', fullPage: true });
  expect(rows).toEqual([1, 1, 1, 1]);
  await setLearningPreference(page, 'showPinyin', false);
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(0);
  await expect(page.locator('.ct-poem-lines')).toContainText('早有蜻蜓立上头');
  await page.locator('[data-action="ct-lesson"][data-id$=":goose"]').click();
  await expect(page.locator('.ct-poem-lines')).toContainText('原文已遮住');
  await page.locator('[data-action="ct-activity-recite"]').click();
  expect(await poemText(page)).toContain('曲项向天歌');
  const root = await stored(page);
  expect(root.topics['poetry-culture'].known).toEqual([]);
  expect(root.history).toEqual([]);
  expect(root.rewards.events).toEqual([]);
});

test('文化各小节自由进入，古诗草稿和背诵状态随全局清空重置', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await page.locator('#ct-draft').fill('白鹅在水中游。');
  await page.locator('[data-action="ct-activity-recite"]').click();
  for (const [category, text] of [['festivals', '农历正月十五'], ['stories', '守株待兔'], ['sayings', '熟能生巧']]) {
    await page.locator(`.nav-tabs [data-action="ct-category"][data-id="${category}"]`).click();
    await expect(page.locator('.ct-lesson')).toContainText(text);
    await expect(page.locator('.ct-poem')).toHaveCount(0);
  }
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  expect((await stored(page)).topics['poetry-culture'].activities).toEqual({});
  await selectTopic(page, '古诗与传统文化');
  expect(await poemText(page)).toContain('曲项向天歌');
  await expect(page.locator('#ct-draft')).toHaveValue('');
});

test('示范朗读支持常速慢速停止，切换内容不串音、不改变学习成绩', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.poetryPlayers = [];
    window.Audio = function (...args) {
      const audio = new NativeAudio(...args);
      window.poetryPlayers.push(audio);
      return audio;
    };
  });
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  const before = await stored(page);
  expect(await page.evaluate(() => window.poetryPlayers.length)).toBe(0);
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('正在朗读');
  expect(await page.evaluate(() => window.poetryPlayers.at(-1).playbackRate)).toBe(1);
  await setLearningPreference(page, 'slow', true);
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('正在朗读');
  expect(await page.evaluate(() => window.poetryPlayers.at(-1).playbackRate)).toBe(0.8);
  expect(await page.evaluate(() => window.poetryPlayers[0].paused)).toBe(true);
  await page.getByRole('button', { name: '停止朗读', exact: true }).click();
  expect(await page.evaluate(() => window.poetryPlayers.every(audio => audio.paused))).toBe(true);
  await expect(page.getByRole('button', { name: '停止朗读', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('正在朗读');
  await page.locator('[data-action="ct-next"]').click();
  expect(await page.evaluate(() => window.poetryPlayers.every(audio => audio.paused))).toBe(true);
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('正在朗读');
  await selectTopic(page, '形近字辨析');
  expect(await page.evaluate(() => window.poetryPlayers.every(audio => audio.paused))).toBe(true);
  const after = await stored(page);
  expect(after.rewards.events).toEqual(before.rewards.events);
  expect(after.topics['poetry-culture'].known).toEqual(before.topics['poetry-culture'].known);
  expect(after.topics['poetry-culture'].mistakes).toEqual([]);
});

test('朗读资源失败有提示，可以重试恢复', async ({ page }) => {
  await page.route('**/audio/poetry/goose.wav', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('朗读播放失败');
  await expect(page.getByRole('button', { name: '停止朗读', exact: true })).toBeDisabled();
  await page.unroute('**/audio/poetry/goose.wav');
  await page.getByRole('button', { name: '听示范朗读', exact: true }).click();
  await expect(page.locator('.ct-poem-audio-status')).toContainText('正在朗读');
  await page.getByRole('button', { name: '停止朗读', exact: true }).click();
});

test('全部古诗录音可以真实解码且有声音，新增课程可直接选择', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const manifest = await fetch('/audio/poetry/manifest.json').then(response => response.json());
    const context = new AudioContext();
    try {
      const results = [];
      for (const [id, entry] of Object.entries(manifest.files)) {
        const response = await fetch(entry.path);
        if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
        const decoded = await context.decodeAudioData(await response.arrayBuffer());
        const samples = decoded.getChannelData(0);
        let peak = 0;
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
        results.push({ id, duration: decoded.duration, peak });
      }
      return results;
    } finally { await context.close(); }
  });
  expect(results).toHaveLength(poems.length);
  for (const result of results) {
    expect(result.duration, result.id).toBeGreaterThan(5);
    expect(result.duration, result.id).toBeLessThan(60);
    expect(result.peak, result.id).toBeGreaterThan(0.01);
  }
  await selectTopic(page, '古诗与传统文化');
  await page.locator('[data-action="ct-lesson"][data-id$=":willow"]').click();
  expect(await poemText(page)).toContain('二月春风似剪刀');
  await page.screenshot({ path: 'artifacts/poetry-audio-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.locator('[data-action="ct-lesson"][data-id$=":orioles"]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/poetry-audio-mobile.png', fullPage: true });
  await page.locator('.nav-tabs [data-action="ct-category"][data-id="stories"]').click();
  await expect(page.locator('.ct-lesson-list [data-action="ct-lesson"]')).toHaveCount(10);
  await page.locator('[data-action="ct-lesson"][data-id$=":cups-snake"]').click();
  await expect(page.locator('.ct-lesson')).toContainText('墙上的弓');
  await expect(page.locator('.ct-poem-audio')).toHaveCount(0);
});
