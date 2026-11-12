import { test, expect } from '@playwright/test';
import { stored, selectTopic } from './helpers.js';

async function poemText(page) {
  return page.locator('.ct-poem-lines').evaluate(element => {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('rt, rp').forEach(node => node.remove());
    return copy.textContent;
  });
}

test('形近字和多音字对照可读，关闭拼音仍保留辨析所需的读音说明', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '形近字辨析');
  await expect(page.locator('.ct-literacy-topic')).toHaveClass(/ct-sentence-topic/);
  await expect(page.locator('.ct-lesson')).toHaveClass(/ct-sentence-card/);
  await expect(page.locator('.learning-aside')).toBeVisible();
  await expect(page.locator('.ct-comparison')).toContainText('眼睛');
  await expect(page.locator('.ct-comparison article')).toHaveCount(3);
  await page.locator('[data-action="ct-category"][data-id="details"]').click();
  await expect(page.locator('.ct-comparison')).toContainText('上横长、下横短');
  await selectTopic(page, '同音字与多音字');
  await page.locator('[data-action="ct-category"][data-id="polyphones"]').click();
  await page.locator('[data-action="ct-lesson"][data-id$=":de"]').click();
  for (const reading of ['dé', 'děi', 'de']) await expect(page.locator('.ct-comparison')).toContainText(reading);
  await page.locator('[data-action="ct-reading"]').click();
  await expect(page.locator('.ct-comparison ruby')).toHaveCount(0);
  await expect(page.locator('.ct-comparison')).toContainText('在“得到”中读 dé');
  await page.locator('[data-action="ct-start"][data-id="polyphones"]').click();
  await expect(page.locator('.ct-comparison')).toHaveCount(0);
  const round = (await stored(page)).topics['character-readings'].round;
  await page.locator('.ct-quiz').getByRole('button', { name: round.questions[0].answer, exact: true }).click();
  expect((await stored(page)).topics['character-readings'].round.responses[0].correct).toBe(true);
});

test('古诗原文、拼音、遮文背诵与草稿独立保存，手机七言诗不溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await expect(page.locator('.ct-lesson')).toHaveClass(/ct-sentence-card/);
  await expect(page.locator('.ct-poem-author')).toHaveText('唐 · 骆宾王');
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(18);
  await page.locator('#ct-draft').fill('我看到白鹅的红脚掌划开水面。');
  await page.locator('[data-action="ct-activity-recite"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ct-poem-lines')).toContainText('原文已遮住');
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-action="ct-activity-recite"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#ct-draft')).toHaveValue('我看到白鹅的红脚掌划开水面。');
  await page.locator('[data-action="ct-next"]').click();
  expect(await poemText(page)).toContain('春眠不觉晓');
  await expect(page.locator('#ct-draft')).toHaveValue('');
  await page.locator('[data-action="ct-lesson"][data-id$=":little-pond"]').click();
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(28);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const rows = await page.locator('.ct-poem-lines > p').evaluateAll(elements => elements.map(element =>
    new Set([...element.querySelectorAll('ruby')].map(ruby => Math.round(ruby.getBoundingClientRect().top))).size));
  await page.screenshot({ path: 'artifacts/literacy-poetry-mobile.png', fullPage: true });
  expect(rows).toEqual([1, 1, 1, 1]);
  await page.locator('[data-action="ct-reading"]').click();
  await expect(page.locator('.ct-poem-lines ruby')).toHaveCount(0);
  await expect(page.locator('.ct-poem-lines')).toContainText('早有蜻蜓立上头');
  await page.locator('[data-action="ct-lesson"][data-id$=":goose"]').click();
  await expect(page.locator('.ct-poem-lines')).toContainText('原文已遮住');
  await page.locator('[data-action="ct-activity-recite"]').click();
  expect(await poemText(page)).toContain('曲项向天歌');
  const root = await stored(page);
  expect(root.topics['poetry-culture'].known).toEqual([]);
  expect(root.history).toEqual([]);
  expect(root.rewards.events).toEqual([]);
});

test('文化各小节自由进入，古诗草稿和背诵状态随全局清空重置', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await page.locator('#ct-draft').fill('白鹅在水中游。');
  await page.locator('[data-action="ct-activity-recite"]').click();
  for (const [category, text] of [['festivals', '农历正月十五'], ['stories', '守株待兔'], ['sayings', '熟能生巧']]) {
    await page.locator(`[data-action="ct-category"][data-id="${category}"]`).click();
    await expect(page.locator('.ct-lesson')).toContainText(text);
    await expect(page.locator('.ct-poem')).toHaveCount(0);
  }
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  expect((await stored(page)).topics['poetry-culture'].activities).toEqual({});
  await selectTopic(page, '古诗与传统文化');
  expect(await poemText(page)).toContain('曲项向天歌');
  await expect(page.locator('#ct-draft')).toHaveValue('');
});
