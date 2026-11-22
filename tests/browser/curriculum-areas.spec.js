import { test, expect } from '@playwright/test';
import { choosePinyinCategory, selectPhonicsLesson, selectTopic, setLearningPreference, setRoundLength, stored } from './helpers.js';

test('分类栏自动换行，目录可搜索并直接进入综合练习', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await selectTopic(page, '词语积累与分类');
  const navigation = page.locator('.curriculum-navigation');
  const rail = navigation.getByRole('group', { name: '课程分类' });
  await expect(rail.getByRole('button')).toHaveCount(13);
  await expect(navigation.locator('.nav-scroll')).toHaveCount(0);
  const rows = await rail.getByRole('button').evaluateAll(buttons => new Set(buttons.map(button => button.offsetTop)).size);
  expect(rows).toBeGreaterThan(1);
  await navigation.locator('.nav-catalog-picker summary').click();
  await navigation.getByRole('searchbox', { name: '搜索分类' }).fill('综合');
  const directory = navigation.getByRole('region', { name: '分类目录' });
  await expect(directory.getByRole('button')).toHaveText('综合练习');
  await directory.getByRole('button', { name: '综合练习' }).click();
  const round = (await stored(page)).topics['word-categories'].round;
  expect(round.scope).toBe('all');
  expect(new Set(round.questions.map(question => question.category)).size).toBeGreaterThan(1);
  await expect(page.locator('.learning-book').getByRole('tab')).toHaveText('练习');
  await expect(page.getByRole('tab', { name: '练习', selected: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('本节标签支持键盘切换，题量切换与刷新保留分类轮次', async ({ page }, testInfo) => {
  await page.goto('/');
  await selectTopic(page, '查字典');
  const book = page.locator('.learning-book');
  const category = await book.getAttribute('data-category');
  await expect(book.getByRole('tab', { name: '学习', selected: true })).toBeVisible();
  const card = await book.locator('.study-card').boundingBox();
  const label = await book.getByRole('tab', { name: '学习' }).boundingBox();
  expect(label.x).toBe(card.x);
  expect(Math.abs(label.y + label.height - card.y)).toBeLessThanOrEqual(2);
  const outlines = await book.locator('.book-tab-outline').evaluateAll(elements => elements.map(element => {
    const { x, y, width } = element.getBoundingClientRect();
    return { x, y, width };
  }));
  expect(outlines[1].x - outlines[0].x - outlines[0].width).toBe(0);
  expect(outlines[1].y - outlines[0].y).toBe(8);
  await book.screenshot({ path: testInfo.outputPath('book-tabs.png') });
  await book.getByRole('tab', { name: '学习' }).press('ArrowRight');
  const practice = book.getByRole('tab', { name: '练习', selected: true });
  await expect(practice).toBeFocused();
  const before = (await stored(page)).topics.dictionary.round;
  await page.locator('[data-action="ct-skip"]').click();
  await page.locator('[data-action="ct-advance"]').click();
  await setRoundLength(page, 20);
  await expect(page.locator('.ct-quiz .learning-position')).toHaveText('第 1 / 20 题');
  await page.reload();
  await expect(practice).toBeVisible();
  await page.locator('.round-settings summary').click();
  await page.getByRole('button', { name: '继续上次练习 · 10 题' }).click();
  const resumed = (await stored(page)).topics.dictionary.round;
  expect(resumed.scope).toBe(category);
  expect(resumed.questions).toEqual(before.questions);
  expect(resumed.index).toBe(1);
  expect(resumed.responses[0].skipped).toBe(true);
  await page.getByRole('button', { name: '回到学习', exact: true }).click();
  await page.getByRole('button', { name: '查字小实验', exact: true }).click();
  await expect(book.getByRole('tab')).toHaveText('学习');
  await expect(book.getByRole('tab', { name: '学习', selected: true })).toBeVisible();
});

test('拼音下拉选学习分类，独立练习显示单标签', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const navigation = page.locator('[data-navigation="pinyin-modes"]');
  const picker = navigation.locator('.course-picker');
  await expect(picker.locator('summary')).toHaveText('全部拼音');
  await choosePinyinCategory(page, 'initial');
  const book = page.locator('.learning-book');
  await expect(book.getByRole('tab', { name: '学习', selected: true })).toBeVisible();
  const word = await page.locator('.pinyin-display').textContent();
  await book.getByRole('tab', { name: '练习' }).click();
  await expect(picker.locator('summary')).toHaveText('声母');
  await expect(page.locator('html')).not.toHaveClass(/switching-book/);
  await book.getByRole('tab', { name: '学习' }).click();
  await expect(page.locator('.pinyin-display')).toHaveText(word);
  await navigation.locator('.nav-catalog-picker summary').click();
  await navigation.getByRole('searchbox').fill('标调');
  await navigation.getByRole('region', { name: '练习目录' }).getByRole('button').click();
  await expect(book.getByRole('tab')).toHaveText('练习');
  await choosePinyinCategory(page, 'tones');
  await expect(page.locator('.tones-card')).toBeVisible();
  await expect(book.getByRole('tab')).toHaveCount(2);
});

test('书签、接缝和多张卡共用转场并接受连续点击', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  const book = page.locator('.learning-book');
  const panel = book.getByRole('tabpanel');
  const learn = book.getByRole('tab', { name: '学习', exact: true });
  const practice = book.getByRole('tab', { name: '练习', exact: true });
  const screenshotTabs = async name => {
    const tabs = book.locator('[role="tablist"]');
    await tabs.scrollIntoViewIfNeeded();
    const bounds = await tabs.boundingBox();
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), clip: { x: bounds.x, y: bounds.y, width: 250, height: bounds.height + 26 } });
  };
  await expect(panel.locator('.ph-rule, .ph-word-card, .ph-alphabet')).toHaveCount(3);
  await screenshotTabs('selected-left');
  await practice.hover();
  await page.mouse.down();
  await expect(practice).toHaveCSS('transform', 'none');
  await page.mouse.up();
  await expect(practice).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => book.evaluate(element => {
    const track = element.querySelector('[role="tablist"]');
    const panel = element.querySelector('[role="tabpanel"]');
    return getComputedStyle(element).viewTransitionName === 'book-page' &&
      getComputedStyle(track).viewTransitionName === 'none' &&
      getComputedStyle(panel).viewTransitionName === 'none' &&
      document.getAnimations().some(animation =>
        animation.animationName === 'book-settle' && animation.effect.getComputedTiming().endTime === 650);
  })).toBe(true);
  await learn.click();
  await expect(learn).toBeFocused();
  await practice.click();
  await expect(practice).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/switching-book/);
  await expect(panel.locator('.ph-quiz')).toBeVisible();
  await screenshotTabs('selected-right');
  await page.locator('.nav-tabs [data-action="ph-practice"][data-id="meaning"]').click();
  await expect(book.getByRole('tab')).toHaveCount(1);
  await screenshotTabs('single-tab');
});

test('书立可复用到多个标签，窄屏可浏览且键盘选中项完整露出', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.evaluate(async () => {
    const { renderBookTabs, createBookTabs } = await import('/src/book-tabs.js');
    const fixture = document.querySelector('#main-content');
    const controls = createBookTabs(fixture);
    const tabs = ['学习', '练习', '复习', '阅读', '笔记'].map((label, index) => ({ id: String(index), label }));
    function show(selected) {
      const previous = controls.capture();
      fixture.innerHTML = renderBookTabs({
        id: 'fixture-book', category: 'fixture', action: 'fixture-page', label: '课程页面', tabs, selected,
        content: `<article class="study-card">${tabs.find(tab => tab.id === selected).label}内容</article>`,
      });
      controls.bind(previous);
    }
    fixture.addEventListener('click', event => {
      event.stopPropagation();
      const tab = event.target.closest('[role="tab"]');
      if (!tab || tab.getAttribute('aria-selected') === 'true') return;
      controls.turn(tab.closest('.learning-book'), { animate: false, focusTab: true, update: () => show(tab.dataset.id) });
    });
    fixture.addEventListener('keydown', event => {
      if (controls.keydown(event)) event.stopPropagation();
    });
    show('0');
  });
  const book = page.locator('#fixture-book');
  const track = book.getByRole('tablist');
  const tabs = book.getByRole('tab');
  const forward = book.getByRole('button', { name: '向后浏览标签' });
  await expect(tabs).toHaveCount(5);
  await expect(forward).toBeVisible();
  await forward.click();
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const reading = book.getByRole('tab', { name: '阅读', exact: true });
  await reading.click();
  await expect(reading).toBeFocused();
  await reading.press('End');
  const last = book.getByRole('tab', { name: '笔记', selected: true });
  await expect(last).toBeFocused();
  await expect(book.getByRole('tabpanel', { name: '笔记' })).toHaveText('笔记内容');
  const trackBounds = await track.boundingBox();
  const tabBounds = await last.boundingBox();
  expect(tabBounds.x).toBeGreaterThanOrEqual(trackBounds.x);
  expect(tabBounds.x + tabBounds.width).toBeLessThanOrEqual(trackBounds.x + trackBounds.width);
  await expect(forward).toBeDisabled();
  await book.screenshot({ path: testInfo.outputPath('five-book-tabs.png') });
  await last.press('ArrowRight');
  await expect(book.getByRole('tab', { name: '学习', selected: true })).toBeFocused();
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await expect(forward).toBeHidden();
});

test('快速反选以最后一次为准，关闭动画或缺少过渡支持时直接切页', async ({ page }) => {
  await page.goto('/');
  const book = page.locator('.learning-book');
  const learn = book.getByRole('tab', { name: '学习' });
  const practice = book.getByRole('tab', { name: '练习' });
  await book.evaluate(element => {
    element.querySelector('[data-id="practice"]').click();
    element.querySelector('[data-id="learn"]').click();
  });
  await expect(learn).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('html')).not.toHaveClass(/switching-book/);
  await setLearningPreference(page, 'animations', false);
  await practice.click();
  await expect(practice).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('html')).not.toHaveClass(/switching-book/);
  await setLearningPreference(page, 'animations', true);
  await page.evaluate(() => { document.startViewTransition = undefined; });
  await learn.click();
  await expect(learn).toBeFocused();
  await expect(book.locator('.pinyin-display')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/switching-book/);
});

test('自然拼读顶部和小地图同步选课，专项显示单个练习标签', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  const navigation = page.locator('.curriculum-navigation');
  const picker = navigation.locator('.course-picker');
  const summary = picker.locator('summary.nav-select');
  const map = page.getByRole('region', { name: '自然拼读学习小地图' });
  const book = page.locator('.learning-book');
  await expect(summary).toContainText('第 1 课');
  await expect(map).toBeVisible();
  await expect(map.locator('.ph-lesson')).toHaveCount(48);
  await selectPhonicsLesson(page, 'lesson-4');
  await expect(map.locator('[aria-current="step"]')).toHaveAttribute('data-id', 'lesson-4');
  await book.getByRole('tab', { name: '练习', exact: true }).click();
  await expect(book.locator('.ph-quiz')).toBeVisible();
  const round = (await stored(page)).phonics.sessions['mixed:lesson:lesson-4:10'];
  expect(round.ids).toHaveLength(10);
  expect(round.ids).toContain('rule-4');
  await page.reload();
  await expect(book.getByRole('tab', { name: '练习', selected: true })).toBeVisible();
  await navigation.getByRole('group', { name: '课程分类' }).getByRole('button', { name: '综合练习' }).click();
  expect((await stored(page)).phonics.scope).toBe('all');
  await expect(book.getByRole('tab')).toHaveText('练习');
  await map.locator('[data-id="lesson-4"]').click();
  await expect(book.getByRole('tab', { name: '学习', selected: true })).toBeVisible();
  await expect(summary).toContainText('第 4 课');
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(map.locator('.ph-course-list')).toBeHidden();
  await map.getByRole('button', { name: '学习小地图' }).click();
  await expect(map.locator('.ph-course-list')).toBeVisible();
  await selectPhonicsLesson(page, 'lesson-3');
  await expect(map.locator('.ph-course-list')).toBeHidden();
  await expect(summary).toContainText('第 3 课');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
