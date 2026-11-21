import { test, expect } from '@playwright/test';
import { chooseMode, openMyMenu, stored, setRoundLength } from './helpers.js';

async function stars(page) { return page.locator('.topbar .star-counter b').textContent(); }

test('拼音玩法按分类单行显示，保存选择，常用复习入口及字号可见', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.play-selector')).not.toContainText('今天，想怎么玩？');
  await expect(page.locator('[data-action="pinyin-area"][data-id="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mode-navigation .nav-tabs .play-mode')).toHaveCount(7);
  await expect(page.locator('[data-action="toggle-modes"]')).toHaveCount(0);
  await expect(page.locator('.play-selector')).not.toContainText('声母学习');
  await page.locator('.my-menu-toggle').click();
  const records = page.locator('.my-menu [data-id="records"]');
  expect(await records.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  await records.click();
  await expect(page.locator('.review-library')).toContainText('练习记录');
  await page.locator('[data-action="library-exit"]').click();
  await page.reload();
  await expect(page.locator('[data-action="pinyin-area"][data-id="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await chooseMode(page, 'hanzi');
  await expect(page.locator('.play-selector .nav-tabs .selected')).toContainText('看字选拼音');
  await page.reload();
  await expect(page.locator('[data-action="pinyin-area"][data-id="practice"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.play-selector .nav-tabs .selected')).toContainText('看字选拼音');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.mode-navigation .nav-tabs .selected')).toContainText('看字选拼音');
  await chooseMode(page, 'sequence');
  await expect(page.locator('[data-action="pinyin-area"][data-id="learn"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('头像一致，昵称保存且按文本显示，错题从我的菜单打开', async ({ page }) => {
  await page.goto('/');
  const source = await page.locator('.brand img').getAttribute('src');
  await expect(page.locator('.my-menu-toggle img')).toHaveAttribute('src', source);
  await page.locator('.my-menu-toggle').click();
  const menu = page.locator('.my-menu');
  await expect(menu.getByRole('button', { name: '设置昵称' })).toHaveCount(0);
  await menu.getByRole('button', { name: '学习设置' }).click();
  const settings = page.getByRole('dialog', { name: '学习设置' });
  const nicknameRow = settings.getByRole('button', { name: /昵称/ });
  await nicknameRow.click();
  await page.locator('#nickname').fill('不保存');
  await page.getByRole('button', { name: '返回学习设置' }).click();
  await expect(nicknameRow).toBeFocused();
  await expect(nicknameRow).not.toContainText('不保存');
  await nicknameRow.click();
  await page.locator('#nickname').fill('你'.repeat(13));
  await page.locator('#nickname-form [type="submit"]').click();
  await expect(page.locator('#nickname-error')).toContainText('1–12');
  await page.locator('#nickname').fill('<b>小兔</b>');
  await page.locator('#nickname-form [type="submit"]').click();
  await expect(nicknameRow).toBeFocused();
  await expect(nicknameRow.locator('.setting-value')).toHaveText('<b>小兔</b>');
  await expect(nicknameRow.locator('.setting-value b')).toHaveCount(0);
  await page.locator('[data-action="close-dialog"]').click();
  await page.reload();
  await expect(page.locator('.my-menu-toggle')).toContainText('<b>小兔</b>');
  await chooseMode(page, 'rules');
  await page.locator('[data-action="skip"]').click();
  await openMyMenu(page, '[data-id="mistakes"]');
  await expect(page.locator('#library-title')).toHaveText('错题本');
  await expect(page.locator('.my-menu')).not.toHaveAttribute('open', '');
});

test('认读星星去重、规则流水可查、贴纸展示与庆祝重播不再次发奖', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  expect(await stars(page)).toBe('1');
  await expect(page.locator('.reward-notice')).toContainText('出发小兔');
  await page.locator('[data-action="previous"]').click();
  await page.locator('[data-action="practice-later"]').click();
  await page.locator('[data-action="previous"]').click();
  await page.locator('[data-action="known"]').click();
  expect(await stars(page)).toBe('1');
  await page.reload();
  await page.locator('.star-counter').click();
  await expect(page.locator('.reward-ledger')).toContainText('第一次认识：a');
  await expect(page.locator('.reward-rule-list')).toContainText('每天奖励一次');
  await page.locator('dialog [data-action="reward-collection"]').click();
  await expect(page.locator('.reward-card')).toHaveCount(88);
  await expect(page.locator('[data-reward="hello-bunny"]')).toHaveClass(/unlocked/);
  await page.locator('[data-action="equip-reward"][data-id="hello-bunny"]').click();
  await expect(page.locator('[data-reward="hello-bunny"]')).toContainText('展示中');
  await page.locator('[data-action="reward-detail"][data-id="hello-bunny"]').click();
  await page.locator('[data-action="replay-reward"]').click();
  await expect(page.locator('dialog .reward-notice')).toContainText('出发小兔');
  expect(await stars(page)).toBe('1');
  await page.locator('[data-action="close-dialog"]').click();
  await expect(page.locator('.garden-display')).toContainText('出发小兔');
  await page.reload();
  await expect(page.locator('.garden-display')).toContainText('出发小兔');
});

test('答错重试可收获新题星，完成有效练习每日加星，错题独立改正再奖励', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'rules');
  await setRoundLength(page, 5);
  const sessionKey = 'rules:all:all:retroflex:5';
  const questions = (await stored(page)).sessions[sessionKey].questions;
  for (let index = 0; index < 5; index++) {
    const question = questions[index];
    if (index === 0) await page.locator(`[data-action="answer"][data-value="${question.options.find(option => option !== question.answer)}"]`).click();
    await page.locator(`[data-action="answer"][data-value="${question.answer}"]`).click();
    await page.locator('[data-action="next-question"]').click();
  }
  expect(await stars(page)).toBe('8');
  await expect(page.locator('.my-menu [data-id="mistakes"]')).toHaveText('错题本（1）');
  await chooseMode(page, 'mistakes');
  await page.locator(`[data-action="answer"][data-value="${questions[0].answer}"]`).click();
  expect(await stars(page)).toBe('10');
  expect((await stored(page)).rewards.unlocks['brave-mushroom']).toBeTruthy();
  expect((await stored(page)).rewards.unlocks['garden-sprout']).toBeTruthy();
  await page.locator('[data-action="library-next"]').click();
  await expect(page.locator('.my-menu [data-id="mistakes"]')).toHaveText('错题本（0）');
  expect(await stars(page)).toBe('10');
  await openMyMenu(page, '[data-action="reward-collection"]');
  await page.locator('[data-action="reward-filter"][data-id="decoration"]').click();
  await page.locator('[data-action="equip-reward"][data-id="garden-sprout"]').click();
  await page.locator('[data-action="close-dialog"]').click();
  await page.locator('[data-action="library-exit"]').click();
  await expect(page.locator('.garden-display')).toContainText('窗边小树苗');
});

test('末项发奖和本节练习同时可见，减少动态效果生效，清空记录包含奖励昵称', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-action="map-group"][data-id="single"]').click();
  await page.locator('.pinyin-map [data-index="5"]').click();
  await page.locator('[data-action="known"]').click();
  await expect(page.locator('.card-navigation [data-action="pinyin-section-practice"]')).toBeVisible();
  await expect(page.locator('.reward-notice')).toContainText('出发小兔');
  const animation = await page.locator('.reward-notice').evaluate(element => getComputedStyle(element).animationName);
  expect(animation).toBe('none');
  await page.locator('.reward-notice-ack').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('input[data-setting="animations"]').uncheck();
  await page.locator('[data-action="reset-confirm"]').click();
  await expect(page.locator('dialog')).toContainText('昵称、星星、贴纸、徽章');
  await page.locator('[data-action="reset-all"]').click();
  expect(await stars(page)).toBe('0');
  expect((await stored(page)).nickname).toBe('小小探索家');
  expect(Object.keys((await stored(page)).rewards.unlocks)).toHaveLength(0);
});

test('手机个人中心、奖励收藏册可操作且没有横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-action="pinyin-area"][data-id="learn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.mode-navigation .nav-rail')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.my-menu-toggle').click();
  await page.locator('.my-menu [data-action="profile"]').click();
  await expect(page.locator('.profile-heading')).toBeVisible();
  await page.locator('[data-action="close-dialog"]').click();
  await openMyMenu(page, '[data-action="reward-collection"]');
  await page.locator('[data-action="reward-filter"][data-id="badge"]').click();
  await expect(page.locator('.reward-card')).toHaveCount(50);
  expect(await page.locator('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
