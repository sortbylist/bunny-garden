import { test, expect } from '@playwright/test';
import { chooseMode, setRoundLength } from './helpers.js';

for (const width of [390, 1440]) {
  test(`拼音在 ${width}px 不显示常驻重开按钮，完成后保留再练入口`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/');
    await expect(page.locator('.study-card')).toBeVisible();
    await expect(page.locator('[data-action="restart"]')).toHaveCount(0);
    await chooseMode(page, 'listen');
    await setRoundLength(page, 5);
    for (let index = 0; index < 5; index++) {
      await page.locator('[data-action="skip"]').click();
      await page.locator('[data-action="next-question"]').click();
    }
    await expect(page.getByRole('button', { name: '再来一轮' })).toBeVisible();
  });
}
