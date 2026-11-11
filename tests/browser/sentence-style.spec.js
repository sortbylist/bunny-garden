import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { chineseTopics } from '../../src/chinese-topics.js';
import { chooseMode, selectTopic, stored } from './helpers.js';

const topics = chineseTopics.filter(topic => topic.stage.startsWith('第二阶段'));
const paint = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return { background: style.backgroundColor, border: style.border, radius: style.borderRadius, shadow: style.boxShadow };
});

test('二阶段沿用拼音的布局、卡片、导航和成长花园样式', async ({ page }) => {
  await page.goto('/');
  const card = await paint(page.locator('.study-card'));
  const mode = await paint(page.locator('.play-mode.selected'));
  const garden = await paint(page.locator('.growth-card'));
  const layout = await page.locator('.learning-layout').evaluate(element => {
    const style = getComputedStyle(element);
    return { columns: style.gridTemplateColumns, gap: style.gap };
  });
  for (const topic of topics) {
    await selectTopic(page, topic.name);
    await expect(page.locator('.ct-sentence-topic .heading-sticker')).toBeVisible();
    await expect(page.locator('.ct-sentence-topic .play-mode-group h3')).toHaveText('02句子小节');
    expect(await paint(page.locator('.ct-lesson'))).toEqual(card);
    expect(await paint(page.locator('.play-mode.selected'))).toEqual(mode);
    expect(await paint(page.locator('.growth-card'))).toEqual(garden);
    expect(await page.locator('.learning-layout').evaluate(element => {
      const style = getComputedStyle(element);
      return { columns: style.gridTemplateColumns, gap: style.gap };
    })).toEqual(layout);
    await expect(page.locator('.ct-sentence-lessons')).toBeVisible();
    await expect(page.locator('.growth-card [data-action="ct-start"][data-id="review"]')).toBeDisabled();
  }
});

test('句子练习的选项沿用拼音样式，正确反馈与结果页可操作', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'rules');
  const option = await paint(page.locator('.answer-option').first());
  const topic = topics[0];
  await selectTopic(page, topic.name);
  await page.locator('[data-action="ct-start"][data-id="order"]').click();
  expect(await paint(page.locator('.ct-quiz .answer-option').first())).toEqual(option);
  await expect(page.locator('.ct-quiz .answer-option').first()).toHaveCSS('display', 'flex');
  await expect(page.locator('.ct-quiz .option-letter')).toHaveText(['A', 'B', 'C']);
  const state = await stored(page);
  const firstQuestion = state.topics[topic.id].round.questions[0];
  await page.getByRole('button', { name: firstQuestion.answer, exact: true }).click();
  await expect(page.locator('.answer-feedback.success')).toContainText('答对啦');
  const total = state.topics[topic.id].round.questions.length;
  for (let index = 0; index < total; index++) {
    if (index) await page.locator('[data-action="ct-skip"]').click();
    await page.locator('[data-action="ct-advance"]').click();
  }
  await expect(page.locator('.ct-result .bunny-scene')).toBeVisible();
  await page.locator('[data-action="ct-learn"]').click();
  await expect(page.locator('.ct-lesson')).toBeVisible();
});

for (const width of [1440, 820, 320]) {
  test(`二阶段 ${width}px 学习、排序和练习布局可读且无溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    for (const topic of topics) {
      await selectTopic(page, topic.name);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const card = await page.locator('.ct-lesson').boundingBox();
      const garden = await page.locator('.growth-card').boundingBox();
      expect(card.width).toBeGreaterThan(240);
      if (width === 1440) expect(garden.x).toBeGreaterThan(card.x + card.width);
      else expect(garden.y).toBeGreaterThan(card.y);
      const firstWrite = topic.lessons.find(lesson => lesson.activity.type === 'write');
      await page.locator(`[data-action="ct-category"][data-id="${firstWrite.category}"]`).click();
      await page.locator(`[data-action="ct-lesson"][data-id="${firstWrite.id}"]`).click();
      await page.locator('#ct-draft').fill('我认真读完了这句话。');
      await page.locator('[data-action="ct-length"][data-value="30"]').click();
      await expect(page.locator('#ct-draft')).toHaveValue('我认真读完了这句话。');
      await page.locator('[data-action="ct-start"][data-id="all"]').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('[data-action="ct-skip"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-action="ct-advance"]')).toBeFocused();
    }
    await selectTopic(page, topics[0].name);
    await page.locator('[data-action="ct-category"][data-id="order"]').click();
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/sentence-learning-${width}.png`, fullPage: true });
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await page.screenshot({ path: `artifacts/sentence-practice-${width}.png`, fullPage: true });
  });
}
