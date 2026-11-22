import { test, expect } from '@playwright/test';
import { defaultState } from '../../src/engine.js';
import { choosePhonicsMode, seedStoredState, selectPhonicsLesson, stored } from './helpers.js';

test('英语随机词卡一轮不重复，切换课次不丢失当前轮', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await choosePhonicsMode(page, 'random');
  const words = [];
  for (let index = 0; index < 15; index++) {
    words.push(await page.locator('.ph-word').textContent());
    await page.locator('[data-action="ph-next"]').click();
  }
  expect(new Set(words).size).toBe(15);
  await expect(page.locator('.ph-finish')).toBeVisible();
  await page.locator('[data-action="ph-restart"]').first().click();
  await expect(page.locator('.ph-confirm')).toBeVisible();
  await page.locator('[data-action="ph-cancel-restart"]').click();
  await expect(page.locator('.ph-finish')).toBeVisible();
  await page.locator('[data-action="ph-restart"]').first().click();
  await page.locator('[data-action="ph-confirm-restart"]').click();
  await expect(page.locator('.ph-word')).toBeVisible();
  const savedWord = await page.locator('.ph-word').textContent();
  await selectPhonicsLesson(page, 'lesson-2');
  await selectPhonicsLesson(page, 'lesson-1');
  expect((await stored(page)).phonics.mode).toBe('random');
  await expect(page.locator('.ph-word')).toHaveText(savedWord);
});

test('全局清空同时重置语文和英语', async ({ page }) => {
  const state = defaultState();
  state.known = ['single-a'];
  await seedStoredState(page, state);
  await page.goto('/');
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('map');
  await page.locator('[data-action="ph-known"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('map');
  const reset = await stored(page);
  expect(reset.phonics.known).toEqual([]);
  expect(reset.known).toEqual([]);
});

test('英语未完成题首答与重试可在刷新后保持', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await choosePhonicsMode(page, 'rules');
  await page.locator('[data-action="ph-answer"][data-value="zip"]').click();
  await page.reload();
  await expect(page.locator('.ph-feedback')).toContainText('还差一点');
  await page.locator('[data-action="ph-skip"]').click();
  await page.reload();
  await expect(page.locator('.ph-feedback')).toContainText('先看看答案');
  await page.locator('[data-action="ph-next-question"]').click();
  const english = (await stored(page)).phonics;
  const round = english.sessions[`mixed:lesson:${english.lessonId}:${english.length}`];
  expect(round.responses['rule-1']).toMatchObject({ answer: 'zip', correct: false, skipped: false });
});
