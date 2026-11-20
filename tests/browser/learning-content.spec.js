import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { selectTopic, chooseMode, stored, setRoundLength } from './helpers.js';

const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
async function chooseSubject(page, id) {
  if (await page.locator('.mobile-toggle').isVisible() && !await page.locator('#app').evaluate(element => element.classList.contains('mobile-open'))) {
    await page.locator('.mobile-toggle').click();
  }
  await page.locator(`.subjects [data-id="${id}"]`).click();
}

test('词语分类新增六类，扩充词卡可学习、自评并恢复进度', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '词语积累与分类');
  await expect(page.locator('[data-action="ct-category"]')).toHaveCount(12);
  for (const category of ['people', 'animals', 'plants']) {
    await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
    await expect(page.locator('[data-action="ct-lesson"]')).toHaveCount(20);
  }
  for (const category of ['school', 'daily', 'food', 'transport', 'weather', 'places']) {
    await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
    await expect(page.locator('[data-action="ct-lesson"]')).toHaveCount(10);
    await expect(page.locator('.ct-lesson-list ruby')).not.toHaveCount(0);
    await expect(page.locator('.ct-lesson-intro h3')).not.toBeEmpty();
  }
  await page.getByRole('button', { name: '博物馆', exact: true }).click();
  await page.locator('[data-action="ct-known"]').click();
  await page.reload();
  await expect(page.locator('.ct-lesson-intro h3')).toHaveAttribute('aria-label', '博物馆');
  expect((await stored(page)).topics['word-categories'].known).toContain('word-categories:lesson:博物馆');
});

test('三十种偏旁部首均可访问，学习例字与对应练习齐全', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '汉字笔画与结构');
  await page.locator('[data-action="hz-category"][data-id="radicals"]').click();
  await expect(page.locator('[data-action="hz-lesson"]')).toHaveCount(30);
  for (const radical of ['氵', '囗', '钅', '衤', '礻', '⺮', '心']) {
    await page.locator(`[data-action="hz-lesson"][data-id="radical-${radical}"]`).click();
    await expect(page.locator('.hz-examples > span')).toHaveCount(6);
    await expect(page.locator('.hz-character')).toHaveText(radical);
  }
  await page.locator('[data-action="hz-start"][data-id="radicals"]').click();
  const questions = (await stored(page)).hanzi.round.questions;
  expect(questions).toHaveLength(10);
  expect(questions.every(question => question.category === 'radicals')).toBe(true);
});

test('所有语文和数学主题学习页隐藏题数，进入练习才显示并保留当前题目', async ({ page }) => {
  await page.goto('/');
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await expect(page.locator('.round-settings')).toHaveCount(0);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await expect(page.locator('.quiz-card + .round-settings')).toBeVisible();
    await expect(page.getByLabel('每轮题数')).toBeHidden();
    const before = (await stored(page)).topics[topic.id].round.questions;
    await setRoundLength(page, 20);
    expect((await stored(page)).topics[topic.id].round.questions).toEqual(before);
    await page.locator('[data-action="ct-learn"]').click();
    await expect(page.locator('.round-settings')).toHaveCount(0);
  }
  await page.locator('.subjects [data-id="math"]').click();
  for (const topic of mathTopics) {
    await selectTopic(page, topic.name, 'math');
    await expect(page.locator('.round-settings')).toHaveCount(0);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await expect(page.locator('.quiz-card + .round-settings')).toBeVisible();
    await expect(page.getByLabel('每轮题数')).toBeHidden();
    await page.locator('[data-action="ct-learn"]').click();
  }
});

for (const width of [1440, 820, 390, 320]) {
  test(`三科 ${width}px 学习字号适度，长段落字号保持且无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('.letter-tile').first()).toHaveCSS('font-size', '20px');
    await expect(page.locator('.example-tag')).toHaveCSS('font-size', '20px');
    const cardSize = width <= 600 ? 16 : 18;
    await selectTopic(page, '词语积累与分类');
    for (const category of ['people', 'animals', 'plants', 'school', 'daily', 'food', 'transport', 'weather', 'places']) {
      await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
      const sizes = await page.locator('.ct-lesson-list .hz-chip').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
      expect(sizes.length).toBeGreaterThan(0);
      expect([...new Set(sizes)]).toEqual([cardSize]);
      expect(await overflow(page)).toBe(false);
    }
    await expect(page.locator('.ct-lesson-intro > p')).toHaveCSS('font-size', width <= 600 ? '14px' : '15px');
    if (width === 1440 || width === 320) {
      await mkdir('artifacts/content-expansion', { recursive: true });
      await page.screenshot({ path: `artifacts/content-expansion/words-${width}.png`, fullPage: true });
    }
    await selectTopic(page, '汉字笔画与结构');
    await page.locator('[data-action="hz-category"][data-id="radicals"]').click();
    await page.locator('[data-action="hz-lesson"][data-id="radical-鱼"]').click();
    await expect(page.locator('.hz-item-list .hz-chip').first()).toHaveCSS('font-size', `${cardSize}px`);
    expect(await overflow(page)).toBe(false);
    if (width === 1440 || width === 320) await page.screenshot({ path: `artifacts/content-expansion/radicals-${width}.png`, fullPage: true });
    await chooseSubject(page, 'math');
    await selectTopic(page, mathTopics[1].name, 'math');
    await page.locator('[data-action="ct-category"][data-id="mental"]').click();
    await page.locator('[data-action="ct-start"][data-id="mental"]').click();
    const mathSizes = await page.locator('.ct-quiz .hz-option').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
    expect(mathSizes.length).toBeGreaterThan(0);
    expect([...new Set(mathSizes)]).toEqual([width <= 600 ? 16 : 18]);
    expect(await overflow(page)).toBe(false);
    await chooseSubject(page, 'english');
    await expect(page.locator('.ph-word-tile').first()).toHaveCSS('font-size', `${cardSize}px`);
    await expect(page.locator('.ph-small').first()).toHaveCSS('font-size', '13px');
    expect(await overflow(page)).toBe(false);
    if (width === 1440 || width === 320) await page.screenshot({ path: `artifacts/content-expansion/english-${width}.png`, fullPage: true });
    await chooseSubject(page, 'chinese');
    await selectTopic(page, '拼音学习');
    await chooseMode(page, 'tones');
    await expect(page.locator('.tone-character').first()).toHaveCSS('font-size', '20px');
    await expect(page.locator('.neutral-tone-examples button').first()).toHaveCSS('font-size', '20px');
    expect(await overflow(page)).toBe(false);
    await chooseMode(page, 'match');
    await expect(page.locator('.match-tile.pinyin').first()).toHaveCSS('font-size', width <= 600 ? '20px' : '22px');
    expect(await overflow(page)).toBe(false);
  });
}
