import { test, expect } from '@playwright/test';
import { selectTopic, stored } from './helpers.js';

for (const width of [320, 390, 820, 1440]) {
  test(`拼音开关在 ${width}px 标题区内显示且不独占工具行`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    for (const name of ['汉字笔画与结构', '查字典', '词语积累与分类', '比喻、拟人与生动表达', '段落理解与顺序整理']) {
      await selectTopic(page, name);
      const heading = page.locator('.learning-heading');
      const toggle = heading.getByRole('switch', { name: '拼音辅助' });
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeChecked();
      await expect(page.locator('.ct-tools')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const bounds = await heading.evaluate(element => {
        const rect = selector => {
          const { x, y, width: elementWidth, height } = element.querySelector(selector).getBoundingClientRect();
          return { x, y, width: elementWidth, height };
        };
        return { title: rect('h1'), eyebrow: rect('.eyebrow'), toggle: rect('.reading-toggle') };
      });
      expect(bounds.toggle.width).toBeGreaterThanOrEqual(44);
      expect(bounds.toggle.height).toBeGreaterThanOrEqual(44);
      if (width <= 600) {
        expect(bounds.toggle.y + bounds.toggle.height).toBeLessThanOrEqual(bounds.title.y + 1);
        expect(bounds.eyebrow.x + bounds.eyebrow.width).toBeLessThanOrEqual(bounds.toggle.x);
      } else {
        expect(bounds.title.x + bounds.title.width).toBeLessThanOrEqual(bounds.toggle.x);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (name === '比喻、拟人与生动表达') {
        await heading.screenshot({ path: testInfo.outputPath('pinyin-heading.png') });
      }
    }
  });
}

test('标题拼音开关支持键盘、刷新恢复和练习页切换', async ({ page }) => {
  await page.goto('/');
  for (const [name, prefix] of [['汉字笔画与结构', 'hz'], ['词语积累与分类', 'ct']]) {
    await selectTopic(page, name);
    const toggle = page.getByRole('switch', { name: '拼音辅助' });
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).not.toBeChecked();
    await expect(page.locator('.hanzi-page ruby, .chinese-topic ruby')).toHaveCount(0);
    await page.reload();
    await expect(toggle).not.toBeChecked();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toBeChecked();
    await page.locator(`[data-action="${prefix}-start"][data-id="all"]`).click();
    await expect(page.locator('.page-heading .reading-toggle')).toHaveCount(1);
    await expect(page.locator('.ct-tools .reading-toggle')).toHaveCount(0);
    await expect(page.locator(`[data-action="${prefix}-length"]`)).toHaveCount(3);
    const before = await stored(page);
    const questions = prefix === 'hz' ? before.hanzi.round.questions : before.topics['word-categories'].round.questions;
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    const after = await stored(page);
    expect(prefix === 'hz' ? after.hanzi.round.questions : after.topics['word-categories'].round.questions).toEqual(questions);
  }
});
