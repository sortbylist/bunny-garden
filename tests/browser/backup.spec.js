import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { defaultState } from '../../src/engine.js';
import { basics } from '../../src/data.js';
import { createHanziState } from '../../src/hanzi-engine.js';
import { hanziLessons } from '../../src/hanzi-data.js';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { topicDefaults } from '../../src/chinese-engine.js';
import { phonicsWords } from '../../src/phonics-data.js';
import { initializeRewards, equipReward } from '../../src/rewards.js';
import { createBackup } from '../../src/backup.js';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('bunny-garden-v1')));
const openSettings = page => page.locator('[data-action="settings"]').click();
const upload = (page, text) => page.locator('#backup-file').setInputFiles({ name: '备份.json', mimeType: 'application/json', buffer: Buffer.from(text) });

async function exportFile(page) {
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export-backup"]').click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/完整备份.*\.json$/);
  const text = await readFile(await download.path(), 'utf8');
  const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(JSON.parse(text).producerVersion).toBe(manifest.version);
  return text;
}

test('完整导出、清空、重新导入恢复配置、三科进度、草稿与奖励且刷新保持', async ({ page }) => {
  const garden = defaultState();
  garden.nickname = '完整备份小兔';
  garden.known = [basics[0].id];
  garden.favorites = [basics[1].id];
  garden.settings = { slow: true, effects: false, continuous: false, animations: false };
  garden.hanzi = createHanziState();
  garden.hanzi.known = [hanziLessons[0].id];
  garden.topics = Object.fromEntries([...chineseTopics, ...mathTopics].map(topic => [topic.id, topicDefaults(topic)]));
  const writingTopic = chineseTopics.find(topic => topic.lessons.some(lesson => lesson.activity?.type === 'write'));
  const writingLesson = writingTopic.lessons.find(lesson => lesson.activity?.type === 'write');
  garden.topics[writingTopic.id].activities[writingLesson.id] = { text: '我要保留的写作草稿', order: [], checked: false, showExample: false };
  garden.topics[mathTopics[0].id].known = [mathTopics[0].lessons[0].id];
  const english = garden.phonics;
  english.known = [phonicsWords[0].id];
  english.favorites = [phonicsWords[1].id];
  english.slow = true;
  english.reviews['rule-1'] = { success: 1, due: Date.now() + 86400000 };
  initializeRewards(garden);
  equipReward(garden.rewards, 'hello-bunny');
  await page.addInitScript(state => {
    if (sessionStorage.getItem('seeded-backup')) return;
    localStorage.setItem('bunny-garden-v1', JSON.stringify(state));
    sessionStorage.setItem('seeded-backup', 'yes');
  }, garden);
  await page.goto('/');
  await expect(page.locator('.my-menu-toggle')).toContainText(garden.nickname);
  await openSettings(page);
  const text = await exportFile(page);
  const backup = JSON.parse(text);
  expect(backup.data.topics[writingTopic.id].activities[writingLesson.id].text).toBe('我要保留的写作草稿');
  expect(backup.data.phonics.known).toEqual(english.known);
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  expect((await saved(page)).known).toEqual([]);
  expect((await saved(page)).phonics.known).toEqual([]);
  await openSettings(page);
  await upload(page, text);
  await expect(page.locator('#dialog')).toContainText('替换当前数据');
  await Promise.all([page.waitForEvent('load'), page.locator('[data-action="confirm-import"]').click()]);
  await expect(page.locator('.my-menu-toggle')).toContainText(garden.nickname);
  const restored = await saved(page);
  expect(restored).toEqual(backup.data);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['bunny-garden-v1']);
  await page.reload();
  expect(await saved(page)).toEqual(restored);
});

test('v1 备份在当前页面导入，补新字段并保留奖励和学习选择', async ({ page }) => {
  const text = await readFile(new URL('../fixtures/backup-v1.json', import.meta.url), 'utf8');
  await page.goto('/');
  await openSettings(page);
  await upload(page, text);
  await Promise.all([page.waitForEvent('load'), page.locator('[data-action="confirm-import"]').click()]);
  await expect(page.locator('.my-menu-toggle')).toContainText('历史小兔');
  const main = await saved(page);
  expect(main.mode).toBe('sequence');
  expect(main.group).toBe('initial');
  expect(main.settings).toEqual({ slow: true, effects: false, continuous: false, animations: true });
  expect(main.rewards.equipped.sticker).toBe('curious-glass');
  await openSettings(page);
  const exported = JSON.parse(await exportFile(page));
  expect(exported.data.phonics.lessonId).toBe('lesson-2');
});

test('损坏与未来版本不修改记录，取消导入不覆盖，确认昵称按文本展示', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  const before = await saved(page);
  await upload(page, '{broken');
  await expect(page.locator('#backup-error')).toContainText('无法读取 JSON');
  const future = JSON.parse(createBackup(defaultState()));
  future.version = 999;
  await upload(page, JSON.stringify(future));
  await expect(page.locator('#backup-error')).toContainText('不支持此备份版本');
  expect(await saved(page)).toEqual(before);
  const garden = defaultState();
  garden.nickname = '<img src=x onerror=alert(1)>';
  await upload(page, createBackup(garden));
  await expect(page.locator('#dialog')).toContainText(garden.nickname);
  await expect(page.locator('#dialog img')).toHaveCount(0);
  await page.getByRole('button', { name: '取消，返回设置', exact: true }).click();
  expect(await saved(page)).toEqual(before);
});

test('存储空间不足时单次写入失败，不刷新页面或丢失原记录', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  const before = await saved(page);
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (storageKey, value) {
      if (storageKey === 'bunny-garden-v1') throw new DOMException('Storage full', 'QuotaExceededError');
      return write.call(this, storageKey, value);
    };
  });
  await upload(page, createBackup(defaultState()));
  await page.locator('[data-action="confirm-import"]').click();
  await expect(page.locator('#backup-error')).toContainText('原有记录已保留');
  expect(await saved(page)).toEqual(before);
});

test('手机端设置可找到备份入口，弹窗无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-action="mobile-menu"]').click();
  await openSettings(page);
  await expect(page.locator('[data-action="export-backup"]')).toBeVisible();
  await expect(page.locator('[data-action="choose-backup"]')).toBeVisible();
  expect(await page.locator('#dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
