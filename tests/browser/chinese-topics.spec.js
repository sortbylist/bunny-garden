import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { stored, selectTopic } from './helpers.js';

async function openTopic(page, topic) {
  await page.goto('/');
  await selectTopic(page, topic.name);
}

async function answer(page, topic, correct = true) {
  const round = (await stored(page)).topics[topic.id].round;
  const question = round.questions[round.index];
  const value = correct ? question.answer : question.options.find(option => option !== question.answer);
  await page.locator('.ct-quiz').getByRole('button', { name: value, exact: true }).click();
  return question;
}

for (const topic of chineseTopics) {
  test(`${topic.name}：小节自由访问、自评去重、刷新恢复和拼音隔离`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator('[data-action="known"]').click();
    await selectTopic(page, topic.name);
    await expect(page).toHaveTitle(`${topic.name} · 小兔学习乐园`);
    for (const category of topic.categories) {
      await page.locator(`[data-action="ct-category"][data-id="${category.id}"]`).click();
      await expect(page.locator('.ct-lesson')).toContainText(category.name);
    }
    await page.locator('[data-action="ct-known"]').click();
    await page.reload();
    await page.locator('[data-action="ct-known"]').click();
    expect((await stored(page)).topics[topic.id].known).toHaveLength(1);
    await expect(page.locator('.star-counter b')).toHaveText('2');
    await page.getByRole('tab', { name: '拼音学习', exact: true }).click();
    await expect(page.locator('.pinyin-display')).toHaveText('o');
    expect((await stored(page)).known).toEqual(['single-a']);
    expect(errors).toEqual([]);
  });

  test(`${topic.name}：答错重试、跳过、续练、历史、错题与奖励`, async ({ page }) => {
    await openTopic(page, topic);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    const question = await answer(page, topic, false);
    await page.reload();
    await expect(page.locator('.hz-feedback')).toContainText('再试一次');
    await answer(page, topic);
    await page.locator('[data-action="ct-advance"]').click();
    await page.locator('[data-action="ct-skip"]').click();
    await page.locator('[data-action="ct-learn"]').click();
    await page.locator('[data-action="ct-resume"]').click();
    await expect(page.locator('.hz-feedback')).toContainText('先认识答案');
    await page.locator('[data-action="ct-advance"]').click();
    for (let index = 2; index < 10; index++) { await answer(page, topic); await page.locator('[data-action="ct-advance"]').click(); }
    await expect(page.locator('.ct-result')).toContainText('首次答对 8 题');
    await expect(page.locator('.ct-result')).toContainText('首次跳过 1 题');
    let root = await stored(page);
    expect(root.history.at(-1)).toMatchObject({ name: topic.name, correct: 8, total: 10 });
    expect(root.topics[topic.id].mistakes).toHaveLength(2);
    expect(root.mistakes).toEqual([]);
    expect(root.hanzi.mistakes).toEqual([]);
    await page.reload();
    expect((await stored(page)).history).toHaveLength(1);
    await page.locator('[data-action="topic-records"]').click();
    await page.locator(`dialog [data-action="topic-review"][data-id="${topic.id}"]`).click();
    for (let index = 0; index < 2; index++) { await answer(page, topic); await page.locator('[data-action="ct-advance"]').click(); }
    root = await stored(page);
    expect(root.topics[topic.id].mistakes).toEqual([]);
    expect(root.rewards.events.filter(event => event.id === `review:${question.id}`)).toHaveLength(1);
    await expect(page.locator('.growth-card [data-action="ct-start"][data-id="review"]')).toBeDisabled();
  });
}

test('查字典：两种索引实际查到条目，支持退回、切换和刷新', async ({ page }) => {
  await openTopic(page, chineseTopics.find(topic => topic.id === 'dictionary'));
  await page.locator('[data-action="ct-lookup"]').click();
  for (const value of ['H', 'hua']) await page.locator(`[data-action="ct-lookup-pick"][data-value="${value}"]`).click();
  await page.reload();
  await expect(page.locator('.ct-lookup-path')).toHaveText('已选：H → hua');
  await page.locator('[data-action="ct-lookup-pick"][data-value="花"]').click();
  await expect(page.locator('.ct-entry')).toContainText('耗费时间或钱');
  await page.locator('[data-action="ct-lookup-method"][data-id="radical"]').click();
  for (const value of ['3', '氵', '8', '深']) await page.locator(`[data-action="ct-lookup-pick"][data-value="${value}"]`).click();
  await expect(page.locator('.ct-entry')).toContainText('总笔画：11');
  await page.locator('[data-action="ct-lookup-back"]').click();
  await expect(page.locator('.ct-entry')).toHaveCount(0);
  expect(await page.locator('[data-action="ct-lookup-pick"]').allTextContents()).toEqual(expect.arrayContaining(['深', '清']));
  await expect(page.locator('[data-action="ct-lookup-pick"]')).toHaveCount(2);
});

test('所有主题在手机可切换、无溢出，清空同时清除所有主题进度', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/');
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await page.locator('[data-action="ct-known"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="ct-skip"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-action="ct-advance"]')).toBeFocused();
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  for (const topic of chineseTopics) expect((await stored(page)).topics[topic.id].known).toEqual([]);
});

test('各主题互不覆盖未完成练习和错题，跨主题刷新后仍可继续', async ({ page }) => {
  await page.goto('/');
  const questions = new Map();
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    const question = await answer(page, topic, false);
    questions.set(topic.id, question.id);
  }
  await page.reload();
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await expect(page.locator('.hz-feedback')).toContainText('再试一次');
    const state = (await stored(page)).topics[topic.id];
    expect(state.round.questions[0].id).toBe(questions.get(topic.id));
    expect(state.mistakes).toEqual([questions.get(topic.id)]);
    expect(state.round.responses[0].correct).toBe(false);
  }
});

test('字词主题在浏览器存储不可用时仍能学习、查字和作答', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/');
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await page.locator('[data-action="ct-known"]').click();
    await expect(page.locator('[data-action="ct-known"]')).toContainText('已经认识');
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await page.locator('[data-action="ct-skip"]').click();
    await expect(page.locator('.hz-feedback')).toContainText('先认识答案');
  }
  await page.getByRole('tab', { name: '查字典', exact: true }).click();
  await page.locator('[data-action="ct-lookup"]').click();
  for (const value of ['H', 'he', '河']) await page.locator(`[data-action="ct-lookup-pick"][data-value="${value}"]`).click();
  await expect(page.locator('.ct-entry')).toContainText('天然的大水道');
});

test('各主题题量和拼音设置分别保存，按实际题量刷新续练且保留原文判分', async ({ page }) => {
  await page.goto('/');
  for (const topic of chineseTopics) {
    await selectTopic(page, topic.name);
    await page.locator('[data-action="ct-length"][data-value="30"]').click();
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await expect(page.locator('.ct-quiz .hz-card-heading')).toContainText(`第 1 / ${Math.min(30, topic.questions.length)} 题`);
    await expect(page.locator('.ct-quiz .ct-visual')).toHaveCount(0);
    const original = (await stored(page)).topics[topic.id].round.questions;
    await page.locator('[data-action="ct-length"][data-value="20"]').click();
    await page.locator('[data-action="ct-reading"]').click();
    await expect(page.locator('.chinese-topic ruby')).toHaveCount(0);
    await page.reload();
    expect((await stored(page)).topics[topic.id].round.questions).toEqual(original);
    await expect(page.locator('[data-action="ct-length"][data-value="20"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-action="ct-reading"]')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('[data-action="ct-reading"]').click();
    await answer(page, topic);
    expect((await stored(page)).topics[topic.id].round.responses[0].correct).toBe(true);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    expect((await stored(page)).topics[topic.id].round.questions).toHaveLength(Math.min(20, topic.questions.length));
  }
});

test('教学图解和难词拼音在320像素宽度可读，同音节查字能区分声调', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openTopic(page, chineseTopics.find(topic => topic.id === 'dictionary'));
  await expect(page.getByRole('img', { name: '翻开的字典' })).toBeVisible();
  await page.locator('[data-action="ct-lookup"]').click();
  for (const value of ['Q', 'qing']) await page.locator(`[data-action="ct-lookup-pick"][data-value="${value}"]`).click();
  await expect(page.locator('[data-action="ct-lookup-pick"]')).toHaveCount(4);
  await page.locator('[data-action="ct-lookup-pick"][data-value="请"]').click();
  await expect(page.locator('.ct-entry h3')).toHaveText('请 qǐng');
  const examples = [
    ['word-relations', 'antonyms', 'word-relations:lesson:ant-整齐'],
    ['word-categories', 'animals', 'word-categories:lesson:蝴蝶'],
    ['collocations', 'measure', 'collocations:lesson:measure-花'],
    ['word-patterns', 'four', 'word-patterns:lesson:白雪皑皑'],
  ];
  for (const [topicId, category, lessonId] of examples) {
    const topic = chineseTopics.find(item => item.id === topicId);
    await page.getByRole('tab', { name: topic.name, exact: true }).click();
    await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
    await page.locator(`[data-action="ct-lesson"][data-id="${lessonId}"]`).click();
    await expect(page.locator('.ct-visual')).toBeVisible();
    expect(await page.locator('.ct-lesson ruby').count()).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
