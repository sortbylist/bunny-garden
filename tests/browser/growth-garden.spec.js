import { test, expect } from '@playwright/test';
import { chooseMode, openMyMenu, selectTopic, stored } from './helpers.js';

test('花园显示进度，四个个人入口统一在我的菜单', async ({ page }) => {
  await page.goto('/');
  const garden = page.locator('.growth-card');
  for (const [subject, topic, action] of [
    ['chinese', '汉字笔画与结构', 'hz-known'],
    ['math', '加减法', 'ct-known'],
    ['english', '自然拼读', 'ph-known'],
  ]) {
    await page.locator(`.subjects [data-id="${subject}"]`).click();
    await selectTopic(page, topic, subject);
    await expect(garden).toContainText('我的成长花园');
    await expect(garden.getByRole('button', { name: /错题本|我的收藏|学习记录|奖励收藏册/ })).toHaveCount(0);
    await page.locator(`[data-action="${action}"]`).click();
    await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    const menu = page.locator('.my-menu');
    await menu.locator('summary').click();
    for (const name of ['错题本（0）', '我的收藏（0）', '学习记录', '奖励收藏册']) {
      await expect(menu.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  }
});

test('换学科后仍能查看原收藏和另一科错题，复习后续做原练习', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'tones');
  await page.locator('.tones-card .learning-favorite').click();
  await page.locator('[data-action="pinyin-section-practice"][data-id="tones"]').click();
  await expect(page.locator('.quiz-card .category-badge')).toHaveText('练习 · 听音辨声调');
  await page.locator('[data-action="skip"]').click();
  await page.locator('.subjects [data-id="math"]').click();
  await selectTopic(page, '加减法', 'math');
  const learning = await page.locator('.ct-lesson-intro h3').textContent();
  await page.locator('.ct-lesson .learning-favorite').click();
  await page.locator('.section-practice-shortcut').click();
  const quizTitle = page.locator('.ct-quiz .category-badge');
  await expect(quizTitle).toHaveText(/^练习 · /);
  await expect(quizTitle).toBeFocused();
  await page.locator('[data-action="ct-skip"]').click();
  const before = await stored(page);
  const [topic, progress] = Object.entries(before.topics).find(([, entry]) => entry.mistakes.length);

  await openMyMenu(page, '[data-id="favorites"]');
  await expect(page.locator('.review-items button')).toHaveCount(2);
  const subject = page.locator('#library-filter-subject');
  const subjectOptions = page.getByRole('region', { name: '学科', exact: true });
  await subject.click();
  await subjectOptions.getByRole('button', { name: '语文', exact: true }).click();
  const saved = page.locator('.review-items button').first();
  await saved.click();
  await expect(page.getByRole('dialog').locator('.tone-tile')).toHaveCount(16);
  await expect(page.locator('.review-detail-body > section + .review-detail-meta').getByRole('button', { name: '返回我的收藏' })).toBeVisible();
  await page.getByRole('button', { name: '返回我的收藏' }).click();
  await expect(saved).toBeFocused();
  await expect(subject).toHaveText('语文');
  const type = page.locator('#library-filter-type');
  await type.click();
  await page.getByRole('region', { name: '类型' }).getByRole('button', { name: '练习题' }).click();
  await expect(type).toHaveText('练习题');
  await expect(page.locator('.review-items button')).toHaveCount(0);

  await openMyMenu(page, '[data-id="mistakes"]');
  await expect(page.locator('.review-group')).toHaveCount(2);
  const theme = page.locator('#library-filter-feature');
  const section = page.locator('#library-filter-section');
  await theme.click();
  await page.getByRole('region', { name: '主题' }).getByRole('button', { name: '语文 / 拼音学习' }).click();
  await section.click();
  await page.getByRole('region', { name: '小节' }).getByRole('button', { name: '声调' }).click();
  await expect(section).toHaveText('声调');
  await subject.click();
  await subjectOptions.getByRole('button', { name: '数学', exact: true }).click();
  await expect(theme).toHaveText('全部主题');
  await expect(section).toHaveCount(0);
  await page.locator(`[data-action="library-review-group"][data-id="${topic}"]`).click();
  const question = progress.round.questions[progress.round.index];
  await page.getByRole('dialog').getByRole('button', { name: question.answer, exact: true }).click();
  await page.getByRole('button', { name: '完成复习' }).click();
  const after = await stored(page);
  expect(after.topics[topic].round).toEqual(progress.round);
  expect(after.topics[topic].mistakes).toEqual([]);
  expect(after.mistakes).toHaveLength(1);
  await openMyMenu(page, '[data-id="records"]');
  await subject.click();
  await subjectOptions.getByRole('button', { name: '数学', exact: true }).click();
  await expect(page.locator('.history-list')).toContainText('加减法 · 错题复习');
  await page.getByRole('button', { name: '返回课程' }).click();
  await page.getByRole('button', { name: '回到学习' }).click();
  await expect(page.locator('.ct-lesson-intro h3')).toHaveText(learning);
});

test('窄屏筛选支持键盘选择和点击外部收起，弹层不超出页面', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await openMyMenu(page, '[data-id="favorites"]');
  const subject = page.locator('#library-filter-subject');
  const type = page.locator('#library-filter-type');
  const allSubjects = page.getByRole('button', { name: '全部学科', exact: true });
  await subject.press('Enter');
  await page.keyboard.press('Tab');
  await expect(allSubjects).toBeFocused();
  await expect(allSubjects).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('Escape');
  await expect(allSubjects).toBeHidden();
  await expect(subject).toBeFocused();
  await subject.press('Space');
  const chinese = page.getByRole('button', { name: '语文', exact: true }).and(page.locator('.nav-catalog-item'));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(chinese).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(subject).toHaveText('语文');
  await expect(subject).toBeFocused();
  await subject.click();
  await expect(chinese).toHaveAttribute('aria-current', 'true');
  await type.click();
  await expect(chinese).toBeHidden();
  const panel = page.getByRole('region', { name: '类型' });
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  await page.getByRole('heading', { name: '我的收藏', exact: true }).click();
  await expect(panel).toBeHidden();
});
