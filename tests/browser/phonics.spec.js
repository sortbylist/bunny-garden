import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { choosePhonicsMode as mode, openMyMenu, selectPhonicsLesson as section, stored } from './helpers.js';
import { appStorageKey } from '../../src/storage.js';

async function openEnglish(page) {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.phonics-page')).toBeVisible();
}

async function englishState(page) { return (await stored(page)).phonics; }
function currentRound(state) {
  const lesson = state.scope === 'all' && ['mixed', 'meaning', 'spelling', 'listen'].includes(state.mode) ? 'lesson-1' : state.lessonId;
  return state.sessions[`${state.mode}:${state.scope}:${lesson}:${state.length}`];
}

test('自然拼读入口、48 课地图、自评前进、收藏与刷新恢复不影响语文', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openEnglish(page);
  const navigation = page.locator('[data-navigation="features-english"]');
  const stages = navigation.locator('.nav-group-picker summary');
  await expect(stages).toHaveAccessibleName('选择英语阶段，当前：第一阶段 · 词汇与日常听说');
  await stages.click();
  await expect(navigation.locator('.nav-group-item')).toHaveCount(1);
  await expect(navigation.locator('.nav-group-item')).toContainText('第一阶段 · 4 个主题');
  await navigation.locator('.nav-group-item').click();
  await expect(navigation.getByRole('tab').first()).toHaveText('自然拼读');
  await expect(page.locator('.ph-learning-map [data-action="ph-lesson"]')).toHaveCount(48);
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
  await page.locator('[data-action="favorite"]').click();
  await page.locator('.subjects [data-id="english"]').click();
  await expect(page.locator('.ph-word')).toHaveText('mat');
  await page.locator('[data-action="ph-favorite"]').click();
  await page.reload();
  const root = await stored(page);
  expect(root.favorites).toContain('single-a');
  expect(root.phonics.favorites).toEqual(expect.arrayContaining(['word-map', 'word-mat']));
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([appStorageKey]);
  expect(errors).toEqual([]);
});

test('规律答错重试保留首次结果、查看答案与新轮复习', async ({ page }) => {
  await openEnglish(page);
  await mode(page, 'rules');
  await expect(page.locator('.ph-quiz')).toContainText('本节练习');
  await page.locator('.ph-option').filter({ hasText: 'zip' }).click();
  await expect(page.locator('.ph-feedback')).toContainText('还差一点');
  await page.locator('.ph-option').filter({ hasText: 'zed' }).click();
  await expect(page.locator('.ph-feedback')).toContainText('答对啦');
  await page.locator('[data-action="ph-next-question"]').click();
  expect(currentRound(await englishState(page)).responses['rule-1'].correct).toBe(false);
  await openMyMenu(page, '[data-id="mistakes"]');
  await page.locator('[data-action="library-review-group"][data-id="phonics"]').click();
  await page.locator('.ph-option').filter({ hasText: 'zed' }).click();
  await page.locator('[data-action="library-next"]').click();
  expect((await englishState(page)).mistakes).toEqual([]);
  await openMyMenu(page, '[data-id="records"]');
  await expect(page.locator('.history-list li')).toHaveCount(1);
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
  await page.locator('.ph-quiz .learning-favorite').click();
  const before = await englishState(page);
  await openMyMenu(page, '[data-id="favorites"]');
  await page.locator('[data-action="library-item"]').click();
  await expect(page.locator('#review-spelling-input')).toBeDisabled();
  await page.getByRole('button', { name: '再做一次' }).click();
  await page.locator('#review-spelling-input').fill(wordId);
  await page.locator('#review-spelling-input').press('Enter');
  await expect(page.getByRole('dialog').locator('.ph-feedback')).toContainText('答对啦');
  await page.getByRole('button', { name: '返回我的收藏' }).click();
  expect(await englishState(page)).toEqual(before);
});

test('全部玩法、共读答案、课次跳转和缺失语音状态可用', async ({ page }) => {
  await page.route('**/audio/phonics/manifest.json', route => route.fulfill({ json: { locale: 'en-GB', files: {} } }));
  await openEnglish(page);
  for (const id of ['random', 'meaning', 'spelling', 'rules', 'listen']) {
    await mode(page, id);
    await expect(page.locator('.ph-main')).toHaveAttribute('aria-label', /.+/);
    await expect(page.locator('.ph-section-title')).toHaveCount(0);
    await expect(page.locator('.ph-main [role="tabpanel"] > section')).not.toHaveCount(0);
  }
  await mode(page, 'listen');
  await expect(page.locator('.my-menu [data-id="mistakes"]')).toHaveText('错题本（0）');
  await expect(page.locator('.ph-empty')).toContainText('先来读一读吧');
  await expect(page.locator('[data-action="ph-answer"]')).toHaveCount(0);
  await mode(page, 'reading');
  await expect(page.locator('.ph-learning-map [data-action="ph-lesson"]')).toHaveCount(36);
  await expect(page.locator('.ph-learning-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-13');
  await page.locator('[data-action="ph-story-answer"][data-value="A cat"]').click();
  await expect(page.locator('.ph-feedback')).toContainText('理解正确');
  await section(page, 'lesson-14');
  await expect(page.locator('.ph-feedback')).toHaveText('读一读故事，再选择答案。');
  await expect(page.locator('.ph-feedback')).not.toHaveClass(/success|warning/);
  expect((await englishState(page)).mode).toBe('reading');
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
  await page.locator('.ph-quiz .learning-favorite').click();
  await openMyMenu(page, '[data-id="favorites"]');
  await page.locator('[data-action="library-item"]').click();
  await page.getByRole('button', { name: '再做一次' }).click();
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(0);
  await page.getByRole('button', { name: '播放题目' }).click();
  await expect(page.locator('[data-action="ph-answer"]:enabled')).toHaveCount(4);
});

test('音频清单延迟时全课程听词题自动出现，刷新后保留首答和题目顺序', async ({ page }) => {
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
  await section(page, 'lesson-4');
  await mode(page, 'listen');
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

test('固定专项使用全课程且独立于学习地图，故事位置可刷新恢复', async ({ page }) => {
  await openEnglish(page);
  for (const id of ['mixed', 'meaning', 'spelling', 'listen']) {
    await section(page, 'lesson-4');
    await mode(page, id);
    await expect(page.locator('.course-picker > summary')).toHaveText('课程目录');
    await expect(page.locator('.ph-learning-map')).toBeVisible();
    await expect(page.locator(`.nav-tabs [data-action="ph-practice"][data-id="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    expect((await englishState(page)).scope).toBe('all');
  }
  await mode(page, 'reading');
  await section(page, 'lesson-29');
  const title = await page.locator('.ph-reading h2').textContent();
  await page.reload();
  await expect(page.locator('.ph-reading h2')).toHaveText(title);
  await expect(page.locator('.ph-learning-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-29');
  for (const id of ['favorites', 'records']) {
    await openMyMenu(page, `[data-id="${id}"]`);
    await expect(page.locator('.review-library')).toBeVisible();
    await expect(page.locator('.ph-learning-map')).toHaveCount(0);
    await page.getByRole('button', { name: '返回课程' }).click();
    await expect(page.locator('.ph-reading h2')).toHaveText(title);
  }
});

test('英语各玩法不设顶部工具栏，可调题量的练习在卡片下方提供设置', async ({ page }) => {
  await openEnglish(page);
  for (const id of ['learn', 'random', 'meaning', 'spelling', 'rules', 'listen', 'reading']) {
    await mode(page, id);
    await expect(page.locator('.ph-main > .ph-controls, .ph-current-section')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '重新开始', exact: true })).toHaveCount(0);
    if (['meaning', 'spelling', 'rules', 'listen'].includes(id)) {
      const settings = page.locator('.learning-book + .round-settings');
      await expect(settings.locator('select')).toBeHidden();
      await settings.locator('summary').click();
      await expect(settings.getByLabel('每轮题数')).toBeVisible();
    } else await expect(page.locator('.round-settings')).toHaveCount(0);
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
    await expect(page.locator('.ph-learning-map [aria-current="step"]')).toHaveAttribute('data-id', 'lesson-14');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/phonics-reading-${width}.png`, fullPage: true });
    await mode(page, 'spelling');
    await expect(page.locator('#ph-spelling-input')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
