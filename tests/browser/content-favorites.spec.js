import { expect, test } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { chooseMode, selectTopic, stored } from './helpers.js';

test('英语的课、词卡、练习与故事可分别收藏，不覆盖原有词卡记录', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await page.locator('.ph-rule .learning-favorite').click();
  await page.locator('.ph-word-card .learning-favorite').click();
  for (const mode of ['meaning', 'reading']) {
    await page.locator(`.ph-modes [data-id="${mode}"]`).click();
    await page.locator('.ph-main .learning-favorite').click();
  }
  await page.reload();
  await page.locator('.garden-links [data-action="saved-content"]').click();
  const dialog = page.getByRole('dialog', { name: '我的收藏' });
  await expect(dialog.locator('details')).toHaveCount(3);
  await expect(dialog.getByRole('button', { name: '英语词卡收藏（1）' })).toBeVisible();
  await dialog.locator('summary').last().click();
  await dialog.getByRole('button', { name: '回到课程' }).click();
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
  await page.locator('.garden-links [data-action="saved-content"]').click();
  await expect(page.getByRole('dialog').locator('details')).toHaveCount(3);
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
      await page.locator('.mastery-actions [data-id]').click();
      await page.locator('.quiz-card .learning-favorite').click();
      await page.reload();
      await expect(page.locator('.quiz-card .learning-favorite')).toHaveAttribute('aria-pressed', 'true');
      await page.locator('.garden-links [data-action="saved-content"]').click();
      const dialog = page.getByRole('dialog', { name: '我的收藏' });
      await expect(dialog.locator('details')).toHaveCount(2);
      await dialog.locator('details').last().locator('summary').click();
      await dialog.getByRole('button', { name: '取消收藏' }).click();
      await dialog.locator('summary').click();
      await dialog.getByRole('button', { name: '回到课程' }).click();
      await expect(lesson).toHaveAttribute('aria-pressed', 'true');
      await lesson.click();
      expect((await stored(page)).savedContent).toEqual([]);
    });
  }
}
