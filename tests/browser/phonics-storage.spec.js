import { test, expect } from '@playwright/test';

test('英语随机词卡一轮不重复，切换课次不丢失当前轮', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await page.locator('.ph-modes [data-id="random"]').click();
  const words = [];
  for (let index = 0; index < 15; index++) {
    words.push(await page.locator('.ph-word').textContent());
    await page.locator('[data-action="ph-next"]').click();
  }
  expect(new Set(words).size).toBe(15);
  await expect(page.locator('.ph-finish')).toBeVisible();
  await page.locator('[data-action="ph-restart"]').first().click();
  await expect(page.locator('.ph-confirm')).toBeVisible();
  await page.locator('[data-action="ph-cancel-restart"]').click();
  await expect(page.locator('.ph-finish')).toBeVisible();
  await page.locator('[data-action="ph-restart"]').first().click();
  await page.locator('[data-action="ph-confirm-restart"]').click();
  await expect(page.locator('.ph-word')).toBeVisible();
  const savedWord = await page.locator('.ph-word').textContent();
  await page.locator('#ph-lesson-select').selectOption('lesson-2');
  await page.locator('#ph-lesson-select').selectOption('lesson-1');
  await expect(page.locator('.ph-word')).toHaveText(savedWord);
});

test('损坏英语记录降级，不妨碍语文；全局清空同时重置英语', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('injected-phonics')) {
      localStorage.setItem('bunny-phonics-gb-v1', '{broken');
      sessionStorage.setItem('injected-phonics', 'yes');
    }
  });
  await page.goto('/');
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('map');
  await page.locator('[data-action="ph-known"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('map');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bunny-phonics-gb-v1')).known)).toEqual([]);
});

test('英语未完成题首答与重试可在刷新后保持', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await page.locator('.ph-modes [data-id="rules"]').click();
  await page.locator('[data-action="ph-answer"][data-value="zee"]').click();
  await page.reload();
  await expect(page.locator('.ph-feedback')).toContainText('还差一点');
  await page.locator('[data-action="ph-skip"]').click();
  await page.reload();
  await expect(page.locator('.ph-feedback')).toContainText('先看看答案');
  await page.locator('[data-action="ph-next-question"]').click();
  await expect(page.locator('.ph-finish')).toContainText('0 / 1');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('bunny-phonics-gb-v1')).history);
  expect(history).toHaveLength(1);
  expect(history[0].skipped).toBe(0);
});
