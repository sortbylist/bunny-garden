import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

async function openEnglish(page) {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.phonics-page')).toBeVisible();
}

async function englishState(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('bunny-phonics-gb-v1'))); }
async function mode(page, id) { await page.locator(`${['review', 'favorites', 'records'].includes(id) ? '.garden-links' : '.ph-modes'} [data-id="${id}"]`).click(); }
async function section(page, id) {
  const toggle = page.locator('.ph-map-toggle');
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  const button = page.locator(`.ph-map [data-id="${id}"]`);
  const group = button.locator('..');
  if (await group.getAttribute('open') === null) await group.locator('summary').click();
  await button.click();
}
function currentRound(state) { return state.sessions[`${state.mode}:${state.scope}:${state.lessonId}:${state.length}`]; }

test('自然拼读入口、48 课地图、自评前进、收藏与刷新恢复不影响语文', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openEnglish(page);
  await expect(page.getByRole('tab', { name: '自然拼读' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.ph-map [data-action="ph-lesson"]')).toHaveCount(48);
  await expect(page.locator('#ph-lesson-select')).toHaveCount(0);
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
  await page.locator('.ph-option').filter({ hasText: 'zip' }).click();
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

test('全部玩法、共读答案、课次跳转和缺失语音状态可用', async ({ page }) => {
  await page.route('**/audio/phonics/manifest.json', route => route.fulfill({ json: { locale: 'en-GB', files: {} } }));
  await openEnglish(page);
  for (const id of ['random', 'meaning', 'spelling', 'rules', 'listen', 'favorites', 'records']) {
    await mode(page, id);
    await expect(page.locator('.ph-main')).toHaveAttribute('aria-label', /.+/);
    await expect(page.locator('.ph-section-title')).toHaveCount(0);
    await expect(page.locator('.ph-main > section')).not.toHaveCount(0);
  }
  await mode(page, 'listen');
  await expect(page.locator('.garden-links [data-id="review"]')).toBeDisabled();
  await expect(page.locator('.ph-empty')).toContainText('先来读一读吧');
  await expect(page.locator('[data-action="ph-answer"]')).toHaveCount(0);
  await mode(page, 'reading');
  await expect(page.locator('.ph-map [data-action="ph-lesson"]')).toHaveCount(36);
  await expect(page.locator('.ph-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-13');
  await page.locator('[data-action="ph-story-answer"][data-value="A cat"]').click();
  await expect(page.locator('.ph-feedback')).toContainText('理解正确');
  await section(page, 'lesson-14');
  await expect(page.locator('.ph-feedback')).toHaveText('读一读故事，再选择答案。');
  await expect(page.locator('.ph-feedback')).not.toHaveClass(/success|warning/);
  await expect(page.locator('.ph-modes [data-id="reading"]')).toHaveAttribute('aria-pressed', 'true');
  await section(page, 'lesson-29');
  await mode(page, 'learn');
  await expect(page.locator('.ph-rule')).toContainText('/kɑː/');
  await expect(page.locator('.ph-word')).toHaveText('car');
});

test('听词练习使用对应音频，完整播放后才允许作答', async ({ page }) => {
  await page.route('**/audio/phonics/manifest.json', route => route.fulfill({ json: {
    locale: 'en-GB', files: {
      'word-cat': { locale: 'en-GB', status: 'ready', provider: 'gtts', lang: 'en', tld: 'co.uk', text: 'cat', path: '/audio/phonics/word-cat.mp3' },
      'word-map': { locale: 'en-US', status: 'ready', provider: 'gtts', lang: 'en', tld: 'com', text: 'map', path: '/audio/phonics/word-map.mp3' },
    },
  } }));
  const samples = 800;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(8000, 24); buffer.writeUInt32LE(16000, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  await page.route('**/audio/phonics/word-cat.mp3', route => route.fulfill({ contentType: 'audio/wav', body: buffer }));
  await openEnglish(page);
  await expect(page.locator('[data-action="ph-play"]')).toHaveCount(0);
  await section(page, 'lesson-4');
  await mode(page, 'listen');
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(0);
  await page.locator('[data-action="ph-play"]').click();
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(4);
});

test('音频清单延迟时短 a 听词题自动出现，刷新后保留首答和题目顺序', async ({ page }) => {
  const manifest = JSON.parse(await readFile('public/audio/phonics/manifest.json', 'utf8'));
  let releaseManifest;
  await page.route('**/audio/phonics/manifest.json', async route => {
    await new Promise(resolve => { releaseManifest = resolve; });
    await route.fulfill({ json: manifest });
  });
  await page.addInitScript(() => {
    window.Audio = class {
      play() {
        queueMicrotask(() => { this.onplaying(); this.onended(); });
        return Promise.resolve();
      }
      pause() {}
      removeAttribute() {}
      load() {}
    };
  });
  await openEnglish(page);
  await mode(page, 'listen');
  await section(page, 'lesson-4');
  await expect.poll(() => Boolean(releaseManifest)).toBe(true);
  releaseManifest();
  await expect(page.locator('[data-action="ph-play"]')).toBeVisible();
  await expect(page.locator('.ph-empty')).toHaveCount(0);
  await page.locator('[data-action="ph-play"]').click();
  await page.locator('[data-action="ph-answer"]').first().click();
  const saved = currentRound(await englishState(page));
  expect(Object.keys(saved.responses)).toHaveLength(1);
  releaseManifest = null;
  await page.reload();
  await expect.poll(() => Boolean(releaseManifest)).toBe(true);
  await expect(page.locator('.ph-empty')).toHaveCount(0);
  releaseManifest();
  await expect(page.locator('[data-action="ph-play"]')).toBeVisible();
  const restored = currentRound(await englishState(page));
  expect(restored.ids).toEqual(saved.ids);
  expect(restored.responses).toEqual(saved.responses);
  expect(restored.options).toEqual(saved.options);
  await expect(page.locator('.ph-feedback')).not.toBeEmpty();
});

test('播放按钮使用呼吸动画，加载、播放、结束和失败不移动内容', async ({ page }) => {
  await page.route('**/audio/phonics/manifest.json', route => route.fulfill({ json: {
    locale: 'en-GB', files: {
      'word-map': { locale: 'en-GB', status: 'ready', provider: 'gtts', lang: 'en', tld: 'co.uk', text: 'map', path: '/audio/phonics/word-map.mp3' },
    },
  } }));
  await page.addInitScript(() => {
    window.Audio = class {
      constructor() { window.phonicsTestAudio = this; }
      play() { return Promise.resolve(); }
      pause() {}
      removeAttribute() {}
      load() {}
    };
  });
  await openEnglish(page);
  const button = page.locator('[data-action="ph-play"]');
  await expect(button).toBeVisible();
  await button.scrollIntoViewIfNeeded();
  const card = page.locator('.ph-word-card');
  const originalBounds = await card.boundingBox();
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  expect(await card.boundingBox()).toEqual(originalBounds);
  await page.evaluate(() => window.phonicsTestAudio.onplaying());
  await expect(button).toHaveClass(/playing/);
  await expect(button).toHaveCSS('animation-name', 'pulse');
  await expect(button).toHaveText('听一听');
  expect(await card.boundingBox()).toEqual(originalBounds);
  await page.evaluate(() => window.phonicsTestAudio.onended());
  await expect(button).not.toHaveClass(/playing/);
  expect(await card.boundingBox()).toEqual(originalBounds);
  await button.click();
  await page.evaluate(() => {
    window.phonicsTestAudio.onplaying();
    window.phonicsTestAudio.onerror();
  });
  await expect(button).not.toHaveClass(/playing/);
  await expect(button).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#toast')).toContainText('语音播放失败');
  expect(await card.boundingBox()).toEqual(originalBounds);
});

test('顶部玩法与小节地图分层，切换小节保留玩法、范围和刷新位置同步', async ({ page }) => {
  await openEnglish(page);
  for (const id of ['random', 'meaning', 'spelling', 'rules', 'listen']) {
    await mode(page, id);
    await page.locator('.ph-map [data-action="ph-scope"]').click();
    await expect(page.locator('.ph-current-section')).toHaveText('全部课程');
    await expect(page.locator('.ph-map [data-action="ph-lesson"][aria-current]')).toHaveCount(0);
    await section(page, 'lesson-4');
    await expect(page.locator('.ph-modes [data-id="' + id + '"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.ph-current-section')).toContainText('第 4 课');
    expect((await englishState(page)).scope).toBe('lesson');
  }
  await mode(page, 'reading');
  await section(page, 'lesson-29');
  const title = await page.locator('.ph-reading h2').textContent();
  await page.reload();
  await expect(page.locator('.ph-reading h2')).toHaveText(title);
  await expect(page.locator('.ph-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-29');
  for (const id of ['favorites', 'records']) {
    await mode(page, id);
    await expect(page.locator('.ph-map')).toHaveCount(0);
    await expect(page.locator('.ph-current-section')).toHaveCount(0);
  }
});

for (const width of [1440, 820, 390]) {
  test(`自然拼读在 ${width}px 无横向溢出，按钮和输入可操作`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    if (width <= 760) await page.locator('[data-action="mobile-menu"]').click();
    await page.locator('.subjects [data-id="english"]').click();
    await expect(page.locator('.ph-word')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/phonics-${width}.png`, fullPage: true });
    await mode(page, 'reading');
    await section(page, 'lesson-14');
    await expect(page.locator('.ph-reading')).toBeVisible();
    await expect(page.locator('.ph-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-14');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/phonics-reading-${width}.png`, fullPage: true });
    await mode(page, 'spelling');
    await expect(page.locator('#ph-spelling-input')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
