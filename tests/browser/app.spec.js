import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { chooseMode, stored, selectTopic, setRoundLength } from './helpers.js';

test('顺序学习、点读、收藏、进度恢复与学科切换', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('[data-action="play-current"].sound-button').click();
  await expect(page.locator('.primary-audio')).toHaveClass(/playing/);
  await expect(page.locator('.primary-audio')).not.toHaveClass(/playing/, { timeout: 10000 });
  await page.locator('[data-action="favorite"]').click();
  await page.locator('[data-action="known"]').click();
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  await page.reload();
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  const state = await stored(page);
  expect(state.known).toContain('single-a');
  expect(state.favorites).toContain('single-a');
  await page.locator('[data-action="subject"][data-id="math"]').click();
  await expect(page.locator('.math-topic h1')).toHaveText('数的认识✿');
  await page.locator('[data-action="subject"][data-id="chinese"]').first().click();
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  await page.getByRole('button', { name: '收起侧栏', exact: true }).click();
  await expect(page.locator('#app')).toHaveClass(/sidebar-collapsed/);
  expect(errors).toEqual([]);
});

test('所有练习方式可进入，随机范围不重复', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.my-menu [data-action="library-open"][data-id="mistakes"]')).toHaveText('错题本（0）');
  const modes = ['random', 'tones', 'listen', 'audio', 'blend', 'hanzi', 'pinyin', 'confusing', 'rules', 'match', 'challenge'];
  for (const id of modes) {
    await chooseMode(page, id);
    await expect(page.locator('.learning-main')).toHaveAttribute('aria-label', /.+/);
    await expect(page.locator('.learning-main>.section-title')).toHaveCount(0);
    await expect(page.locator('.learning-main [role="tabpanel"] > section').first()).toBeVisible();
    await expect(page.locator('dialog')).not.toBeVisible();
  }
  await chooseMode(page, 'random');
  await page.locator('[data-action="map-group"][data-id="single"]').click();
  const seen = [];
  for (let index = 0; index < 6; index++) {
    seen.push(await page.locator('.pinyin-display').textContent());
    if (index < 5) await page.locator('[data-action="next"]').click();
  }
  expect([...seen].sort()).toEqual(['a', 'e', 'i', 'o', 'u', 'ü']);
  await expect(page.locator('.card-navigation [data-action="pinyin-section-practice"]')).toBeVisible();
});

test('答错后重试，查看答案，完成一轮和错题复习', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'rules');
  await setRoundLength(page, 5);
  let state = await stored(page);
  const sessionKey = `rules:all:all:retroflex:5`;
  const question = state.sessions[sessionKey].questions[0];
  const wrong = question.options.find(option => option !== question.answer);
  await page.locator('[data-action="answer"]').filter({ hasText: wrong }).click();
  await expect(page.locator('.answer-feedback')).toContainText('再试一次');
  await page.locator('[data-action="skip"]').click();
  await expect(page.locator('.answer-feedback')).toContainText('先认识答案');
  await expect(page.locator('.answer-feedback')).not.toContainText('答对啦');
  for (let index = 0; index < 5; index++) {
    if (index > 0) {
      state = await stored(page);
      const current = state.sessions[sessionKey].questions[index];
      await page.locator('[data-action="answer"]').filter({ hasText: current.answer }).click();
    }
    await page.locator('[data-action="next-question"]').click();
  }
  await expect(page.locator('.result-card')).toContainText('首次答对');
  state = await stored(page);
  expect(state.history.at(-1).correct).toBe(4);
  expect(state.mistakes).toHaveLength(1);
  await chooseMode(page, 'mistakes');
  await page.locator('[data-action="answer"]').filter({ hasText: question.answer }).click();
  expect((await stored(page)).mistakes).toHaveLength(0);
});

test('配对可用点击完成且保存重试错题', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'match');
  const value = (await stored(page)).sessions['match:all:all:retroflex:10'];
  await page.locator(`[data-action="match-left"][data-id="${value.pairs[0]}"]`).click();
  await page.locator(`[data-action="match-right"][data-id="${value.pairs[1]}"]`).click();
  expect((await stored(page)).mistakes).toHaveLength(1);
  for (const id of value.pairs) {
    await page.locator(`[data-action="match-left"][data-id="${id}"]`).click();
    await page.locator(`[data-action="match-right"][data-id="${id}"]`).click();
  }
  await expect(page.locator('.result-card')).toContainText('都找到伙伴');
  expect((await stored(page)).history.at(-1).correct).toBe(3);
});

test('分类、主题、学习操作和刷新保持各自选择与进度', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="next"]').click();
  await expect(page.locator('.pinyin-display')).toHaveText('o');
  await selectTopic(page, '近义词与反义词');
  await expect(page.locator('.feature-navigation').getByRole('tab')).toHaveCount(7);
  await page.reload();
  await expect(page.getByRole('tab', { name: '近义词与反义词', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('[data-action="subject"][data-id="english"]').click();
  await page.locator('[data-action="subject"][data-id="chinese"]').click();
  await expect(page.getByRole('tab', { name: '近义词与反义词', exact: true })).toHaveAttribute('aria-selected', 'true');
  await selectTopic(page, '拼音学习');
  await expect(page.locator('.pinyin-display')).toHaveText('o');
});

test('设置弹窗、清空确认与键盘关闭', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('input[data-setting="slow"]').check();
  expect((await stored(page)).settings.slow).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await expect(page.locator('dialog')).toContainText('无法恢复');
  await page.locator('[data-action="reset-all"]').click();
  expect((await stored(page)).known).toHaveLength(0);
});

test('取消清空、右上角关闭和 Esc 都返回学习设置原位', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 620 });
  await page.goto('/');
  await page.locator('.my-menu-toggle').click();
  await page.locator('.my-menu').getByRole('button', { name: '学习设置' }).click();
  const settings = page.getByRole('dialog', { name: '学习设置' });
  await settings.locator('input[data-setting="slow"]').check();
  const before = await stored(page);
  const clear = settings.getByRole('button', { name: '清空本机学习记录' });
  const confirmation = page.getByRole('dialog', { name: '确定清空本机记录吗？' });
  const cancel = confirmation.getByRole('button', { name: '取消', exact: true });
  const dismissals = [
    () => cancel.click(),
    () => confirmation.getByRole('button', { name: '关闭弹窗' }).click(),
    () => page.keyboard.press('Escape'),
  ];

  for (const dismiss of dismissals) {
    await clear.scrollIntoViewIfNeeded();
    const scrollTop = await settings.evaluate(element => element.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
    await clear.click();
    await expect(cancel).toBeFocused();
    await dismiss();
    await expect(clear).toBeFocused();
    expect(await settings.evaluate(element => element.scrollTop)).toBe(scrollTop);
    expect(await stored(page)).toEqual(before);
  }

  await settings.getByRole('button', { name: '关闭弹窗' }).click();
  await expect(settings).not.toBeVisible();
});

test('学习设置的开关行与操作行沿用下拉菜单悬停样式', async ({ page }) => {
  await page.goto('/');
  await page.locator('.my-menu-toggle').click();
  const menuSettings = page.locator('.my-menu').getByRole('button', { name: '学习设置' });
  await menuSettings.hover();
  const hoverStyle = element => {
    const css = getComputedStyle(element);
    return [css.backgroundColor, css.borderRadius];
  };
  await expect.poll(() => menuSettings.evaluate(hoverStyle)).toEqual(['rgb(247, 237, 243)', '9px']);
  const expected = await menuSettings.evaluate(hoverStyle);
  await menuSettings.click();
  const settings = page.getByRole('dialog', { name: '学习设置' });
  for (const row of [settings.locator('label.setting-row').first(), settings.getByRole('button', { name: '清空本机学习记录' })]) {
    await row.hover();
    await expect.poll(() => row.evaluate(hoverStyle)).toEqual(expected);
  }
});

test('桌面、平板和手机没有横向溢出，生成预览截图', async ({ page }) => {
  await mkdir('artifacts', { recursive: true });
  for (const viewport of [{ width: 1440, height: 1100, name: 'desktop' }, { width: 820, height: 1180, name: 'tablet' }, { width: 390, height: 844, name: 'mobile' }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await page.screenshot({ path: `artifacts/${viewport.name}.png`, fullPage: true, animations: 'disabled' });
    if (viewport.name === 'mobile') {
      await page.locator('[data-action="mobile-menu"].mobile-toggle').click();
      await page.locator('[data-action="subject"][data-id="english"]').click();
      await expect(page.locator('.phonics-page')).toBeVisible();
    }
  }
});

test('声调听辨可答题并显示声调解释', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'tones');
  await page.locator('[data-action="pinyin-section-practice"][data-id="tones"]').click();
  const value = (await stored(page)).sessions['tonequiz:all:all:retroflex:10'];
  await page.locator('[data-action="answer"]').filter({ hasText: value.questions[0].answer }).click();
  await expect(page.locator('.answer-feedback')).toContainText('音高的变化');
  await expect(page.locator('[data-action="next-question"]')).toBeFocused();
});
