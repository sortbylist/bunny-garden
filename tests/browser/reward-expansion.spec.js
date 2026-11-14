import { test, expect } from '@playwright/test';
import { defaultState } from '../../src/engine.js';
import { initializeRewards, grantRewards } from '../../src/rewards.js';
import { phonicsQuestionById } from '../../src/phonics-engine.js';
import { selectTopic } from './helpers.js';

async function seed(page, state) {
  await page.addInitScript(saved => {
    if (!sessionStorage.getItem('reward-test-seeded')) {
      localStorage.setItem('bunny-garden-v1', JSON.stringify(saved));
      sessionStorage.setItem('reward-test-seeded', 'yes');
    }
  }, state);
}

function fresh() { const state = defaultState(); initializeRewards(state); return state; }
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('bunny-garden-v1')));

test('收藏总则、分类和特例帮助支持摘要、全文、返回焦点与未解锁范围', async ({ page }) => {
  await page.goto('/');
  await page.locator('.garden-links [data-action="reward-collection"]').click();
  await expect(page.locator('.reward-card')).toHaveCount(89);
  const general = page.getByRole('button', { name: '查看收藏规则', exact: true });
  await general.hover();
  await expect(page.locator('#reward-help-all')).toBeVisible();
  await expect(page.locator('#reward-help-all')).toContainText('点击查看完整说明。');
  expect([...(await page.locator('#reward-help-all').textContent())].length).toBeLessThanOrEqual(100);
  await expect(general).not.toContainText('点击查看完整说明');
  await general.click();
  await expect(page.locator('.reward-help-content')).toContainText('90题徽章');
  expect(await page.locator('.reward-help-tooltip:popover-open').count()).toBe(0);
  for (const category of ['sticker', 'badge', 'medal', 'decoration']) {
    const categoryButton = page.locator(`.reward-help-links [data-id="${category}"]`);
    await categoryButton.click();
    await expect(page.getByRole('button', { name: '返回上一级规则', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '返回上一级规则', exact: true }).click();
    await expect(page.locator('.reward-help-content')).toContainText('90题徽章');
    await expect(categoryButton).toBeFocused();
  }
  await page.getByRole('button', { name: '返回收藏册', exact: true }).click();
  await expect(general).toBeFocused();
  expect(await page.locator('.reward-help-tooltip:popover-open').count()).toBe(0);
  await page.mouse.move(0, 0);
  await general.hover();
  await expect(page.locator('#reward-help-all')).toBeVisible();
  await page.locator('[data-action="reward-filter"][data-id="medal"]').click();
  await expect(page.locator('.reward-card')).toHaveCount(24);
  await page.getByRole('button', { name: '查看奖牌规则', exact: true }).click();
  await expect(page.locator('.reward-help-content')).toContainText('12个小节');
  await page.getByRole('button', { name: '返回收藏册', exact: true }).click();
  const specific = page.getByRole('button', { name: '查看数与运算金牌获得条件', exact: true });
  await specific.click();
  await expect(page.locator('.reward-scope')).toContainText('混合运算');
  await expect(page.locator('.reward-scope')).toContainText('练习待达标');
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('[data-action="reward-filter"][data-id="medal"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(specific).toBeFocused();
});

test('多件奖励手动逐件提示，查看规则暂停，刷新保留尚未展示的奖励', async ({ page }) => {
  const state = fresh();
  for (let index = 0; index < 10; index++) grantRewards(state, { type: 'answer', question: { id: `queued-${index}` } });
  await seed(page, state);
  await page.goto('/');
  await expect(page.locator('.reward-notice')).toContainText('好奇放大镜');
  await page.getByRole('button', { name: '知道了', exact: true }).click();
  await expect(page.locator('.reward-notice')).toContainText('知识纸飞机');
  await page.locator('.reward-notice-view').click();
  await expect(page.locator('.reward-notice')).toHaveCount(0);
  await page.getByRole('button', { name: '查看收藏规则', exact: true }).click();
  await expect(page.locator('.reward-notice')).toHaveCount(0);
  await page.getByRole('button', { name: '返回收藏册', exact: true }).click();
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('.reward-notice')).toContainText('知识纸飞机');
  await page.reload();
  await expect(page.locator('.reward-notice')).toContainText('知识纸飞机');
  expect((await stored(page)).rewards.pending).toEqual(['paper-plane', 'garden-sprout']);
});

test('普通提示自动消失后继续下一件', async ({ page }) => {
  const state = fresh();
  for (let index = 0; index < 10; index++) grantRewards(state, { type: 'answer', question: { id: `automatic-${index}` } });
  await seed(page, state);
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.reward-notice')).toContainText('好奇放大镜');
  await page.clock.runFor(6800);
  await expect(page.locator('.reward-notice')).toContainText('知识纸飞机');
});

test('金牌居中颁奖、主动收下后继续队列，支持手机与减少动态效果', async ({ page }) => {
  const state = fresh();
  state.rewards.unlocks['stage-math-1-gold'] = Date.now();
  state.rewards.pending = ['stage-math-1-gold'];
  await seed(page, state);
  await page.goto('/');
  const gold = page.locator('.gold-celebration');
  await expect(gold).toBeVisible();
  await expect(gold).toContainText('数与运算金牌');
  await expect(gold).toHaveClass(/gold-motion/);
  await expect(gold.locator('.gold-prize')).toHaveCSS('animation-name', 'gold-arrive');
  await page.screenshot({ path: 'artifacts/reward-gold-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(gold.locator('.gold-prize')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/reward-gold-mobile.png' });
  await page.getByRole('button', { name: '太棒啦，收下金牌', exact: true }).click();
  await expect(gold).toHaveCount(0);
  await expect(page.locator('.reward-notice')).toContainText('金色向日葵');
  expect((await stored(page)).rewards.pending).toEqual(['garden-golden-flower']);
});

test('数学学习确认加五题独立达标，刷新后保留小节成果', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '数学', exact: true }).click();
  await selectTopic(page, '数的认识', 'math');
  await page.locator('[data-action="ct-known"]').click();
  await page.locator('[data-action="ct-next"]').click();
  await page.locator('[data-action="ct-known"]').click();
  await expect(page.locator('.section-reward-panel')).toContainText('学习确认 2 / 2');
  const sectionId = await page.locator('[data-action="section-assessment"]').getAttribute('data-id');
  await page.locator('[data-action="section-assessment"]').click();
  const questions = (await stored(page)).topics['math-numbers'].round.questions;
  expect(questions).toHaveLength(5);
  for (const [index, question] of questions.entries()) {
    if (index === 0) await page.getByRole('button', { name: question.options.find(option => option !== question.answer), exact: true }).click();
    await page.getByRole('button', { name: question.answer, exact: true }).click();
    await page.locator('[data-action="ct-advance"]').click();
  }
  await expect(page.locator('.section-reward-panel')).toContainText('本小节完成啦');
  const saved = await stored(page);
  expect(saved.rewards.mastery[sectionId].correctIds).toHaveLength(4);
  expect(saved.rewards.unlocks['sections-1']).toBeTruthy();
  await page.reload();
  await expect(page.locator('.section-reward-panel')).toContainText('本小节完成啦');
});

test('英语认读与五题达标接入统一奖励，科目间共享每日星星', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '英语', exact: true }).click();
  await page.locator('[data-action="ph-known"]').click();
  expect((await stored(page)).rewards.events.some(event => event.id.startsWith('learn:english:'))).toBe(true);
  await page.locator('[data-action="section-assessment"]').click();
  for (let index = 0; index < 5; index++) {
    const english = await page.evaluate(() => JSON.parse(localStorage.getItem('bunny-phonics-gb-v1')));
    const round = english.sessions[`assessment:lesson:${english.lessonId}:5`];
    const identifier = round.ids[round.index];
    const question = phonicsQuestionById.get(identifier);
    if (question.kind === 'spelling') {
      await page.locator('#ph-spelling-input').fill(question.answer);
      await page.locator('#ph-spelling-form button[type="submit"]').click();
    } else await page.locator(`[data-action="ph-answer"][data-value=${JSON.stringify(question.answer)}]`).click();
    await page.locator('[data-action="ph-next-question"]').click();
  }
  const saved = await stored(page);
  expect(saved.rewards.mastery['english/lesson-1'].correctIds).toHaveLength(5);
  expect(saved.rewards.events.filter(event => event.kind === 'daily')).toHaveLength(1);
  expect(saved.rewards.events.filter(event => event.kind === 'solve' && event.id.startsWith('solve:english:'))).toHaveLength(5);
});
