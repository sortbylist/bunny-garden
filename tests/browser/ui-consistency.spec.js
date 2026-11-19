import { test, expect } from '@playwright/test';
import { selectTopic, stored } from './helpers.js';

const frame = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return Object.fromEntries(['backgroundColor', 'border', 'borderRadius', 'boxShadow'].map(property => [property, style[property]]));
});

async function chooseSubject(page, subject) {
  if (await page.locator('.mobile-toggle').isVisible()) await page.locator('.mobile-toggle').click();
  await page.locator(`.subjects [data-id="${subject}"]`).click();
}

for (const width of [1440, 1050, 1000, 820, 390, 320]) {
  test(`${width}px 三学科学习卡、布局和目录使用统一规范`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const reference = await frame(page.locator('.study-card'));
    const columns = async selector => page.locator(selector).evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    const expectedColumns = width > 1000 ? 2 : 1;
    for (const [subject, topic, selector] of [
      ['chinese', '汉字笔画与结构', '.hanzi-page'],
      ['chinese', '查字典', '.chinese-topic'],
      ['chinese', '句式积累与仿写', '.chinese-topic'],
      ['math', '数的认识', '.chinese-topic'],
    ]) {
      if (subject === 'math') await chooseSubject(page, subject);
      await selectTopic(page, topic, subject);
      expect(await frame(page.locator(`${selector} .study-card`)), topic).toEqual(reference);
      expect(await columns(`${selector} .learning-layout`), topic).toBe(expectedColumns);
      await expect(page.locator(`${selector} .study-card .category-badge`)).toBeVisible();
      await expect(page.locator(`${selector} .learning-lesson-map`)).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), topic).toBe(true);
    }
    await chooseSubject(page, 'english');
    expect(await frame(page.locator('.ph-word-card'))).toEqual(reference);
    expect(await columns('.ph-layout')).toBe(expectedColumns);
    await expect(page.locator('.ph-word-navigation .solid-button')).toHaveCount(0);
    await expect(page.locator('[data-action="ph-known"] .icon')).toHaveCount(1);
    await expect(page.locator('.ph-modes .play-mode.selected')).toHaveCount(1);
    if (width <= 1000) {
      await expect(page.locator('.ph-map-toggle')).toBeVisible();
      await expect(page.locator('.ph-map')).toBeHidden();
      await page.locator('.ph-map-toggle').click();
      await expect(page.locator('.ph-map-toggle')).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.ph-map')).toBeVisible();
      await page.locator('.ph-map-toggle').click();
      await expect(page.locator('.ph-map')).toBeHidden();
    } else {
      await expect(page.locator('.ph-map')).toBeVisible();
      await expect(page.locator('.ph-map-toggle')).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('english-learning.png') });
  });
}

test('学习辅助、选择题和反馈状态跨模块统一，首次成绩及恢复规则不变', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.goto('/');
  let referenceOption;
  let referenceFeedback;
  let referenceTools;
  for (const [topic, prefix] of [['句式积累与仿写', 'ct'], ['查字典', 'ct'], ['汉字笔画与结构', 'hz']]) {
    await selectTopic(page, topic);
    await page.locator(`.mastery-actions [data-action="${prefix}-start"]`).click();
    const option = page.locator(`[data-action="${prefix}-answer"]`).first();
    const feedback = page.locator('.answer-feedback');
    const tools = page.locator('.ct-lengths button').first();
    await expect(option.locator('.option-letter')).toHaveText('A');
    if (!referenceOption) {
      referenceOption = await frame(option);
      referenceFeedback = await frame(feedback);
      referenceTools = await frame(tools);
    }
    expect(await frame(option), topic).toEqual(referenceOption);
    expect(await frame(feedback), topic).toEqual(referenceFeedback);
    expect(await frame(tools), topic).toEqual(referenceTools);
    await expect(tools).toHaveCSS('min-height', '44px');
    const root = await stored(page);
    const state = prefix === 'hz' ? root.hanzi : root.topics[await page.locator('[data-topic]').getAttribute('data-topic')];
    const question = state.round.questions[state.round.index];
    await page.locator(`[data-action="${prefix}-answer"]`).filter({ hasText: question.options.find(option => option !== question.answer) }).first().click();
    await expect(feedback).toHaveClass(/warning/);
    await page.getByRole('button', { name: question.answer, exact: true }).click();
    await expect(feedback).toHaveClass(/success/);
    await page.reload();
    await expect(feedback).toHaveClass(/success/);
    await page.screenshot({ path: testInfo.outputPath(`${prefix}-${topic}-feedback.png`) });
  }
  await chooseSubject(page, 'english');
  await page.locator('[data-action="ph-mode"][data-id="rules"]').click();
  const option = page.locator('.ph-quiz .ph-option').first();
  await expect(option.locator('.option-letter')).toHaveText('A');
  await expect(option.locator('.option-content')).toHaveCSS('font-size', '18px');
  expect(await frame(option)).toEqual(referenceOption);
  expect(await frame(page.locator('.ph-quiz .answer-feedback'))).toEqual(referenceFeedback);
  await expect(page.locator('.ph-quiz .answer-feedback')).toContainText('想一想');
  await page.locator('.ph-option').filter({ hasText: 'zip' }).click();
  await expect(page.locator('.ph-feedback')).toHaveClass(/warning/);
  await page.locator('.ph-option').filter({ hasText: 'zed' }).click();
  await expect(page.locator('.ph-feedback')).toHaveClass(/success/);
});

test('切换学科和主题回到内容顶部，同一学习卡操作不强制回页首', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '查字典');
  await page.evaluate(() => scrollTo(0, 600));
  await page.locator('.subjects [data-id="english"]').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 600));
  await page.locator('.subjects [data-id="chinese"]').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 600));
  await selectTopic(page, '词语积累与分类');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 300));
  await page.locator('[data-action="ct-known"]').scrollIntoViewIfNeeded();
  const previousScroll = await page.evaluate(() => scrollY);
  expect(previousScroll).toBeGreaterThan(0);
  await page.locator('[data-action="ct-known"]').click();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  expect(Math.abs(await page.evaluate(() => scrollY) - previousScroll)).toBeLessThan(80);
});
