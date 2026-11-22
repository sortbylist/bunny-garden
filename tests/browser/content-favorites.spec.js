import { expect, test } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { phonicsStories } from '../../src/phonics-data.js';
import { chooseMode, choosePhonicsMode, openMyMenu, selectTopic, stored } from './helpers.js';

test('英语的课、词卡、练习与故事可分别收藏，不覆盖原有词卡记录', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await page.locator('.ph-rule .learning-favorite').click();
  await page.locator('.ph-word-card .learning-favorite').click();
  for (const mode of ['meaning', 'reading']) {
    await choosePhonicsMode(page, mode);
    await page.locator('.ph-main .learning-favorite').click();
  }
  await page.reload();
  await openMyMenu(page, '[data-id="favorites"]');
  await expect(page.locator('.review-items li')).toHaveCount(4);
  await expect(page.locator('.review-items li').filter({ hasText: 'map' }).last()).toContainText('学习卡');
  const story = (await stored(page)).phonics.lessonId;
  const favoriteStory = phonicsStories.find(entry => entry.lessonId === story);
  await page.getByRole('button', { name: new RegExp(favoriteStory.title, 'u') }).click();
  const dialog = page.getByRole('dialog', { name: '收藏回看' });
  await expect(dialog.locator('.ph-reading')).toBeVisible();
  await dialog.getByRole('button', { name: '去这一节' }).click();
  await expect(page.locator('.ph-reading .learning-favorite')).toHaveAttribute('aria-pressed', 'true');
});

test('声调示范、拼读题和配对活动没有单张词卡也能收藏', async ({ page }) => {
  await page.goto('/');
  for (const mode of ['tones', 'blend', 'match']) {
    await chooseMode(page, mode);
    const favorite = page.locator('.quiz-card .learning-favorite');
    await favorite.click();
    await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  }
  await openMyMenu(page, '[data-id="favorites"]');
  await expect(page.locator('.review-items li')).toHaveCount(3);
});

for (const [subject, topics] of [['chinese', [{ name: '汉字笔画与结构', id: 'hanzi-structure' }, ...chineseTopics]], ['math', mathTopics]]) {
  for (const topic of topics) {
    test(`${topic.name}的课程和题目可以分别收藏、回看和取消`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`.subjects [data-id="${subject}"]`).click();
      await selectTopic(page, topic.name, subject);
      const lesson = page.locator('.study-card .learning-favorite');
      await lesson.click();
      await expect(lesson).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('tab', { name: '练习', exact: true }).click();
      await page.locator('.quiz-card .learning-favorite').click();
      await page.reload();
      await expect(page.locator('.quiz-card .learning-favorite')).toHaveAttribute('aria-pressed', 'true');
      await openMyMenu(page, '[data-id="favorites"]');
      const dialog = page.getByRole('dialog', { name: '收藏回看' });
      await expect(page.locator('.review-items li')).toHaveCount(2);
      await page.locator('.review-items button').filter({ hasText: '练习题' }).click();
      await expect(dialog.locator('.quiz-card')).toBeVisible();
      await expect(dialog.locator('.answer-option').first()).toBeDisabled();
      await dialog.locator('[data-action="library-toggle-favorite"]').click();
      await dialog.getByRole('button', { name: '返回我的收藏' }).click();
      await page.locator('.review-items button').filter({ hasText: '学习卡' }).click();
      await expect(dialog.locator('.study-card')).toBeVisible();
      await dialog.getByRole('button', { name: '去这一节' }).click();
      await expect(lesson).toHaveAttribute('aria-pressed', 'true');
      await lesson.click();
      expect((await stored(page)).savedContent).toEqual([]);
    });
  }
}
