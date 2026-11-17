import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`重新开始图标在 ${width}px 下呈现完整回转箭头并保留确认操作`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/');
    const restart = page.getByRole('button', { name: '重新开始本轮', exact: true });
    await expect(restart).toBeVisible();
    const geometry = await restart.locator('svg').evaluate(svg => {
      const bounds = svg.getBBox();
      const longestStroke = Math.max(...[...svg.querySelectorAll('path')].flatMap(path =>
        path.getAttribute('d').split(/(?=M)/i).filter(Boolean).map(segment => {
          const probe = path.cloneNode();
          probe.setAttribute('d', segment);
          return probe.getTotalLength();
        })));
      return { longestStroke, left: bounds.x, top: bounds.y, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height };
    });
    await restart.screenshot({ path: testInfo.outputPath('restart-icon.png') });
    expect(geometry.longestStroke).toBeGreaterThan(35);
    expect(geometry.left).toBeGreaterThanOrEqual(1);
    expect(geometry.top).toBeGreaterThanOrEqual(1);
    expect(geometry.right).toBeLessThanOrEqual(23);
    expect(geometry.bottom).toBeLessThanOrEqual(23);
    await restart.click();
    await expect(page.getByRole('dialog')).toContainText('重新开始这一轮？');
    await page.getByRole('button', { name: '继续当前练习', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
}
