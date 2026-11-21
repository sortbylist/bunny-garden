import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { hanziCategories } from '../../src/hanzi-data.js';
import { selectTopic } from './helpers.js';

const paint = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return Object.fromEntries(['backgroundColor', 'borderColor', 'borderRadius', 'boxShadow', 'fontSize', 'fontWeight', 'padding', 'minHeight'].map(property => [property, style[property]]));
});

for (const [topic, prefix] of [['查字典', 'ct'], ['汉字笔画与结构', 'hz']]) {
  test(`${topic}统一按钮后仍可标记、翻页和开始本节练习`, async ({ page }) => {
    await page.goto('/');
    await selectTopic(page, topic);
    const known = page.locator(`[data-action="${prefix}-known"]`);
    await expect(known).toHaveAttribute('aria-pressed', 'false');
    await known.click();
    await expect(known).toHaveAttribute('aria-pressed', 'true');
    await expect(known).toContainText('已经认识啦');
    await page.reload();
    await expect(known).toHaveAttribute('aria-pressed', 'true');
    await page.locator(`[data-action="${prefix}-next"]`).click();
    await expect(known).toHaveAttribute('aria-pressed', 'false');
    await page.locator(`[data-action="${prefix}-previous"]`).click();
    await expect(known).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`[data-action="${prefix}-previous"]`)).toBeDisabled();
    await page.locator(`.mastery-actions [data-action="${prefix}-start"]`).click();
    await expect(page.locator(prefix === 'ct' ? '.ct-quiz' : '.hz-quiz')).toBeVisible();
  });
}

async function chooseSubject(page, subject) {
  if (await page.locator('.mobile-toggle').isVisible()) await page.locator('.mobile-toggle').click();
  await page.locator(`[data-action="subject"][data-id="${subject}"]`).click();
}

async function checkActions(page, prefix, reference, label) {
  const known = page.locator(`[data-action="${prefix}-known"]`);
  const actions = page.locator('.hz-card > .mastery-actions');
  const navigation = page.locator('.hz-card > .card-navigation');
  await expect(actions, label).toHaveCount(1);
  await expect(actions.locator('button'), label).toHaveCount(2);
  const practice = actions.locator(`[data-action="${prefix}-start"]`);
  await expect(practice, label).toHaveText('开始本节练习');
  await expect(known.locator('.icon'), label).toHaveCount(1);
  await expect(practice.locator('.icon'), label).toHaveCount(1);
  expect(await paint(known), label).toEqual(reference.known);
  expect(await paint(practice), label).toEqual(reference.practice);
  const knownBounds = await known.boundingBox();
  const practiceBounds = await practice.boundingBox();
  expect(Math.abs(knownBounds.y - practiceBounds.y), label).toBeLessThan(1);
  expect(Math.abs(knownBounds.height - practiceBounds.height), label).toBeLessThan(1);
  expect(practiceBounds.x, label).toBeGreaterThan(knownBounds.x + knownBounds.width);
  await expect(navigation, label).toHaveCSS('border-top-style', 'dashed');
  await expect(navigation.locator('button'), label).toHaveCount(2);
  await expect(navigation.locator('.icon'), label).toHaveCount(2);
  expect((await navigation.boundingBox()).y, label).toBeGreaterThanOrEqual(knownBounds.y + knownBounds.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBe(true);
}

for (const width of [1440, 820, 320]) {
  test(`${width}px 所有学习卡的认识、练习及翻页按钮统一`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await selectTopic(page, '句式积累与仿写');
    const reference = {
      known: await paint(page.locator('[data-action="ct-known"]')),
      practice: await paint(page.locator('.mastery-actions [data-action="ct-start"]')),
    };
    for (const [subject, topics] of [['chinese', chineseTopics], ['math', mathTopics]]) {
      if (subject === 'math') await chooseSubject(page, subject);
      for (const topic of topics) {
        await selectTopic(page, topic.name, subject);
        for (const category of topic.categories) {
          await page.locator(`[data-action="ct-category"][data-id="${category.id}"]`).click();
          await checkActions(page, 'ct', reference, `${topic.name} / ${category.name}`);
        }
        if (['dictionary', 'sentence-patterns', 'math-numbers'].includes(topic.id)) {
          await page.locator('.ct-lesson').screenshot({ path: testInfo.outputPath(`${topic.id}-actions.png`) });
        }
      }
    }
    await chooseSubject(page, 'chinese');
    await selectTopic(page, '汉字笔画与结构');
    for (const category of hanziCategories) {
      await page.locator(`[data-action="hz-category"][data-id="${category.id}"]`).click();
      await checkActions(page, 'hz', reference, category.name);
    }
    await page.locator('[aria-label="汉字学习卡"]').screenshot({ path: testInfo.outputPath('hanzi-actions.png') });
  });
}
