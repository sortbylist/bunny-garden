import { test, expect } from '@playwright/test';

for (const width of [320, 390, 440, 480, 760, 820, 1030, 1100, 1440]) {
  test(`拼音卡片在 ${width}px 宽度下保持单行且不溢出`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('[data-action="map-group"][data-id="all"]').click();
    await expect(page.getByRole('button', { name: '学习 yuan', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const invalidTiles = await page.locator('.letter-tile').evaluateAll(tiles => tiles.flatMap(tile => {
      const text = tile.firstChild;
      const range = document.createRange();
      range.selectNodeContents(text);
      const lines = [...range.getClientRects()];
      const bounds = tile.getBoundingClientRect();
      const fits = lines.length === 1 && lines.every(line =>
        line.left >= bounds.left && line.right <= bounds.right &&
        line.top >= bounds.top && line.bottom <= bounds.bottom);
      return fits && bounds.width >= 44 && bounds.height >= 44
        ? []
        : [{ text: text.textContent, lines: lines.length, width: bounds.width, height: bounds.height }];
    }));

    if (width === 390) {
      await page.locator('.pinyin-map').screenshot({ path: testInfo.outputPath('pinyin-map.png') });
    }
    expect(invalidTiles).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: '学习 yuan', exact: true }).click();
    await expect(page.locator('.pinyin-display')).toHaveText('yuan');
    await expect(page.getByRole('button', { name: '学习 yuan', exact: true })).toHaveAttribute('aria-current', 'true');
  });
}
