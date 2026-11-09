import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function openEnglish(page) {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.phonics-page')).toBeVisible();
}

async function englishState(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('bunny-phonics-gb-v1'))); }
async function mode(page, id) { await page.locator(`.ph-modes [data-id="${id}"]`).click(); }
function currentRound(state) { return state.sessions[`${state.mode}:${state.scope}:${state.lessonId}:${state.length}`]; }

test('英音入口、48 课地图、自评前进、收藏与刷新恢复不影响语文', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openEnglish(page);
  await expect(page.getByRole('tab', { name: '自然拼读' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#ph-lesson-select option')).toHaveCount(48);
  await expect(page.locator('.ph-word')).toHaveText('map');
  await page.locator('[data-action="ph-favorite"]').click();
  await page.locator('[data-action="ph-known"]').click();
  await expect(page.locator('.ph-word')).toHaveText('mat');
  await page.reload();
  await expect(page.locator('.ph-word')).toHaveText('mat');
  const state = await englishState(page);
  expect(state.favorites).toContain('word-map');
  expect(state.known).toContain('word-map');
  await page.locator('.subjects [data-id="chinese"]').click();
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('mat');
  expect(errors).toEqual([]);
});

test('规律答错重试保留首次结果、查看答案与新轮复习', async ({ page }) => {
  await openEnglish(page);
  await mode(page, 'rules');
  await expect(page.locator('.ph-quiz')).toContainText('按实际数量练习');
  await page.locator('.ph-option').filter({ hasText: 'zee' }).click();
  await expect(page.locator('.ph-feedback')).toContainText('还差一点');
  await page.locator('.ph-option').filter({ hasText: 'zed' }).click();
  await expect(page.locator('.ph-feedback')).toContainText('答对啦');
  await page.locator('[data-action="ph-next-question"]').click();
  await expect(page.locator('.ph-finish')).toContainText('0 / 1');
  await mode(page, 'review');
  await page.locator('.ph-option').filter({ hasText: 'zed' }).click();
  await page.locator('[data-action="ph-next-question"]').click();
  expect((await englishState(page)).mistakes).toEqual([]);
  await mode(page, 'records');
  await expect(page.locator('.ph-history li')).toHaveCount(2);
});

test('拼词支持点选字母、直接输入、Enter 提交及未完成输入恢复', async ({ page }) => {
  await openEnglish(page);
  await mode(page, 'spelling');
  await page.locator('#ph-spelling-input').fill('m');
  await page.reload();
  await expect(page.locator('#ph-spelling-input')).toHaveValue('m');
  const state = await englishState(page);
  const round = currentRound(state);
  const wordId = round.ids[round.index].replace('spelling-word-', '');
  await page.locator('#ph-spelling-input').fill('');
  for (const letter of wordId) await page.locator(`[data-action="ph-letter"][data-value="${letter}"]:not(:disabled)`).first().click();
  await expect(page.locator('#ph-spelling-input')).toHaveValue(wordId);
  await page.locator('#ph-spelling-input').press('Enter');
  await expect(page.locator('.ph-feedback')).toContainText('答对啦');
  expect(currentRound(await englishState(page)).responses[round.ids[round.index]].correct).toBe(true);
});

test('全部玩法、共读答案、课次跳转和待审音频状态可用', async ({ page }) => {
  await openEnglish(page);
  for (const id of ['random', 'meaning', 'spelling', 'rules', 'listen', 'review', 'favorites', 'records']) {
    await mode(page, id);
    await expect(page.locator('.ph-section-title h2')).not.toBeEmpty();
  }
  await mode(page, 'listen');
  await expect(page.locator('.ph-empty')).toContainText('英式声音准备好');
  await expect(page.locator('[data-action="ph-answer"]')).toHaveCount(0);
  await mode(page, 'reading');
  await page.locator('#ph-scope-select').selectOption('all');
  await expect(page.locator('#ph-story-select option')).toHaveCount(36);
  await page.locator('#ph-story-select').selectOption('story-1');
  await page.locator('[data-action="ph-story-answer"][data-value="A cat"]').click();
  await expect(page.locator('.ph-feedback')).toContainText('理解正确');
  await page.locator('#ph-story-select').selectOption('story-2');
  await expect(page.locator('.ph-feedback')).toBeEmpty();
  await page.locator('#ph-lesson-select').selectOption('lesson-29');
  await mode(page, 'learn');
  await expect(page.locator('.ph-rule')).toContainText('/kɑː/');
  await expect(page.locator('.ph-word')).toHaveText('car');
});

test('英式音频门控：未审音不播放，测试录音完整播放后才允许听辨作答', async ({ page }) => {
  await page.route('**/audio/phonics/manifest.json', route => route.fulfill({ json: {
    locale: 'en-GB', files: {
      'word-cat': { locale: 'en-GB', status: 'approved', path: '/audio/phonics/fixture.wav', license: 'test fixture only', source: 'automated test only, not teaching audio', reviewedBy: 'test fixture', reviewedAt: '2026-11-09' },
      'word-map': { locale: 'en-US', status: 'approved', path: '/audio/phonics/fixture.wav' },
    },
  } }));
  const samples = 800;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(8000, 24); buffer.writeUInt32LE(16000, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  await page.route('**/audio/phonics/fixture.wav', route => route.fulfill({ contentType: 'audio/wav', body: buffer }));
  await openEnglish(page);
  await expect(page.locator('[data-action="ph-play"]')).toHaveCount(0);
  await page.locator('#ph-lesson-select').selectOption('lesson-4');
  await mode(page, 'listen');
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(0);
  await page.locator('[data-action="ph-play"]').click();
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(4);
});

for (const width of [1440, 820, 390]) {
  test(`英式自然拼读在 ${width}px 无横向溢出，按钮和输入可操作`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    if (width <= 760) await page.locator('[data-action="mobile-menu"]').click();
    await page.locator('.subjects [data-id="english"]').click();
    await expect(page.locator('.ph-word')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/phonics-${width}.png`, fullPage: true });
    await mode(page, 'spelling');
    await expect(page.locator('#ph-spelling-input')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
