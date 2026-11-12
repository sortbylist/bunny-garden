import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { stored, selectTopic } from './helpers.js';

test('句子主题归入独立分类，目录和学习操作不影响草稿与选择', async ({ page }) => {
  const topic = chineseTopics.filter(item => item.stage.startsWith('第二阶段')).at(-1);
  await page.goto('/');
  await selectTopic(page, topic.name);
  await expect(page.getByRole('tab')).toHaveCount(5);
  await expect(page.getByRole('tab', { name: topic.name, exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.feature-navigation .nav-catalog-picker summary').click();
  await expect(page.locator('.feature-navigation .nav-catalog')).toBeVisible();
  await page.locator('#ct-draft').click();
  await page.locator('#ct-draft').fill('我写下了自己的句子。');
  await expect(page.getByRole('tab')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('#ct-draft')).toHaveValue('我写下了自己的句子。');
  await expect(page.getByRole('tab', { name: topic.name, exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('词块可键盘排序、纠错、撤回，并恢复另一种正确顺序', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '连词成句与补全句子');
  await expect(page.locator('.eyebrow')).toContainText('第二阶段');
  await expect(page.locator('[data-action="ct-activity-check"]')).toBeDisabled();
  for (const index of [0, 1, 2]) await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).click();
  await page.locator('[data-action="ct-activity-check"]').click();
  await expect(page.locator('.ct-order-feedback')).toContainText('再想一想');
  await page.locator('[data-action="ct-activity-clear"]').click();
  for (const index of [2, 1, 0]) {
    await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-action="ct-activity-check"]').click();
  await expect(page.locator('.ct-order-feedback')).toContainText('通顺啦');
  await page.locator('[data-action="ct-activity-undo"]').click();
  await expect(page.locator('.ct-built')).toHaveText('妹妹画。');
  await page.locator('[data-action="ct-lesson"][data-id$=":when"]').click();
  for (const index of [1, 2, 0]) await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).click();
  await page.locator('[data-action="ct-activity-check"]').click();
  await page.reload();
  await expect(page.locator('.ct-built')).toHaveText('今天我们去公园。');
  await expect(page.locator('.ct-order-feedback')).toContainText('通顺啦');
  expect((await stored(page)).history).toEqual([]);
});

for (const topic of chineseTopics.filter(topic => topic.stage.startsWith('第二阶段'))) {
  test(`${topic.name}：手机表达草稿、参考表达、安全渲染与清空`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    await page.goto('/');
    await selectTopic(page, topic.name);
    const lessons = topic.lessons.filter(lesson => lesson.activity.type === 'write');
    const first = lessons[0];
    await page.locator(`[data-action="ct-category"][data-id="${first.category}"]`).click();
    await page.locator(`[data-action="ct-lesson"][data-id="${first.id}"]`).click();
    const text = '我在花园里观察蝴蝶。<img src=x onerror=alert(1)>';
    await page.locator('#ct-draft').fill(text);
    await page.locator('[data-action="ct-activity-example"]').click();
    await expect(page.locator('.ct-sample')).toContainText(first.activity.sample);
    await page.reload();
    await expect(page.locator('#ct-draft')).toHaveValue(text);
    await expect(page.locator('.ct-activity img')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="ct-next"]').click();
    await expect(page.locator('#ct-draft')).toHaveValue('');
    await page.locator('[data-action="ct-previous"]').click();
    await expect(page.locator('#ct-draft')).toHaveValue(text);
    expect((await stored(page)).topics[topic.id].known).toEqual([]);
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.locator('[data-action="settings"]').click();
    await page.locator('[data-action="reset-confirm"]').click();
    await page.locator('[data-action="reset-all"]').click();
    expect((await stored(page)).topics[topic.id].activities).toEqual({});
  });
}
