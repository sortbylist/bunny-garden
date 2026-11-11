import { test, expect } from '@playwright/test';
import { stored } from './helpers.js';

async function openHanzi(page) {
  await page.goto('/');
  await page.getByRole('tab', { name: '汉字笔画与结构' }).click();
}

async function answerCurrent(page, correct = true) {
  const round = (await stored(page)).hanzi.round;
  const question = round.questions[round.index];
  const value = correct ? question.answer : question.options.find(option => option !== question.answer);
  await page.locator(`[data-action="hz-answer"][data-value="${value}"]`).click();
  return question;
}

test('独立入口、自由切换、笔顺前后演示与刷新恢复，拼音状态保留', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  await page.getByRole('tab', { name: '汉字笔画与结构' }).click();
  await expect(page).toHaveTitle('汉字笔画与结构 · 小兔学习乐园');
  await expect(page.locator('.hz-category')).toHaveCount(6);
  await page.locator('[data-action="hz-category"][data-id="top-bottom"]').click();
  await expect(page.locator('.hz-parts')).toHaveClass(/top-bottom/);
  await page.locator('[data-action="hz-category"][data-id="order"]').click();
  await expect(page.locator('[data-action="hz-stroke-previous"]')).toBeDisabled();
  await page.locator('[data-action="hz-lesson"][data-id="order-日"]').click();
  await page.locator('[data-action="hz-stroke-next"]').click();
  await page.locator('[data-action="hz-stroke-next"]').click();
  await expect(page.locator('.hz-step-status')).toHaveText('第 2 / 4 笔：横折');
  await page.reload();
  await expect(page.locator('.hz-step-status')).toHaveText('第 2 / 4 笔：横折');
  await expect(page.locator('.hz-writing-grid .hz-current-stroke')).toHaveCount(1);
  await page.locator('[data-action="hz-stroke-jump"][data-index="4"]').click();
  await expect(page.locator('[data-action="hz-stroke-next"]')).toBeDisabled();
  await page.locator('[data-action="hz-stroke-previous"]').click();
  await expect(page.locator('.hz-step-status')).toHaveText('第 3 / 4 笔：横');
  await page.locator('[data-action="hz-stroke-reset"]').click();
  await expect(page.locator('.hz-step-status')).toContainText('准备好了吗');
  await page.getByRole('tab', { name: '拼音学习' }).click();
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  expect((await stored(page)).known).toEqual(['single-a']);
  expect(errors).toEqual([]);
});

test('自评与奖励去重，所有结构与偏旁示例可直接访问', async ({ page }) => {
  await openHanzi(page);
  await page.locator('[data-action="hz-known"]').click();
  await page.locator('[data-action="hz-known"]').click();
  await page.reload();
  await page.locator('[data-action="hz-known"]').click();
  expect((await stored(page)).hanzi.known).toEqual(['stroke-horizontal']);
  await expect(page.locator('.star-counter b')).toHaveText('1');
  await page.locator('[data-action="hz-category"][data-id="radicals"]').click();
  await expect(page.locator('.hz-note').first()).toContainText('不完全相同');
  await expect(page.locator('.hz-examples')).toHaveText('河海湖');
  await page.locator('[data-action="hz-category"][data-id="single"]').click();
  await expect(page.locator('.hz-demo')).toContainText('独体字');
  await page.locator('[data-action="hz-category"][data-id="left-right"]').click();
  await expect(page.locator('.hz-parts')).toContainText('左边日右边月');
  await page.locator('[data-action="hz-category"][data-id="top-bottom"]').click();
  await expect(page.locator('.hz-parts')).toContainText('上面日下面十');
});

test('答错刷新重试、完成统计、独立错题复习和历史去重', async ({ page }) => {
  await openHanzi(page);
  await page.locator('[data-action="hz-start"][data-id="all"]').click();
  const question = await answerCurrent(page, false);
  await expect(page.locator('.hz-feedback')).toContainText('再试一次');
  await page.reload();
  await expect(page.locator('.hz-feedback')).toContainText('再试一次');
  await answerCurrent(page);
  expect((await stored(page)).hanzi.round.responses[0].correct).toBe(false);
  await page.locator('[data-action="hz-advance"]').click();
  for (let index = 1; index < 10; index++) {
    await answerCurrent(page);
    await page.locator('[data-action="hz-advance"]').click();
  }
  await expect(page.locator('.hz-result')).toContainText('首次答对 9 题');
  let root = await stored(page);
  expect(root.history.at(-1)).toMatchObject({ name: '汉字笔画与结构', total: 10, correct: 9 });
  expect(root.hanzi.mistakes).toEqual([question.id]);
  expect(root.mistakes).toEqual([]);
  await page.reload();
  expect((await stored(page)).history).toHaveLength(1);
  await page.locator('.my-menu-toggle').click();
  await page.locator('.my-menu [data-action="records"]').click();
  await expect(page.locator('dialog')).toContainText('待复习错题 1 道');
  await page.locator('dialog [data-action="hanzi-review"]').click();
  await expect(page.locator('dialog')).not.toBeVisible();
  await answerCurrent(page);
  await page.locator('[data-action="hz-advance"]').click();
  root = await stored(page);
  expect(root.hanzi.mistakes).toEqual([]);
  expect(root.history).toHaveLength(2);
  expect(root.rewards.events.filter(event => event.id === `review:${question.id}`)).toHaveLength(1);
  await expect(page.locator('.hz-sidebar [data-action="hz-start"][data-id="review"]')).toBeDisabled();
});

test('查看答案保留错题，离开与继续保留题目和首次结果', async ({ page }) => {
  await openHanzi(page);
  await page.locator('[data-action="hz-start"][data-id="strokes"]').click();
  const question = (await stored(page)).hanzi.round.questions[0];
  await page.locator('[data-action="hz-skip"]').click();
  await expect(page.locator('.hz-feedback')).toContainText('先认识答案');
  await page.locator('[data-action="hz-learn"]').click();
  await page.getByRole('tab', { name: '拼音学习' }).click();
  await page.getByRole('tab', { name: '汉字笔画与结构' }).click();
  await page.locator('[data-action="hz-resume"]').click();
  await expect(page.locator('.hz-feedback')).toContainText('先认识答案');
  const state = (await stored(page)).hanzi;
  expect(state.round.questions[0].id).toBe(question.id);
  expect(state.round.responses[0].skipped).toBe(true);
  expect(state.mistakes).toContain(question.id);
});

test('汉字页面只显示汉字错题本，清空记录同时清除汉字数据', async ({ page }) => {
  await openHanzi(page);
  await page.locator('[data-action="hz-known"]').click();
  await page.locator('.my-menu-toggle').click();
  await expect(page.locator('.my-menu [data-action="mode"][data-id="mistakes"]')).toHaveCount(0);
  await expect(page.locator('.my-menu [data-action="hanzi-review"]')).toBeDisabled();
  await expect(page.locator('.growth-card')).toContainText('我的成长花园');
  await page.locator('.my-menu-toggle').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  expect((await stored(page)).hanzi.known).toEqual([]);
  await expect(page.locator('.star-counter b')).toHaveText('0');
});

test('本地存储不可用时仍可学习和答题', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await openHanzi(page);
  await page.locator('[data-action="hz-known"]').click();
  await expect(page.locator('[data-action="hz-known"]')).toContainText('已经认识');
  await page.locator('[data-action="hz-start"][data-id="strokes"]').click();
  await page.locator('[data-action="hz-skip"]').click();
  await expect(page.locator('.hz-feedback')).toContainText('先认识答案');
});

test('手机平板桌面无横向溢出，键盘和减少动态效果可用', async ({ page }) => {
  await openHanzi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-action="hz-category"][data-id="order"]').click();
  await page.locator('[data-action="hz-stroke-next"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hz-step-status')).toHaveText('第 1 / 3 笔：横');
  expect(await page.locator('.hz-current-stroke').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="hz-start"][data-id="all"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="hz-learn"]').click();
  }
});
