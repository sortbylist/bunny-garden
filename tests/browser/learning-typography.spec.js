import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { hanziCategories } from '../../src/hanzi-data.js';
import { selectTopic } from './helpers.js';

const fontSizes = locator => locator.evaluateAll(elements => [...new Set(elements.map(element => getComputedStyle(element).fontSize))]);

async function chooseSubject(page, subject) {
  if (await page.locator('.mobile-toggle').isVisible()) await page.locator('.mobile-toggle').click();
  await page.locator(`.subjects [data-id="${subject}"]`).click();
}

test('语境分类的长短标题使用相同且适度缩小的字号', async ({ page }, testInfo) => {
  await page.goto('/');
  const topic = chineseTopics.find(item => item.id === 'word-relations');
  await selectTopic(page, topic.name);
  await page.locator('[data-action="ct-category"][data-id="context"]').click();
  await page.locator('.ct-lesson-list').screenshot({ path: testInfo.outputPath('context-cards.png') });
  expect(await fontSizes(page.locator('[data-action="ct-lesson"]'))).toEqual(['18px']);
  await page.locator('[data-action="ct-reading"]').click();
  expect(await fontSizes(page.locator('[data-action="ct-lesson"]'))).toEqual(['18px']);
});

for (const width of [1440, 820, 390, 320]) {
  test(`所有学科 ${width}px 分类卡片与选项字号按角色统一`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const cardSize = width <= 600 ? '16px' : '18px';
    const answerSize = width <= 600 ? '16px' : '18px';
    for (const subject of [{ id: 'chinese', topics: chineseTopics }, { id: 'math', topics: mathTopics }]) {
      if (subject.id !== 'chinese') await chooseSubject(page, subject.id);
      for (const topic of subject.topics) {
        await selectTopic(page, topic.name, subject.id);
        for (const category of topic.categories) {
          await page.locator(`[data-action="ct-category"][data-id="${category.id}"]`).click();
          const label = `${topic.name} / ${category.name}`;
          expect(await fontSizes(page.locator('[data-action="ct-lesson"]')), label).toEqual([cardSize]);
          await expect(page.locator('.ct-lesson-intro h3'), label).toHaveCSS('font-size', width <= 600 ? '22px' : '24px');
          const invalid = await page.locator('[data-action="ct-lesson"]').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1 || element.getBoundingClientRect().height < 44).map(element => element.textContent));
          expect(invalid, label).toEqual([]);
          if (topic.id === 'word-relations' && category.id === 'context') {
            await page.locator('.ct-lesson-list').screenshot({ path: testInfo.outputPath('context-cards.png') });
          }
          await page.locator(`[data-action="ct-start"][data-id="${category.id}"]`).click();
          expect(await fontSizes(page.locator('[data-action="ct-answer"]')), label).toEqual([answerSize]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), label).toBe(false);
        }
      }
    }
    await chooseSubject(page, 'chinese');
    await selectTopic(page, '汉字笔画与结构');
    for (const category of hanziCategories) {
      await page.locator(`[data-action="hz-category"][data-id="${category.id}"]`).click();
      expect(await fontSizes(page.locator('[data-action="hz-lesson"]')), category.name).toEqual([cardSize]);
      await page.locator(`[data-action="hz-start"][data-id="${category.id}"]`).click();
      expect(await fontSizes(page.locator('[data-action="hz-answer"]')), category.name).toEqual([answerSize]);
    }
    await chooseSubject(page, 'english');
    expect(await fontSizes(page.locator('.ph-word-tile'))).toEqual([cardSize]);
    await page.locator('[data-action="ph-mode"][data-id="rules"]').click();
    expect(await fontSizes(page.locator('.ph-option'))).toEqual([answerSize]);
  });
}
