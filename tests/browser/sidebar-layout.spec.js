import { test, expect } from '@playwright/test';

for (const [height, note] of [[1000, 'full'], [720, 'compact'], [600, 'hidden']]) {
  test(`展开侧栏在 ${height}px 高度下无需滚动即可使用`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height });
    await page.goto('/');
    const sidebar = page.locator('.sidebar');
    for (const name of ['语文', '数学', '英语', '学习设置', '关于学习乐园']) {
      await expect(sidebar.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 });
    }
    const card = sidebar.locator('.sidebar-note');
    if (note === 'hidden') await expect(card).toBeHidden();
    else {
      await expect(card).toBeInViewport({ ratio: 1 });
      await expect(card.locator('strong')).toBeVisible();
      await expect(card.locator('span')).toBeVisible({ visible: note === 'full' });
    }
    expect(await sidebar.evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
  });
}

test('矮窗口中侧栏与正文可以分别滚动', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  const sidePosition = () => sidebar.evaluate(element => element.scrollTop);
  const pagePosition = () => page.evaluate(() => window.scrollY);
  await sidebar.hover();
  await page.mouse.wheel(0, 800);
  await expect.poll(sidePosition).toBeGreaterThan(0);
  await expect(sidebar.getByRole('button', { name: '关于学习乐园' })).toBeInViewport({ ratio: 1 });
  const bottom = await sidePosition();
  await page.mouse.wheel(0, 400);
  await page.mouse.move(800, 280);
  await page.mouse.wheel(0, 300);
  await expect.poll(pagePosition).toBeGreaterThan(0);
  expect(await pagePosition()).toBeLessThanOrEqual(300);
  expect(await sidePosition()).toBe(bottom);
});
