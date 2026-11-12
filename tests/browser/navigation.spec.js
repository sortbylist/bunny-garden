import { test, expect } from '@playwright/test';
import { selectTopic, chooseMode } from './helpers.js';

test('主题按阶段分类，目录搜索、空结果、Escape和分类内选择恢复', async ({ page }) => {
  await page.goto('/');
  const navigation = page.locator('.feature-navigation');
  await navigation.locator('.nav-group-picker summary').click();
  await expect(navigation.locator('.nav-group-item')).toHaveCount(4);
  await expect(navigation.locator('.nav-groups')).toContainText('第三阶段');
  await navigation.locator('[data-action="nav-group"]').filter({ hasText: '字词基础' }).click();
  await expect(navigation.getByRole('tab')).toHaveCount(6);
  const height = (await navigation.boundingBox()).height;
  await navigation.locator('.nav-catalog-picker summary').click();
  const search = navigation.getByRole('searchbox');
  await search.fill('反义词');
  await expect(navigation.locator('.nav-catalog-item:visible')).toHaveCount(1);
  await search.fill('不存在的主题');
  await expect(navigation.locator('.nav-no-results')).toBeVisible();
  await search.press('Escape');
  await expect(navigation.locator('.nav-catalog-picker')).not.toHaveAttribute('open', '');
  await expect(navigation.locator('.nav-catalog-picker summary')).toBeFocused();
  await selectTopic(page, '近义词与反义词');
  await selectTopic(page, '标点符号');
  await navigation.locator('.nav-group-picker summary').click();
  await navigation.locator('[data-action="nav-group"]').filter({ hasText: '字词基础' }).click();
  await expect(navigation.getByRole('tab', { name: '近义词与反义词', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect((await navigation.boundingBox()).height).toBe(height);
  await page.reload();
  await expect(navigation.locator('.nav-group-picker summary')).toHaveText('字词基础');
  await expect(navigation.getByRole('tab', { name: '近义词与反义词', exact: true })).toHaveAttribute('aria-selected', 'true');
});

for (const width of [320, 390, 820, 1440]) {
  test(`${width}px 分类和目录不撑高头部，长标题可完整选择`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/');
    const navigation = page.locator('.feature-navigation');
    const original = (await navigation.boundingBox()).height;
    await selectTopic(page, '比喻、拟人与生动表达');
    const before = await page.locator('#main-content').boundingBox();
    await navigation.locator('.nav-catalog-picker summary').click();
    await expect(navigation.locator('.nav-catalog')).toBeVisible();
    expect((await navigation.boundingBox()).height).toBe(original);
    expect((await page.locator('#main-content').boundingBox()).y).toBe(before.y);
    await navigation.locator('.nav-catalog-item').filter({ hasText: '连词成句与补全句子' }).click();
    if (width <= 760) {
      await expect(navigation.locator('.nav-rail')).toBeHidden();
      await expect(navigation.locator('.nav-mobile-label')).toHaveText('连词成句与补全句子');
    } else {
      await expect(navigation.locator('.nav-rail')).toBeVisible();
      await expect(navigation.getByRole('tab', { name: '连词成句与补全句子', exact: true })).toHaveAttribute('aria-selected', 'true');
    }
    await selectTopic(page, '拼音学习');
    await chooseMode(page, 'audio');
    await expect(page.locator('.mode-navigation .nav-group-picker summary')).toHaveText('趣味练习');
    await chooseMode(page, 'sequence');
    await page.locator('.mode-navigation .nav-group-picker summary').click();
    await page.locator('.mode-navigation .nav-group-item').filter({ hasText: '趣味练习' }).click();
    if (width <= 760) await expect(page.locator('.mode-navigation .nav-mobile-label')).toHaveText('看拼音选读音');
    else await expect(page.locator('.mode-navigation .play-mode.selected')).toHaveText('看拼音选读音');
    expect((await navigation.boundingBox()).height).toBe(original);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('四十个额外主题仍是一行，滚动、目录搜索与键盘选择保持顺序', async ({ page }) => {
  await page.route('**/src/data.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nsubjects[0].features.push(...Array.from({ length: 40 }, (_, index) => ({ id: 'navigation-' + index, name: '扩展主题 ' + (index + 1), category: '第一阶段 · 字词基础', icon: 'book' })));` });
  });
  await page.goto('/');
  await selectTopic(page, '汉字笔画与结构');
  const navigation = page.locator('.feature-navigation');
  const tabs = navigation.locator('.nav-tabs');
  const height = (await navigation.boundingBox()).height;
  const order = await tabs.locator('button').evaluateAll(elements => elements.map(element => element.dataset.id));
  await navigation.getByRole('button', { name: '向右查看语文主题', exact: true }).click();
  await expect.poll(() => tabs.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await tabs.evaluate(element => element.scrollTo({ left: 300, behavior: 'instant' }));
  const position = await tabs.evaluate(element => element.scrollLeft);
  await page.locator('[data-action="hz-next"]').click();
  expect(await tabs.evaluate(element => element.scrollLeft)).toBe(position);
  await navigation.locator('.nav-catalog-picker summary').click();
  await navigation.getByRole('searchbox').fill('扩展主题 40');
  await navigation.locator('.nav-catalog-item:visible').click();
  await expect(tabs.locator('[data-id="navigation-39"]')).toHaveAttribute('aria-selected', 'true');
  const selected = await tabs.locator('[aria-selected="true"]').boundingBox();
  const viewport = await tabs.boundingBox();
  expect(selected.x).toBeGreaterThanOrEqual(viewport.x - 1);
  expect(selected.x + selected.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1);
  await tabs.locator('[aria-selected="true"]').focus();
  await page.keyboard.press('Home');
  await expect(tabs.locator('button').first()).toHaveAttribute('aria-selected', 'true');
  expect(await tabs.locator('button').evaluateAll(elements => elements.map(element => element.dataset.id))).toEqual(order);
  expect((await navigation.boundingBox()).height).toBe(height);
  await page.locator('[data-action="hz-next"]').click();
  await expect(navigation.locator('.nav-group-picker summary')).toHaveText('字词基础');
  expect(await tabs.evaluate(element => element.scrollLeft)).toBe(0);
});

test('手机切回桌面时选中项自动可见，导航方向键不翻学习卡片', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mode-navigation .nav-group-picker summary').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.pinyin-display')).toHaveText('a');
  await selectTopic(page, '叠词与四字词语');
  const navigation = page.locator('.feature-navigation');
  await page.setViewportSize({ width: 820, height: 1100 });
  await expect.poll(() => navigation.locator('.nav-tabs').evaluate(element => {
    const selected = element.querySelector('[aria-selected="true"]').getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    return selected.left >= bounds.left - 1 && selected.right <= bounds.right + 1;
  })).toBe(true);
  await page.screenshot({ path: 'artifacts/navigation-tablet.png', animations: 'disabled' });
});

test('新增阶段按数据自动归类，手机只有一个主题时仍显示主题入口', async ({ page }) => {
  await page.route('**/src/data.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nsubjects[0].features.push({ id: 'navigation-reading', name: '新增阅读主题', category: '第三阶段 · 阅读专项', icon: 'book' });` });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const navigation = page.locator('.feature-navigation');
  await navigation.locator('.nav-group-picker summary').click();
  await expect(navigation.locator('.nav-group-item')).toHaveCount(5);
  await navigation.locator('[data-action="nav-group"][data-id="第三阶段 · 阅读专项"]').click();
  await expect(navigation.locator('.nav-mobile-label')).toHaveText('新增阅读主题');
  await navigation.locator('.nav-catalog-picker summary').click();
  await expect(navigation.locator('.nav-catalog-item:visible')).toHaveText('新增阅读主题');
  await expect(navigation.locator('.nav-catalog-item')).toHaveAttribute('aria-current', 'true');
  await page.reload();
  await expect(navigation.locator('.nav-group-picker summary')).toHaveText('阅读与积累');
  await expect(navigation.locator('.nav-mobile-label')).toHaveText('新增阅读主题');
});

test('两级分类带彩色编号，入口文字紧凑且主题图标各有区分', async ({ page }) => {
  await page.goto('/');
  const navigation = page.locator('.feature-navigation');
  const modes = page.locator('.mode-navigation');
  await expect(navigation.locator('summary .nav-group-index')).toHaveAttribute('data-number', '01');
  await expect(modes.locator('summary .nav-group-index')).toHaveAttribute('data-number', '01');
  for (const root of [navigation, modes]) {
    const summary = root.locator('.nav-group-picker summary');
    expect(await summary.evaluate(element => {
      const text = element.querySelector('.nav-group-name').getBoundingClientRect();
      const arrow = element.querySelector(':scope > .icon').getBoundingClientRect();
      return arrow.left - text.right;
    })).toBeLessThanOrEqual(10);
    await summary.click();
    const colors = await root.locator('.nav-group-item .nav-group-index').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor));
    const groupCount = await root.locator('.nav-group-item').count();
    expect(new Set(colors).size).toBe(groupCount);
    expect(await root.locator('.nav-group-item .nav-group-index').evaluateAll(elements => elements.map(element => element.dataset.number))).toEqual(Array.from({ length: groupCount }, (_, index) => String(index + 1).padStart(2, '0')));
    await page.keyboard.press('Escape');
  }
  await chooseMode(page, 'audio');
  await expect(modes.locator('summary .nav-group-index')).toHaveAttribute('data-number', '02');
  await selectTopic(page, '近义词与反义词');
  await expect(navigation.locator('summary .nav-group-index')).toHaveAttribute('data-number', '02');
  for (const topic of ['近义词与反义词', '标点符号']) {
    await selectTopic(page, topic);
    const graphics = await navigation.locator('.nav-tabs button > svg').evaluateAll(elements => elements.map(element => element.innerHTML));
    expect(new Set(graphics).size).toBe(graphics.length);
  }
});
