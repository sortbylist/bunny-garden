import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { defaultState } from '../../src/engine.js';
import { openMyMenu, seedStoredState } from './helpers.js';

test('正式学习页使用已通过的慧慧整词，审核页可试听并导出剩余条目', async ({ page }) => {
  const state = defaultState();
  state.favorites = ['word-白云'];
  await seedStoredState(page, state);
  await page.goto('/');
  await expect(page.locator('a[href*="audio-review"]')).toHaveCount(0);
  const favicon = page.locator('link[rel="icon"]');
  const faviconPath = await favicon.getAttribute('href');
  await openMyMenu(page, '[data-id="favorites"]');
  await page.locator('[data-action="library-item"]').click();
  const approvedRecording = page.waitForResponse('**/audio/review/huihui/baiyun.wav');
  await page.getByRole('button', { name: '听 白云 的读音' }).click();
  expect((await approvedRecording).ok()).toBe(true);
  const learningStorage = await page.evaluate(() => ({ ...localStorage }));

  await page.goto('/audio-review/');
  await expect(page).toHaveTitle('试听审核 · 小兔学习乐园');
  await expect(favicon).toHaveAttribute('href', faviconPath);
  await expect(page.getByLabel('审核批次')).toHaveValue('huihui');
  await expect(page.getByLabel('每页数量')).toHaveValue('20');
  await expect(page.getByRole('article')).toHaveCount(10);
  for (const name of ['白云', '小草', '画画']) {
    await expect(page.getByRole('article', { name, exact: true })).toHaveCount(0);
  }
  const writing = page.getByRole('article', { name: '写字', exact: true });
  const sample = page.waitForResponse('**/audio/review/huihui/xiezi.wav');
  await writing.getByRole('button', { name: '听慧慧整词' }).click();
  expect((await sample).ok()).toBe(true);
  await expect(writing.getByText('播放完毕。')).toBeVisible();
  const firstSound = page.waitForResponse('**/audio/xie3.mp3');
  const secondSound = page.waitForResponse('**/audio/zi4.mp3');
  await writing.getByRole('button', { name: '听原逐字对照' }).click();
  expect((await firstSound).ok()).toBe(true);
  expect((await secondSound).ok()).toBe(true);

  await writing.getByRole('radio', { name: '需修改' }).check();
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  await expect(writing.getByLabel('问题与备注')).toBeFocused();
  await writing.getByLabel('问题与备注').fill('第二个字稍轻。');

  await page.getByRole('button', { name: '数学', exact: true }).click();
  await expect(page.getByText('当前范围没有待审核的试听内容。')).toBeVisible();
  await page.getByRole('button', { name: '英语', exact: true }).click();
  await page.getByLabel('审核批次').selectOption('campus');
  await page.getByLabel('每页数量').selectOption('8');
  await page.getByLabel('阶段').selectOption('english-1');
  await page.getByLabel('主题').selectOption('english-listening');
  await page.getByLabel('分类').selectOption('classroom-instructions');
  await expect(page.getByRole('article').first()).toContainText('Open your book.');
  const bottomPages = page.getByRole('navigation', { name: '清单底部分页' });
  const topPages = page.getByRole('navigation', { name: '清单顶部分页' });
  await bottomPages.getByRole('button', { name: '下一页' }).click();
  await expect(bottomPages.getByText('第 2 / 2 页')).toBeVisible();
  await expect(topPages.getByText('第 2 / 2 页')).toBeInViewport();
  await expect(topPages.getByRole('button', { name: '下一页' })).toBeDisabled();

  await page.getByRole('button', { name: '语文', exact: true }).click();
  await expect(writing.getByRole('radio', { name: '需修改' })).toBeChecked();
  await expect(writing.getByLabel('问题与备注')).toHaveValue('第二个字稍轻。');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const download = await downloadEvent;
  const json = await readFile(await download.path(), 'utf8');
  const report = JSON.parse(json);
  expect(download.suggestedFilename()).toMatch(/^audio-review-chinese-huihui-.*\.json$/);
  expect(json).toBe(JSON.stringify(report) + '\n');
  expect(report.version).toBe(2);
  expect(report.total).toBe(10);
  expect(report.items[0]).toMatchObject({ status: 'needs-change', noteIndex: 0 });
  expect(report.notes[0]).toBe('第二个字稍轻。');
  expect(report.items[1].status).toBeUndefined();
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(learningStorage);

  await page.reload();
  await expect(writing.getByRole('radio', { name: '未审核' })).toBeChecked();
  await expect(writing.getByLabel('问题与备注')).toHaveValue('');
});

test('慧慧借音批次可在同一张卡试听候选音节和现有录音', async ({ page }) => {
  await page.goto('/audio-review/');
  await page.getByLabel('审核批次').selectOption('huihui-borrowed');
  await expect(page.getByText('本批次已标记 0 / 34 项')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(20);
  const card = page.getByRole('article', { name: 'b', exact: true });
  const candidate = page.waitForResponse('**/audio/review/huihui-borrowed/initial-b.wav');
  await card.getByRole('button', { name: '听慧慧样本' }).click();
  expect((await candidate).ok()).toBe(true);
  await expect(card.getByText('播放完毕。')).toBeVisible();
  const reference = page.waitForResponse('**/audio/bo1.mp3');
  await card.getByRole('button', { name: '听现有录音' }).click();
  expect((await reference).ok()).toBe(true);
  await expect(card.getByText('播放完毕。')).toBeVisible();
});

test('拼读组合题播放正式学习音频并导出四题', async ({ page }) => {
  await page.goto('/audio-review/');
  const batch = page.getByLabel('审核批次');
  await expect(batch.locator('option[value="huihui-pronunciation"]')).toHaveCount(0);
  await batch.selectOption('borrowed');
  await expect(page.getByRole('article')).toHaveCount(4);
  const blend = page.getByRole('article', { name: 'x + iong', exact: true });
  const segmentPaths = [];
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/audio/')) segmentPaths.push(path.split('/').at(-1));
  });
  await blend.getByRole('button', { name: '听分解' }).click();
  await expect(blend.getByText('播放完毕。')).toBeVisible();
  expect(segmentPaths).toEqual(['xi1.mp3', 'yi1.mp3', 'ong-openlearn.wav']);
  await blend.getByRole('button', { name: '听完整拼读' }).click();
  await expect(blend.getByText('播放完毕。')).toBeVisible();
  expect(segmentPaths.at(-1)).toBe('xiong2.mp3');

  await blend.getByRole('radio', { name: '待复核' }).check();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const download = await downloadEvent;
  const report = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(report.scope.batch.id).toBe('borrowed');
  expect(report.total).toBe(4);
  expect(report.items.at(-1)).toMatchObject({ title: 'x + iong', status: 'recheck' });
});

test('手机上可翻页试听 34 张借音卡并查看 20 首古诗', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/audio-review/');
  await page.getByLabel('审核批次').selectOption('huihui-borrowed');
  await page.getByLabel('每页数量').selectOption('8');
  await expect(page.getByText('本批次已标记 0 / 34 项')).toBeVisible();
  const topPages = page.getByRole('navigation', { name: '清单顶部分页' });
  await expect(topPages.getByRole('button', { name: '下一页' })).toBeInViewport();
  await topPages.getByRole('button', { name: '下一页' }).click();
  await expect(topPages.getByText('第 2 / 5 页')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByLabel('审核批次').selectOption('borrowed');
  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(topPages).toBeHidden();
  const blend = page.getByRole('article', { name: 'x + iong', exact: true });
  await expect(blend.getByRole('button', { name: '听分解' })).toBeVisible();
  await expect(blend.getByRole('button', { name: '听完整拼读' })).toBeVisible();
  await page.getByLabel('审核批次').selectOption('poetry');
  await expect(page.getByText('本批次已标记 0 / 20 项')).toBeVisible();
  const poem = page.getByRole('article', { name: '咏鹅', exact: true });
  await expect(poem.getByText('唐 · 骆宾王', { exact: true })).toBeVisible();
  await expect(poem.getByRole('button', { name: '听示范朗读' })).toBeVisible();
  await expect(poem.locator('.ct-poem-lines > p').first()).toHaveCSS('font-size', '20px');
  await page.getByText('批量审批当前页', { exact: true }).click();
  await expect(page.getByLabel('批量审核结果')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('可调整到每页 100 项，批量审核只影响当前页并保留已有备注', async ({ page }) => {
  await page.goto('/audio-review/');
  await page.getByLabel('审核批次').selectOption('pinyin');
  const size = page.getByLabel('每页数量');
  const cards = page.getByRole('article');
  await size.selectOption('8');
  await expect(cards).toHaveCount(8);
  for (const count of [20, 50, 100]) {
    await size.selectOption(String(count));
    await expect(cards).toHaveCount(count);
  }

  const first = cards.first();
  await first.getByRole('radio', { name: '待复核' }).check();
  await first.getByLabel('问题与备注').fill('保留这条单项备注。');
  await page.getByText('批量审批当前页', { exact: true }).click();
  const result = page.getByLabel('批量审核结果');
  const bulkNote = page.getByLabel('批量备注');
  await result.selectOption('approved');
  await page.getByRole('button', { name: '应用到本页 99 项' }).click();
  await expect(page.getByText('已将本页 99 项标为「通过」。')).toBeVisible();
  await expect(first.getByRole('radio', { name: '待复核' })).toBeChecked();
  await expect(cards.last().getByRole('radio', { name: '通过' })).toBeChecked();

  const topPages = page.getByRole('navigation', { name: '清单顶部分页' });
  const bottomPages = page.getByRole('navigation', { name: '清单底部分页' });
  const topNext = topPages.getByRole('button', { name: '下一页' });
  await expect(topPages.getByRole('button', { name: '上一页' })).toBeDisabled();
  await expect(topNext).toBeInViewport();
  await topNext.click();
  await expect(topPages.getByText('第 2 / 4 页')).toBeInViewport();
  await expect(bottomPages.getByText('第 2 / 4 页')).toBeVisible();
  await expect(first.getByRole('radio', { name: '未审核' })).toBeChecked();
  await bottomPages.getByRole('button', { name: '上一页' }).click();
  await expect(topPages.getByText('第 1 / 4 页')).toBeInViewport();
  await expect(bottomPages.getByRole('button', { name: '上一页' })).toBeDisabled();
  await page.getByLabel('仅处理未审核项').uncheck();
  await result.selectOption('needs-change');
  const apply = page.getByRole('button', { name: '应用到本页 100 项' });
  await apply.click();
  await expect(bulkNote).toBeFocused();
  await expect(first.getByRole('radio', { name: '待复核' })).toBeChecked();
  await bulkNote.fill('这组音频需要复听。');
  await apply.click();
  await expect(first.getByRole('radio', { name: '需修改' })).toBeChecked();
  await expect(first.getByLabel('问题与备注')).toHaveValue('保留这条单项备注。');
  await expect(cards.last().getByLabel('问题与备注')).toHaveValue('这组音频需要复听。');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const file = await downloadEvent;
  const report = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(report.reviewed).toBe(100);
  expect(report.notes).toEqual(['保留这条单项备注。', '这组音频需要复听。']);
  expect(report.items[0]).toMatchObject({ status: 'needs-change', noteIndex: 0 });
  expect(report.items[1]).toMatchObject({ status: 'needs-change', noteIndex: 1 });
  expect(report.items[99]).toMatchObject({ status: 'needs-change', noteIndex: 1 });
  expect(report.items[100].status).toBeUndefined();
});
