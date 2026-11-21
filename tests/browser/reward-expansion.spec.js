import { test, expect } from '@playwright/test';
import { defaultState } from '../../src/engine.js';
import { initializeRewards, grantRewards } from '../../src/rewards.js';
import { phonicsQuestionById } from '../../src/phonics-engine.js';
import { openMyMenu, selectTopic, seedStoredState as seed, setRoundLength, stored } from './helpers.js';

function fresh() { const state = defaultState(); initializeRewards(state); return state; }

test('收藏总则、分类和特例帮助支持摘要、全文、返回焦点与未解锁范围', async ({ page }) => {
  await page.goto('/');
  await openMyMenu(page, '[data-action="reward-collection"]');
  await expect(page.locator('.reward-card')).toHaveCount(88);
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
  await expect(page.locator('.reward-card')).toHaveCount(15);
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

test('从领奖提示打开预览，关闭后直接返回学习页并继续奖励队列', async ({ page }) => {
  const state = fresh();
  for (let index = 0; index < 10; index++) grantRewards(state, { type: 'answer', question: { id: `queued-${index}` } });
  await seed(page, state);
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.reward-notice')).toContainText('好奇放大镜');
  await page.getByRole('button', { name: '知道了', exact: true }).click();
  await expect(page.locator('.reward-notice')).toContainText('知识纸飞机');
  await expect(page.locator('.reward-notice .reward-plane')).toHaveCSS('animation-name', 'viewer-plane-orbit');
  await page.locator('.reward-notice-view').click();
  await expect(page.locator('.reward-notice')).toHaveCount(0);
  expect((await stored(page)).rewards.pending).toEqual(['garden-sprout']);
  await expect(page.locator('#reward-detail-name')).toHaveText('知识纸飞机');
  const plane = page.locator('.reward-detail .reward-plane');
  await expect(plane).toHaveCSS('animation-name', 'viewer-plane-orbit');
  await expect(plane).toHaveCSS('animation-iteration-count', '1');
  await page.locator('.reward-viewer-scene').evaluate(scene => {
    for (const animation of scene.getAnimations({ subtree: true })) animation.finish();
  });
  await expect(page.locator('[data-viewer-action="motion"]')).toHaveText('播放动效');
  await expect(plane).toHaveCSS('animation-name', 'none');
  await page.locator('[data-viewer-action="motion"]').click();
  await expect(plane).toHaveCSS('animation-name', 'viewer-plane-orbit');
  await page.clock.runFor(20_000);
  await expect(page.locator('#reward-detail-name')).toBeVisible();
  await expect(page.locator('.reward-notice')).toHaveCount(0);
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('#dialog')).toBeHidden();
  await expect(page.locator('.reward-notice')).toContainText('窗边小树苗');
  await page.reload();
  await expect(page.locator('.reward-notice')).toContainText('窗边小树苗');
  expect((await stored(page)).rewards.pending).toEqual(['garden-sprout']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.reward-notice .reward-art > g')).toHaveCSS('animation-name', 'none');
  await page.locator('.reward-notice-view').click();
  await expect(page.locator('#reward-detail-name')).toHaveText('窗边小树苗');
  await expect(page.locator('.reward-detail .reward-art > g')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('[data-viewer-action="motion"]')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#dialog')).toBeHidden();
  await expect(page.locator('.reward-notice')).toHaveCount(0);
});

test('星星提示的查看打开星星明细', async ({ page }) => {
  const state = fresh();
  state.rewards.unlocks['hello-bunny'] = Date.now();
  await seed(page, state);
  await page.clock.install();
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  const notice = page.locator('[data-reward-notice="stars"]');
  await expect(notice).toContainText('收获 1 颗成长星');
  await notice.getByRole('button', { name: '查看', exact: true }).click();
  const ledger = page.getByRole('dialog', { name: '每颗星星，都有来处' });
  await expect(notice).toHaveCount(0);
  await page.clock.runFor(20_000);
  await expect(ledger.locator('.reward-ledger')).toContainText('第一次认识：a');
  await ledger.getByRole('button', { name: '关闭弹窗' }).click();
  await expect(notice).toHaveCount(0);
});

test('普通提示悬停和聚焦时仍在 20 秒自动收起并继续下一件', async ({ page }) => {
  const state = fresh();
  for (let index = 0; index < 10; index++) grantRewards(state, { type: 'answer', question: { id: `automatic-${index}` } });
  await seed(page, state);
  await page.clock.install();
  await page.goto('/');
  const notice = page.locator('.reward-notice');
  await expect(notice).toContainText('好奇放大镜');
  await notice.hover();
  await notice.getByRole('button', { name: '查看', exact: true }).focus();
  await page.clock.runFor(19_000);
  await expect(notice).toContainText('好奇放大镜');
  await page.clock.runFor(1_300);
  await expect(notice).toContainText('知识纸飞机');
});

test('金牌颁奖显示 20 秒后自动收起并继续队列', async ({ page }) => {
  const state = fresh();
  state.rewards.unlocks['stage-math-1-gold'] = Date.now();
  state.rewards.pending = ['stage-math-1-gold'];
  await seed(page, state);
  await page.clock.install();
  await page.goto('/');
  const gold = page.locator('.gold-celebration');
  await expect(gold).toBeVisible();
  await page.clock.runFor(19_000);
  await expect(gold).toBeVisible();
  await page.clock.runFor(1_300);
  await expect(gold).toHaveCount(0);
  await expect(page.locator('.reward-notice')).toContainText('金色向日葵');
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
  const animatedPrize = gold.locator('.gold-prize .reward-viewer-character');
  await expect(animatedPrize).toHaveCSS('animation-name', 'gold-arrive');
  await page.screenshot({ path: 'artifacts/reward-gold-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(animatedPrize).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/reward-gold-mobile.png' });
  await page.getByRole('button', { name: '太棒啦，收下金牌', exact: true }).click();
  await expect(gold).toHaveCount(0);
  await expect(page.locator('.reward-notice')).toContainText('金色向日葵');
  expect((await stored(page)).rewards.pending).toEqual(['garden-golden-flower']);
});

test('数学普通本节练习自动判定完成，刷新后保留小节成果', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '数学', exact: true }).click();
  await selectTopic(page, '数的认识', 'math');
  await page.locator('[data-action="ct-known"]').click();
  await page.locator('[data-action="ct-next"]').click();
  await page.locator('[data-action="ct-known"]').click();
  const shortcut = page.locator('.section-practice-shortcut');
  const sectionId = `math-numbers/${await shortcut.getAttribute('data-id')}`;
  await shortcut.click();
  const questions = (await stored(page)).topics['math-numbers'].round.questions;
  expect(questions).toHaveLength(10);
  for (const [index, question] of questions.entries()) {
    if (index === 0) await page.getByRole('button', { name: question.options.find(option => option !== question.answer), exact: true }).click();
    await page.getByRole('button', { name: question.answer, exact: true }).click();
    await page.locator('[data-action="ct-advance"]').click();
  }
  await expect(page.locator('.section-reward-panel')).toHaveCount(0);
  const saved = await stored(page);
  expect(saved.rewards.mastery[sectionId].correctIds).toHaveLength(9);
  expect(saved.rewards.unlocks['sections-1']).toBeTruthy();
  await page.reload();
  expect((await stored(page)).rewards.mastery[sectionId].correctIds).toHaveLength(9);
});

test('英语认读与五题达标接入统一奖励，科目间共享每日星星', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '英语', exact: true }).click();
  await page.locator('[data-action="ph-known"]').click();
  expect((await stored(page)).rewards.events.some(event => event.id.startsWith('learn:english:'))).toBe(true);
  await page.locator('.ph-rule .section-practice-shortcut').click();
  await setRoundLength(page, 5);
  for (let index = 0; index < 5; index++) {
    const english = (await stored(page)).phonics;
    const round = english.sessions[`mixed:lesson:${english.lessonId}:5`];
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
