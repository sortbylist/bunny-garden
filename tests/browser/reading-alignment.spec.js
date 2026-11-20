import { test, expect } from '@playwright/test';
import { selectTopic, setLearningPreference } from './helpers.js';

async function cardMetrics(cards) {
  return cards.evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textBounds = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim() || walker.currentNode.parentElement.closest('rp')) continue;
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      textBounds.push(...range.getClientRects());
    }
    return {
      text: element.textContent,
      ruby: !!element.querySelector('ruby'),
      reserved: element.classList.contains('has-reading-row'),
      row: element.offsetTop,
      height: bounds.height,
      top: Math.min(...textBounds.map(rect => rect.top)) - bounds.top,
      bottom: Math.max(...textBounds.map(rect => rect.bottom)) - bounds.top,
      borderTop: parseFloat(style.borderTopWidth),
      borderBottom: parseFloat(style.borderBottomWidth),
      padding: parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
    };
  }));
}

async function expectReadingRows(cards) {
  await expect.poll(async () => {
    const metrics = await cardMetrics(cards);
    return metrics.every(card => card.reserved === metrics.some(other => other.row === card.row && other.ruby));
  }).toBe(true);
  const metrics = await cardMetrics(cards);
  for (const rowTop of new Set(metrics.map(card => card.row))) {
    const row = metrics.filter(card => card.row === rowTop);
    const hasReading = row.some(card => card.ruby);
    expect(Math.max(...row.map(card => card.height)) - Math.min(...row.map(card => card.height))).toBeLessThanOrEqual(1);
    for (const card of row) {
      expect(card.padding, card.text).toBe(hasReading ? 12 : 0);
      expect(card.top, card.text).toBeGreaterThanOrEqual(card.borderTop);
      expect(card.bottom, card.text).toBeLessThanOrEqual(card.height - card.borderBottom);
    }
    const top = Math.min(...row.map(card => card.top));
    const bottom = Math.max(...row.map(card => card.bottom));
    const innerTop = row[0].borderTop;
    const innerBottom = row[0].height - row[0].borderBottom;
    expect(Math.abs((top + bottom - innerTop - innerBottom) / 2), JSON.stringify(row)).toBeLessThanOrEqual(2);
  }
  return metrics;
}

test('词语搭配卡片仅在当前行有拼音时统一留高，换行和开关后重新计算', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await selectTopic(page, '词语搭配与辨析');
  await page.evaluate(() => document.fonts.ready);
  const cards = page.locator('.ct-lesson-list .hz-chip');
  for (const width of [390, 820, 1440, 320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const enabled = await expectReadingRows(cards);
    expect(enabled.some(card => card.ruby)).toBe(true);
    expect(enabled.some(card => !card.reserved)).toBe(true);
    await cards.filter({ has: page.locator('ruby') }).first().scrollIntoViewIfNeeded();
    await page.locator('.ct-lesson-list').screenshot({ path: testInfo.outputPath(`reading-${width}.png`) });
    await setLearningPreference(page, 'showPinyin', false);
    const disabled = await expectReadingRows(cards);
    for (const [index, card] of disabled.entries()) {
      expect(card.ruby).toBe(false);
      expect(enabled[index].height - card.height, card.text).toBeCloseTo(enabled[index].reserved ? 12 : 0, 0);
    }
    await setLearningPreference(page, 'showPinyin', true);
    await expectReadingRows(cards);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  for (const topic of ['词语搭配与辨析', '汉字笔画与结构', '句式积累与仿写']) {
    test(`${width}px ${topic}整行没有注音时不预留拼音高度`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/');
      await selectTopic(page, topic);
      if (topic === '词语搭配与辨析') {
        await page.locator('[data-action="ct-category"][data-id="de"]').click();
      }
      await page.evaluate(() => document.fonts.ready);
      const cards = page.locator('.hz-item-list .hz-chip');
      const enabled = await expectReadingRows(cards);
      expect(enabled.every(card => !card.ruby && !card.reserved)).toBe(true);
      await setLearningPreference(page, 'showPinyin', false);
      const disabled = await expectReadingRows(cards);
      expect(disabled.map(card => card.height)).toEqual(enabled.map(card => card.height));
    });
  }
}
