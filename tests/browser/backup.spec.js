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
import { appStorageKey } from '../../src/storage.js';
import { seedStoredState, selectTopic, stored, storedDocument as saved } from './helpers.js';

const openSettings = page => page.locator('[data-action="settings"]').click();
const upload = (page, text) => page.locator('#backup-file').setInputFiles({ name: '备份.json', mimeType: 'application/json', buffer: Buffer.from(text) });

async function exportFile(page) {
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export-backup"]').click();
  const download = await downloaded;
  const text = await readFile(await download.path(), 'utf8');
  const { exportedAt, producerVersion } = JSON.parse(text);
  expect(download.suggestedFilename()).toBe(`小兔学习乐园-完整备份-${exportedAt.replace(/[:.]/g, '-')}.json`);
  const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(producerVersion).toBe(manifest.version);
  return text;
}

test.describe('本地导出时间', () => {
  test.use({ timezoneId: 'Asia/Kolkata' });

  test('JSON 和文件名使用系统时区的日期、时间和偏移', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-21T20:34:56.789Z'));
    await page.goto('/');
    await openSettings(page);
    const { exportedAt } = JSON.parse(await exportFile(page));
    expect(exportedAt).toBe('2026-11-22T02:04:56.789+05:30');
  });
});

test('完整导出、清空、重新导入恢复配置、三科进度、草稿与奖励且刷新保持', async ({ page }) => {
  const garden = defaultState();
  garden.nickname = '完整备份小兔';
  garden.known = [basics[0].id];
  garden.favorites = [basics[1].id];
  Object.assign(garden.settings, { slow: true, effects: false, animations: false });
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
  english.reviews['rule-1'] = { success: 1, due: Date.now() + 86400000 };
  initializeRewards(garden);
  equipReward(garden.rewards, 'hello-bunny');
  await seedStoredState(page, garden);
  await page.goto('/');
  await expect(page.locator('.my-menu-toggle')).toContainText(garden.nickname);
  await page.locator('.subjects [data-id="math"]').click();
  const mathStages = page.locator('[data-navigation="features-math"] .nav-group-picker summary');
  await expect(mathStages).toHaveAccessibleName('选择数学阶段，当前：第一阶段 · 数与运算');
  await mathStages.click();
  const mathStage = page.locator('[data-navigation="features-math"] .nav-group-item');
  await expect(mathStage).toHaveCount(1);
  await expect(mathStage).toContainText('第一阶段 · 5 个主题');
  await mathStage.click();
  await selectTopic(page, '加减法', 'math');
  await page.locator('.subjects [data-id="english"]').click();
  await selectTopic(page, '主题词汇', 'english');
  await page.locator('.subjects [data-id="chinese"]').click();
  await openSettings(page);
  const text = await exportFile(page);
  const backup = JSON.parse(text);
  expect(backup.data).toEqual(await saved(page));
  expect(backup.data.subjects.math.selectedStage).toBe('math-1');
  expect(backup.data.subjects.math.stages['math-1'].selectedTopic).toBe(mathTopics[1].id);
  expect(backup.data.subjects.english.selectedStage).toBe('english-1');
  expect(backup.data.subjects.english.stages['english-1'].selectedTopic).toBe('english-vocabulary');
  const chinese = backup.data.subjects.chinese.stages;
  const writing = Object.values(chinese).find(stage => stage.topics[writingTopic.id]).topics[writingTopic.id];
  expect(writing.categories[writingLesson.category].activities[writingLesson.id].text).toBe('我要保留的写作草稿');
  const phonics = backup.data.subjects.english.stages['english-1'].topics.phonics;
  expect(phonics.categories['lesson-1'].known).toEqual(english.known);
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  expect((await stored(page)).known).toEqual([]);
  expect((await stored(page)).phonics.known).toEqual([]);
  await openSettings(page);
  await upload(page, text);
  await expect(page.locator('#dialog')).toContainText('替换当前数据');
  await Promise.all([page.waitForEvent('load'), page.locator('[data-action="confirm-import"]').click()]);
  await expect(page.locator('.my-menu-toggle')).toContainText(garden.nickname);
  const restored = await saved(page);
  expect(restored).toEqual(backup.data);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([appStorageKey]);
  await page.reload();
  expect(await saved(page)).toEqual(restored);
  await page.locator('.subjects [data-id="math"]').click();
  await expect(page.getByRole('tab', { name: '加减法', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.getByRole('tab', { name: '主题词汇', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('拒绝未发布的双键结构并保留本机记录', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  const before = await saved(page);
  const backup = JSON.parse(createBackup(defaultState()));
  backup.data = { version: 1, settings: {}, sessions: {}, features: {} };
  await upload(page, JSON.stringify(backup));
  await expect(page.locator('#backup-error')).toContainText('学习数据不完整或格式有误');
  expect(await saved(page)).toEqual(before);
});

test('本机档读取失败时自动保存不会覆盖原档', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{"version":2}'), appStorageKey);
  await page.goto('/');
  await openSettings(page);
  await expect(page.getByRole('dialog')).toContainText('暂以临时模式学习');
  expect(await page.evaluate(key => localStorage.getItem(key), appStorageKey)).toBe('{"version":2}');
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
  await page.evaluate(key => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (storageKey, value) {
      if (storageKey === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return write.call(this, storageKey, value);
    };
  }, appStorageKey);
  await upload(page, createBackup(defaultState()));
  await page.locator('[data-action="confirm-import"]').click();
  await expect(page.locator('#backup-error')).toContainText('原有记录已保留');
  expect(await saved(page)).toEqual(before);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`学习设置按组展示，滚动可见备份操作（${viewport.width}×${viewport.height}）`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    if (viewport.width < 600) await page.locator('[data-action="mobile-menu"]').click();
    await openSettings(page);
    const dialog = page.getByRole('dialog', { name: '学习设置' });
    await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(['个人资料', '学习偏好', '数据备份', '数据清理']);
    for (const name of ['导出全部数据', '导入备份文件']) {
      const action = dialog.getByRole('region', { name: '数据备份' }).getByRole('button', { name, exact: true });
      await action.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await expect(action).toBeInViewport({ ratio: 1 });
    }
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}

test('取消文件选择保留设置、焦点和滚动位置，再按 Esc 才关闭设置', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await openSettings(page);
  const dialog = page.getByRole('dialog');
  const choose = dialog.getByRole('button', { name: '导入备份文件' });
  const before = await saved(page);
  await Promise.all([page.waitForEvent('filechooser'), choose.click()]);
  const scroll = await dialog.evaluate(element => element.scrollTop);
  await page.locator('#backup-file').dispatchEvent('cancel', { bubbles: true });
  await expect(dialog).toBeVisible();
  await expect(choose).toBeFocused();
  expect(await dialog.evaluate(element => element.scrollTop)).toBe(scroll);
  await expect(dialog.locator('#backup-error')).toBeEmpty();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
