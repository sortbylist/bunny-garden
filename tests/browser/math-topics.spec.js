import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { mathTopics } from '../../src/math-topics.js';
import { selectTopic, stored } from './helpers.js';

async function subject(page, id) {
  const button = page.locator(`.subjects [data-action="subject"][data-id="${id}"]`);
  if (await page.locator('.mobile-toggle').isVisible() && !await page.locator('#app').evaluate(element => element.classList.contains('mobile-open'))) await page.locator('.mobile-toggle').click();
  await button.click();
}

const paint = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return { background: style.backgroundColor, border: style.border, radius: style.borderRadius, shadow: style.boxShadow };
});

test('数学复用语文的学习卡、练习选项、布局和成长花园', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await selectTopic(page, '标点符号');
  const card = await paint(page.locator('.ct-lesson'));
  const mode = await paint(page.locator('.play-mode.selected'));
  const garden = await paint(page.locator('.growth-card'));
  const layout = await page.locator('.learning-layout').evaluate(element => getComputedStyle(element).gridTemplateColumns);
  await page.locator('[data-action="ct-start"][data-id="all"]').click();
  const option = await paint(page.locator('.answer-option').first());
  await subject(page, 'math');
  for (const topic of mathTopics) {
    await selectTopic(page, topic.name, 'math');
    expect(await paint(page.locator('.ct-lesson'))).toEqual(card);
    expect(await paint(page.locator('.play-mode.selected'))).toEqual(mode);
    expect(await paint(page.locator('.growth-card'))).toEqual(garden);
    expect(await page.locator('.learning-layout').evaluate(element => getComputedStyle(element).gridTemplateColumns)).toEqual(layout);
    await expect(page.locator('.eyebrow')).toContainText('第一阶段 · 数与运算');
    await expect(page.locator('[data-action="ct-reading"]')).toHaveCount(0);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    expect(await paint(page.locator('.answer-option').first())).toEqual(option);
    await page.locator('[data-action="ct-learn"]').click();
  }
  expect(errors).toEqual([]);
});

for (const topic of mathTopics) {
  test(`${topic.name}的所有小分类都有学习卡、参考思路和专项练习`, async ({ page }) => {
    await page.goto('/');
    await subject(page, 'math');
    await selectTopic(page, topic.name, 'math');
    await expect(page.locator('[data-action="ct-length"]')).toHaveCount(0);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await page.locator('[data-action="ct-length"][data-value="20"]').click();
    await page.locator('[data-action="ct-learn"]').click();
    for (const category of topic.categories) {
      await page.locator(`[data-action="ct-category"][data-id="${category.id}"]`).click();
      await expect(page.locator('.ct-lesson .category-badge')).toHaveText(category.name);
      await expect(page.locator('.ct-lesson-list button')).toHaveCount(2);
      await page.locator('[data-action="ct-activity-example"]').click();
      await expect(page.locator('.ct-sample')).not.toBeEmpty();
      await page.locator('[data-action="ct-next"]').click();
      await expect(page.locator('.ct-lesson-intro h3')).toContainText('举一反三');
      await page.locator('[data-action="ct-previous"]').click();
      await page.locator(`[data-action="ct-start"][data-id="${category.id}"]`).click();
      const state = await stored(page);
      expect(state.topics[topic.id].round.questions).toHaveLength(12);
      expect(state.topics[topic.id].round.questions.every(question => question.category === category.id)).toBe(true);
      await page.locator('[data-action="ct-skip"]').click();
      await expect(page.locator('.answer-feedback')).toContainText('先认识答案');
      await expect(page.locator('.answer-feedback p')).not.toBeEmpty();
      await page.locator('[data-action="ct-learn"]').click();
    }
  });
}

test('数学自评、首次成绩、刷新、错题复习和学习记录完整可用', async ({ page }) => {
  await page.goto('/');
  await subject(page, 'math');
  const topic = mathTopics[1];
  await selectTopic(page, topic.name, 'math');
  await page.locator('[data-action="ct-known"]').click();
  const stars = await page.locator('.star-counter b').textContent();
  await page.locator('[data-action="ct-known"]').click();
  await expect(page.locator('.star-counter b')).toHaveText(stars);
  await page.locator('[data-action="ct-activity-example"]').click();
  await page.locator('[data-action="ct-start"][data-id="all"]').click();
  let state = await stored(page);
  const first = state.topics[topic.id].round.questions[0];
  await page.getByRole('button', { name: first.options.find(option => option !== first.answer), exact: true }).click();
  await page.reload();
  await expect(page.locator('.ct-quiz')).toBeVisible();
  await page.getByRole('button', { name: first.answer, exact: true }).click();
  expect((await stored(page)).topics[topic.id].round.responses[0].correct).toBe(false);
  await page.locator('[data-action="ct-learn"]').click();
  await expect(page.locator('.ct-sample')).toBeVisible();
  await expect(page.locator('[data-action="ct-length"]')).toHaveCount(0);
  await page.locator('[data-action="ct-resume"]').click();
  await page.locator('[data-action="ct-length"][data-value="30"]').click();
  expect((await stored(page)).topics[topic.id].round.questions).toHaveLength(10);
  for (let index = 0; index < 10; index++) {
    if (index) {
      state = await stored(page);
      const current = state.topics[topic.id].round.questions[index];
      await page.getByRole('button', { name: current.answer, exact: true }).click();
    }
    await page.locator('[data-action="ct-advance"]').click();
  }
  await expect(page.locator('.ct-result')).toContainText('首次答对 9 题');
  expect((await stored(page)).history.at(-1).name).toBe('加减法');
  await page.locator('.growth-card [data-action="ct-start"][data-id="review"]').click();
  await page.getByRole('button', { name: first.answer, exact: true }).click();
  expect((await stored(page)).topics[topic.id].mistakes).toEqual([]);
  await page.locator('[data-action="ct-advance"]').click();
  await page.locator('.garden-links [data-action="topic-records"]').click();
  await expect(page.locator('dialog')).toContainText('数学主题学习记录');
  await expect(page.locator('dialog')).toContainText('自评认识 1 / 12 项');
  await page.keyboard.press('Escape');
  await page.locator('.my-menu summary').click();
  await page.locator('.my-menu [data-action="math-records"]').click();
  await expect(page.locator('dialog')).toContainText('数学主题学习记录');
});

test('数学与语文进度隔离，主题选择恢复，损坏题目恢复原始内容并支持清空', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  await subject(page, 'math');
  const topic = mathTopics[3];
  await selectTopic(page, topic.name, 'math');
  await page.locator('[data-action="ct-category"][data-id="zero"]').click();
  await page.locator('[data-action="ct-known"]').click();
  await page.locator('[data-action="ct-start"][data-id="all"]').click();
  await page.locator('[data-action="ct-skip"]').click();
  const mathState = (await stored(page)).topics[topic.id];
  await subject(page, 'chinese');
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  await selectTopic(page, '查字典');
  expect((await stored(page)).topics.dictionary.mistakes).toEqual([]);
  await subject(page, 'math');
  expect((await stored(page)).topics[topic.id]).toEqual(mathState);
  await page.evaluate(topicId => {
    const saved = JSON.parse(localStorage.getItem('bunny-garden-v1'));
    saved.topics[topicId].round.questions[0].prompt = '外来题目';
    saved.topics[topicId].round.questions[0].answer = '外来答案';
    localStorage.setItem('bunny-garden-v1', JSON.stringify(saved));
  }, topic.id);
  await page.reload();
  await expect(page.locator('.math-topic h1')).toHaveText('除法✿');
  await expect(page.locator('.ct-prompt')).not.toContainText('外来题目');
  await expect(page.locator('.ct-lesson')).toHaveCount(0);
  expect((await stored(page)).topics[topic.id].round.questions[0].answer).not.toBe('外来答案');
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  const reset = await stored(page);
  expect(reset.known).toEqual([]);
  for (const mathTopic of mathTopics) {
    expect(reset.topics[mathTopic.id].known).toEqual([]);
    expect(reset.topics[mathTopic.id].mistakes).toEqual([]);
    expect(reset.topics[mathTopic.id].round).toBeNull();
  }
});

for (const width of [1440, 820, 320]) {
  test(`数学 ${width}px 图解、学习与练习布局保持统一且无溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await subject(page, 'math');
    for (const topic of mathTopics) {
      await selectTopic(page, topic.name, 'math');
      const category = topic.lessons.find(lesson => lesson.visual)?.category;
      if (category) await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const card = await page.locator('.ct-lesson').boundingBox();
      const garden = await page.locator('.growth-card').boundingBox();
      expect(card.width).toBeGreaterThan(240);
      if (width === 1440) expect(garden.x).toBeGreaterThan(card.x + card.width);
      else expect(garden.y).toBeGreaterThan(card.y);
      await page.locator('[data-action="ct-start"][data-id="all"]').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('[data-action="ct-skip"]').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-action="ct-advance"]')).toBeFocused();
      await page.locator('[data-action="ct-learn"]').click();
    }
    await selectTopic(page, '乘法', 'math');
    await page.locator('[data-action="ct-category"][data-id="double"]').click();
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/math-learning-${width}.png`, fullPage: true });
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await page.screenshot({ path: `artifacts/math-practice-${width}.png`, fullPage: true });
  });
}
