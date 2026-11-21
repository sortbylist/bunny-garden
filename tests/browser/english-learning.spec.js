import { test, expect } from '@playwright/test';

const topicState = (page, id) => page.evaluate(topic => JSON.parse(localStorage.getItem('bunny-garden-v1')).topics[topic], id);

async function openTopic(page, id) {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.phonics-page')).toBeVisible();
  const navigation = page.locator('[data-navigation="features-english"]');
  await navigation.locator('.nav-group-picker summary').click();
  await navigation.getByRole('button', { name: /词汇与日常听说/ }).click();
  if (id !== 'english-vocabulary') await navigation.locator(`.nav-tabs [data-id="${id}"]`).click();
  await expect(page.locator(`[data-topic="${id}"]`)).toBeVisible();
}

test('本地听题音频可播放，揭晓后显示原文并保留首次成绩', async ({ page }) => {
  await openTopic(page, 'english-listening');
  await page.getByRole('button', { name: '练练这一节' }).click();
  const quiz = page.locator('.en-topic .quiz-card');
  const question = (await topicState(page, 'english-listening')).round.questions[0];
  await expect(quiz.getByText(question.clip.text, { exact: true })).toHaveCount(0);
  await expect(quiz.locator('.answer-option').first()).toBeDisabled();
  const response = page.waitForResponse(result => result.url().endsWith(`/audio/english/${question.clip.id}.mp3`) && result.ok());
  await quiz.getByRole('button', { name: '播放题目' }).click();
  expect((await response).headers()['content-type']).toContain('audio');
  const answer = quiz.locator(`[data-value="${question.answer}"]`);
  await expect(answer).toBeEnabled({ timeout: 12000 });
  const wrong = question.options.find(option => option !== question.answer);
  await quiz.locator(`[data-value="${wrong}"]`).click();
  await answer.click();
  await expect(quiz.getByText(question.clip.text, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/english-listening-1440.png', fullPage: true });
  await page.reload();
  await expect(quiz.getByText(question.clip.text, { exact: true })).toBeVisible();
  const restored = await topicState(page, 'english-listening');
  expect(restored.round.responses[0].correct).toBe(false);
  expect(restored.mistakes).toEqual([question.id]);
  await expect(page.locator('.garden-links')).toContainText('听力理解错题本（1）');
});

test('音频失败可转文字学习，口语自评独立记录，320px 无整页溢出', async ({ page }) => {
  await openTopic(page, 'english-listening');
  await page.route('**/audio/english/*.mp3', route => route.abort());
  await page.getByRole('button', { name: '练练这一节' }).click();
  await page.getByRole('button', { name: '播放题目' }).click();
  await expect(page.locator('[data-en-audio-status]')).toContainText('暂时无法播放');
  await expect(page.locator('.answer-option').first()).toBeDisabled();
  await page.getByRole('button', { name: '看文字去学习' }).click();
  await expect(page.getByRole('button', { name: '我能听懂啦' })).toBeVisible();
  expect((await topicState(page, 'english-listening')).mistakes).toEqual([]);
  expect((await topicState(page, 'english-listening')).round.responses).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  const navigation = page.locator('[data-navigation="features-english"]');
  await navigation.locator('.nav-catalog-picker summary').click();
  await navigation.getByRole('button', { name: '情景口语' }).click();
  await expect(page.getByRole('heading', { name: '情景口语' })).toBeVisible();
  await expect(page.getByRole('list', { name: '示范对话' })).toContainText('Can I borrow your pencil, please?');
  await page.getByRole('button', { name: '我能说啦' }).click();
  await expect(page.getByRole('button', { name: /已自评能说/ })).toHaveAttribute('aria-pressed', 'true');
  expect((await topicState(page, 'english-speaking')).round).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'artifacts/english-speaking-320.png', fullPage: true });
});
