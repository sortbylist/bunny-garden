import { test, expect } from '@playwright/test';
import { selectTopic, setLearningPreference, stored } from './helpers.js';

test('拼音辅助只在学习设置中显示，关闭后跨主题生效并支持刷新恢复', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '汉字笔画与结构');
  await expect(page.locator('.hanzi-page ruby').first()).toBeVisible();
  await expect(page.getByRole('switch', { name: '拼音辅助' })).toHaveCount(0);
  await setLearningPreference(page, 'showPinyin', false);
  await expect(page.locator('.hanzi-page ruby')).toHaveCount(0);
  await selectTopic(page, '词语积累与分类');
  await expect(page.locator('.chinese-topic ruby')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.chinese-topic ruby')).toHaveCount(0);
  expect((await stored(page)).settings.showPinyin).toBe(false);
  await page.locator('[data-action="ct-start"][data-id="all"]').click();
  const questions = (await stored(page)).topics['word-categories'].round.questions;
  await setLearningPreference(page, 'showPinyin', true);
  expect((await stored(page)).topics['word-categories'].round.questions).toEqual(questions);
  await selectTopic(page, '汉字笔画与结构');
  await expect(page.locator('.hanzi-page ruby').first()).toBeVisible();
});
