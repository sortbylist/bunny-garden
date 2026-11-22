import { test, expect } from '@playwright/test';
import { chooseMode, choosePinyinCategory, stored } from './helpers.js';

test('鼠标停在学习小地图标题时，页面仍能上下滚动', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 800 }, { width: 820, height: 1180 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const stop = page.locator('.learning-map .section-title');
    await stop.evaluate(element => {
      window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - window.innerHeight + 130);
    });
    await stop.hover();
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
    const after = await page.evaluate(() => window.scrollY);
    await stop.hover();
    await page.mouse.wheel(0, -300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(after);
  }
});

for (const mode of ['sequence', 'random']) {
test(`${mode} 自评后前进，末项提供本节练习`, async ({ page }) => {
    await page.goto('/');
    if (mode === 'random') await chooseMode(page, mode);
    await page.locator('.learning-map [data-action="map-group"][data-id="single"]').click();
    const sessionKey = `${mode}:single:all:retroflex:10`;
    let state = await stored(page);
    const ids = state.sessions[sessionKey].ids;
    expect(state.mode).toBe(mode);
    await page.locator('[data-action="known"]').click();
    state = await stored(page);
    expect(state.known).toContain(ids[0]);
    expect(state.sessions[sessionKey].index).toBe(1);
    await page.locator('[data-action="practice-later"]').click();
    state = await stored(page);
    expect(state.favorites).toContain(ids[1]);
    expect(state.sessions[sessionKey].index).toBe(2);
    await page.locator('.pinyin-map [data-action="jump"][data-index="5"]').click();
    await page.locator('[data-action="known"]').click();
    await page.reload();
    state = await stored(page);
    expect(state.known).toContain(ids[5]);
    expect(state.sessions[sessionKey].index).toBe(5);
    await page.locator('.card-navigation [data-action="pinyin-section-practice"]').click();
    state = await stored(page);
    expect(state.mode).toBe('section-practice');
    expect(state.group).toBe('single');
    const round = state.sessions['section-practice:single:all:retroflex:10'];
    expect(round.questions.every(question => question.itemId.startsWith('single-'))).toBe(true);
  });
}

test('最后一项标记还要练时保留学习位置和练习入口', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="map-group"][data-id="whole"]').click();
  await page.locator('.pinyin-map [data-action="jump"][data-index="15"]').click();
  await page.locator('[data-action="practice-later"]').click();
  await expect(page.locator('.card-navigation [data-action="pinyin-section-practice"]')).toBeVisible();
  expect((await stored(page)).favorites).toContain('whole-ying');
  await expect(page.locator('.pinyin-display')).toHaveText('ying');
  await expect(page.locator('[data-action="map-group"][aria-current]')).toHaveAttribute('data-id', 'whole');
});

test('地图保留分组列表，点击分组保持玩法且不再重复显示下拉框', async ({ page }) => {
  await page.goto('/');
  await chooseMode(page, 'sequence');
  await expect(page.locator('.learning-map [data-action="map-group"]')).toHaveCount(7);
  await page.locator('.learning-map [data-id="initial"]').click();
  await expect(page.locator('[data-setting="group"]')).toHaveCount(0);
  await expect(page.locator('.learning-map [data-id="initial"]')).toHaveAttribute('aria-current', 'true');
  expect((await stored(page)).mode).toBe('sequence');
  await page.locator('.learning-map [data-id="single"]').click();
  await expect(page.locator('.learning-map [data-action="map-group"]')).toHaveCount(7);
  await page.locator('.pinyin-map [data-index="5"]').click();
  await choosePinyinCategory(page, 'initial');
  expect((await stored(page)).mode).toBe('sequence');
  await chooseMode(page, 'hanzi');
  await expect(page.locator('.learning-map [data-action="map-group"]')).toHaveCount(0);
  await page.locator('.learning-map [data-action="map-word-scope"][data-id="words"]').click();
  await expect(page.locator('[data-setting="wordScope"]')).toHaveCount(0);
  await expect(page.locator('.learning-map .stop-info b')).toHaveText(['字词一起练', '常见单字', '双字词语']);
  await expect(page.locator('.learning-map [data-id="words"]')).toHaveAttribute('aria-current', 'true');
  const state = await stored(page);
  expect(state.mode).toBe('hanzi');
  const round = state.sessions['hanzi:all:words:retroflex:10'];
  expect(round.index).toBe(0);
  expect(round.questions.every(question => question.itemId.startsWith('word-'))).toBe(true);
  await page.locator('[data-action="map-word-scope"][data-id="characters"]').click();
  await expect(page.locator('.learning-map .stop-info b')).toHaveText(['字词一起练', '常见单字', '双字词语']);
  await expect(page.locator('.learning-map [data-id="characters"]')).toHaveAttribute('aria-current', 'true');
  await page.locator('.learning-map [data-id="all"]').click();
  await expect(page.locator('[data-action="map-word-scope"][aria-current]')).toHaveAttribute('data-id', 'all');
});

test('各玩法只在地图切换分组，选择后列表保持不变', async ({ page }) => {
  await page.goto('/');
  for (const mode of ['sequence', 'random', 'listen', 'audio', 'hanzi', 'pinyin', 'match', 'challenge', 'tones', 'blend', 'confusing', 'rules']) {
    await chooseMode(page, mode);
    await expect(page.locator('select[data-setting="group"], select[data-setting="wordScope"], select[data-setting="confusion"]')).toHaveCount(0);
    const options = await page.locator('.map-stop').evaluateAll(elements => elements.map(element => ({ name: element.querySelector('b').textContent, id: element.dataset.id, action: element.dataset.action })));
    if (!options.length) {
      await expect(page.locator('.learning-map')).toHaveCount(0);
      continue;
    }
    const names = options.map(option => option.name);
    await expect(page.locator('.learning-map .stop-info b')).toHaveText(names);
    for (const option of options) {
      await page.locator(`.learning-map [data-action="${option.action}"][data-id="${option.id}"]`).click();
      await expect(page.locator('.learning-map .stop-info b')).toHaveText(names);
      await expect(page.locator(`.learning-map [data-action="${option.action}"][data-id="${option.id}"]`)).toHaveAttribute('aria-current', 'true');
    }
    expect((await stored(page)).mode).toBe(mode);
  }
});
