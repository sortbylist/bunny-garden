import { test, expect } from '@playwright/test';
import { selectTopic } from './helpers.js';

async function clickWithoutJump(page, target) {
  await target.evaluate(element => window.scrollBy(0, element.getBoundingClientRect().top - 75));
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(0);
  await target.click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => scrollY)).toBe(before);
}

for (const width of [1280, 390]) {
  test(`拼音玩法在 ${width}px 切换后保持页面位置`, async ({ page }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto('/');
    const nav = page.locator('.mode-navigation');
    await clickWithoutJump(page, nav.locator('[data-id="initial"]'));
    await expect(nav.locator('[data-id="initial"][aria-pressed="true"]')).toHaveCount(1);
  });
}

test('语文汉字、语文主题、数学和英语的小分类均保持页面位置', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  for (const [subject, topic, action] of [
    ['chinese', '汉字笔画与结构', 'hz-category'], ['chinese', '近义词与反义词', 'ct-category'],
    ['math', null, 'ct-category'], ['english', null, 'ph-category'],
  ]) {
    await page.locator(`.sidebar [data-action="subject"][data-id="${subject}"]`).click();
    if (topic) await selectTopic(page, topic);
    const target = page.locator(`.play-selector [data-action="${action}"][aria-pressed="false"]`).first();
    const id = await target.getAttribute('data-id');
    await clickWithoutJump(page, target);
    await expect(page.locator(`.play-selector [data-action="${action}"][data-id="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
});
