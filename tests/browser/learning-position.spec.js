import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { mathTopics } from '../../src/math-topics.js';
import { groups } from '../../src/data.js';
import { hanziCategories, hanziLessons } from '../../src/hanzi-data.js';
import { phonicsLessons } from '../../src/phonics-data.js';
import { chooseLearningCategory, chooseMode, openMyMenu, selectPhonicsLesson, selectTopic, stored } from './helpers.js';

async function expectPosition(page, index, total, practice = false) {
  const position = page.locator('#main-content .learning-position');
  await expect(position).toHaveCount(1);
  await expect(position).toHaveText(`第 ${index + 1} / ${total} ${practice ? '题' : '项'}`);
  await expect(position).toHaveAttribute('aria-label', `当前${practice ? '练习' : '学习'}位置`);
  await expect(position).toHaveCSS('font-size', '12px');
  await expect(page.locator('.mini-progress, .ct-lesson-counter')).toHaveCount(0);
}

for (const subject of [{ id: 'chinese', topics: chineseTopics }, { id: 'math', topics: mathTopics }]) {
  for (const topic of subject.topics) {
    test(`${topic.name}所有小分类的学习及练习位置统一且准确`, async ({ page }) => {
      test.setTimeout(90000);
      await page.goto('/');
      if (subject.id !== 'chinese') await page.locator(`.subjects [data-id="${subject.id}"]`).click();
      await selectTopic(page, topic.name, subject.id);
      for (const category of topic.categories) {
        await chooseLearningCategory(page, 'ct', category.id);
        const lessons = topic.lessons.filter(lesson => lesson.category === category.id);
        await expectPosition(page, 0, lessons.length);
        await expect(page.locator('[data-action="ct-previous"]')).toBeDisabled();
        await page.locator(`[data-action="ct-lesson"][data-id="${lessons.at(-1).id}"]`).click();
        await expectPosition(page, lessons.length - 1, lessons.length);
        await expect(page.locator('.card-navigation [data-action="ct-start"]')).toHaveText('本节练习');
        if (lessons.length > 1) {
          await page.locator('[data-action="ct-previous"]').click();
          await expectPosition(page, lessons.length - 2, lessons.length);
        }
        await page.getByRole('tab', { name: '练习', exact: true }).click();
        await expect(page.locator('.ct-quiz')).toBeVisible();
        const round = (await stored(page)).topics[topic.id].round;
        await expectPosition(page, 0, round.questions.length, true);
      }
    });
  }
}

test('拼音顺序、随机和收藏各范围均使用精确数字，切换及刷新保持同步', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  for (const mode of ['sequence', 'random']) {
    await chooseMode(page, mode);
    for (const group of ['all', ...groups.map(group => group.id)]) {
      await page.locator(`[data-action="map-group"][data-id="${group}"]`).click();
      const total = await page.locator('.letter-tile').count();
      await expectPosition(page, 0, total);
      await page.locator('[data-action="next"]').click();
      await expectPosition(page, 1, total);
      await page.locator('.letter-tile').last().click();
      await expectPosition(page, total - 1, total);
    }
  }
  await page.locator('[data-action="favorite"]').click();
  await openMyMenu(page, '[data-id="favorites"]');
  await expect(page.locator('.review-items li')).toHaveCount(1);
  await page.reload();
  await page.locator('[data-action="library-item"]').click();
  await page.locator('[data-action="library-toggle-favorite"]').click();
  await page.locator('[data-action="library-close-card"]').click();
  await expect(page.locator('.review-items li')).toHaveCount(0);
  await page.locator('[data-action="library-exit"]').click();
  await chooseMode(page, 'rules');
  const sessions = (await stored(page)).sessions;
  const round = Object.values(sessions).find(session => session.questions?.length);
  await expectPosition(page, 0, round.questions.length, true);
  await expect(page.locator('.quiz-progress')).toBeVisible();
});

test('汉字所有小分类的学习和练习位置使用公共显示', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '汉字笔画与结构');
  for (const category of hanziCategories) {
    await chooseLearningCategory(page, 'hz', category.id);
    const lessons = hanziLessons.filter(lesson => lesson.category === category.id);
    await expectPosition(page, 0, lessons.length);
    await page.locator('[data-action="hz-lesson"]').last().click();
    await expectPosition(page, lessons.length - 1, lessons.length);
    await expect(page.locator('.card-navigation [data-action="hz-start"]')).toHaveText('本节练习');
    await page.locator('.card-navigation [data-action="hz-start"]').click();
    await expectPosition(page, 0, (await stored(page)).hanzi.round.questions.length, true);
  }
});

test('英语全部课程的词卡位置及练习位置统一，保留题目跳转', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  for (const lesson of phonicsLessons) {
    await selectPhonicsLesson(page, lesson.id);
    const total = lesson.words.length;
    await expectPosition(page, 0, total);
    await page.locator('[data-action="ph-jump"]').last().click();
    await expectPosition(page, total - 1, total);
  }
  await page.reload();
  const total = phonicsLessons.at(-1).words.length;
  await expectPosition(page, total - 1, total);
  await page.locator('.ph-word-navigation [data-action="ph-section-practice"]').click();
  await expect(page.locator('.learning-position')).toHaveText(/第 1 \/ \d+ 题/);
  await page.locator('[data-action="ph-question"]').last().click();
  const count = await page.locator('[data-action="ph-question"]').count();
  await expectPosition(page, count - 1, count, true);
});

for (const width of [320, 820]) {
  test(`三科 ${width}px 位置样式一致、不换行且无溢出`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const inspect = async () => {
      await expect(page.locator('.learning-position')).toHaveCSS('white-space', 'nowrap');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      return page.locator('.learning-position').evaluate(element => {
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        const parent = element.parentElement.getBoundingClientRect();
        return { font: style.fontSize, color: style.color, fits: bounds.left >= parent.left && bounds.right <= parent.right };
      });
    };
    const reference = await inspect();
    expect(reference.fits).toBe(true);
    await page.locator('.study-card').screenshot({ path: testInfo.outputPath('pinyin-position.png') });
    for (const name of ['汉字笔画与结构', chineseTopics[0].name, chineseTopics.find(topic => topic.stage.startsWith('第二阶段')).name, chineseTopics.find(topic => topic.stage.startsWith('第三阶段')).name]) {
      await selectTopic(page, name);
      expect(await inspect(), name).toEqual(reference);
    }
    for (const subject of ['math', 'english']) {
      if (await page.locator('.mobile-toggle').isVisible()) await page.locator('.mobile-toggle').click();
      await page.locator(`.subjects [data-id="${subject}"]`).click();
      expect(await inspect(), subject).toEqual(reference);
      await page.locator(subject === 'math' ? '.ct-lesson' : '.ph-word-card').screenshot({ path: testInfo.outputPath(`${subject}-position.png`) });
    }
  });
}
