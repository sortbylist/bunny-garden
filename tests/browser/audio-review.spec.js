import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { toneExamples } from '../../src/data.js';
import { defaultState, questionPool } from '../../src/engine.js';
import { openMyMenu, seedStoredState } from './helpers.js';

const confusingPair = [
  { id: 'pinyin/confusing/retroflex-confusing:cha1', path: '/audio/huihui-pinyin/cha1.wav', sourceText: '插' },
  { id: 'pinyin/confusing/retroflex-confusing:sha1', path: '/audio/huihui-pinyin/sha1.wav', sourceText: '纱' },
];

const toneRows = [...toneExamples.flatMap(group => group.items).slice(0, 5), ...questionPool('tonequiz')]
  .map(({ id }) => ({ id: `pinyin/tones/${id}` }));

async function seedPendingReviews(page, rows = toneRows) {
  const items = Object.fromEntries(rows.map(({ id, decision }) => [id, decision ?? { status: 'unreviewed' }]));
  await page.route('**/audio/review/pending.json', route => route.fulfill({ json: { items } }));
}

test('正式学习页使用已通过的慧慧整词，审核页可编辑并导出复核备注', async ({ page }) => {
  const state = defaultState();
  state.favorites = ['word-白云'];
  await seedStoredState(page, state);
  await page.goto('/');
  await expect(page.locator('a[href*="audio-review"]')).toHaveCount(0);
  const favicon = page.locator('link[rel="icon"]');
  const faviconPath = await favicon.getAttribute('href');
  await openMyMenu(page, '[data-id="favorites"]');
  await page.locator('[data-action="library-item"]').click();
  const approvedRecording = page.waitForResponse('**/audio/huihui/baiyun.wav');
  await page.getByRole('button', { name: '听 白云 的读音' }).click();
  expect((await approvedRecording).ok()).toBe(true);
  const learningStorage = await page.evaluate(() => ({ ...localStorage }));

  const initialNote = '请复听声调。';
  await seedPendingReviews(page, [
    { ...confusingPair[0], decision: { status: 'recheck', note: initialNote } },
    confusingPair[1],
  ]);
  await page.goto('/audio-review/');
  await expect(page).toHaveTitle('试听审核 · 小兔学习乐园');
  await expect(favicon).toHaveAttribute('href', faviconPath);
  const batch = page.getByLabel('审核批次');
  await expect(batch).toHaveValue('pinyin');
  await expect(page.getByLabel('每页数量')).toHaveValue('20');

  const category = page.getByLabel('分类');
  await category.selectOption('confusing');
  const { id } = confusingPair[0];
  const card = page.locator(`[data-audit-row="${id}"]`);
  await expect(card.getByRole('radio', { name: '待复核' })).toBeChecked();
  await expect(card.getByLabel('问题与备注')).toHaveValue(initialNote);
  await card.getByRole('radio', { name: '需修改' }).check();
  await card.getByLabel('问题与备注').fill('');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  await expect(card.getByLabel('问题与备注')).toBeFocused();
  await card.getByLabel('问题与备注').fill('读音需要再确认。');

  await page.getByLabel('每页数量').selectOption('8');
  await page.getByLabel('阶段').selectOption('chinese-1');
  await page.getByLabel('主题').selectOption('pinyin');
  await category.selectOption('');
  await expect(page.getByRole('article')).toHaveCount(2);

  await category.selectOption('confusing');
  await expect(card.getByRole('radio', { name: '需修改' })).toBeChecked();
  await expect(card.getByLabel('问题与备注')).toHaveValue('读音需要再确认。');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const download = await downloadEvent;
  const json = await readFile(await download.path(), 'utf8');
  const report = JSON.parse(json);
  expect(download.suggestedFilename()).toMatch(/^audio-review-chinese-pinyin-.*\.json$/);
  expect(json).toBe(JSON.stringify(report) + '\n');
  expect(report.version).toBe(2);
  expect(report.reviewed).toBe(1);
  const item = report.items.find(item => item.id === id);
  expect(item.status).toBe('needs-change');
  expect(report.notes[item.noteIndex]).toBe('读音需要再确认。');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(learningStorage);

  await page.reload();
  await category.selectOption('confusing');
  await expect(card.getByRole('radio', { name: '待复核' })).toBeChecked();
  await expect(card.getByLabel('问题与备注')).toHaveValue(initialNote);
});

test('审核全部通过后只显示无待审核内容', async ({ page }) => {
  await page.goto('/audio-review/');
  await expect(page.getByText('没有待审核的试听内容。', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: '选择审核范围' })).toBeHidden();
  await expect(page.getByRole('button', { name: '导出审核结果（JSON）' })).toBeHidden();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByText(/已通过 \d+ 项/)).toHaveCount(0);
});

test('学习页播放已通过的「虾」录音，审核页可试听并导出两条修订', async ({ page }) => {
  const state = defaultState();
  state.favorites = ['char-虾'];
  await seedStoredState(page, state);
  await page.goto('/');
  await openMyMenu(page, '[data-id="favorites"]');
  await page.locator('[data-action="library-item"]').click();
  const learningRecording = page.waitForResponse('**/audio/audio-cmn/xia1.mp3');
  await page.getByRole('button', { name: '听 虾 的读音', exact: true }).click();
  expect((await learningRecording).ok()).toBe(true);

  await seedPendingReviews(page, confusingPair);
  await page.goto('/audio-review/');
  const fingerprints = new Map();
  for (const { id, path } of confusingPair) {
    const card = page.locator(`[data-audit-row="${id}"]`);
    const recording = page.waitForResponse(response => decodeURIComponent(new URL(response.url()).pathname).endsWith(path));
    await card.getByRole('button', { name: '听题目音频', exact: true }).click();
    const response = await recording;
    expect(response.ok()).toBe(true);
    await expect(card.getByText('播放完毕。')).toBeVisible();
    await expect(card.getByRole('radio', { name: '未审核' })).toBeChecked();
    await card.getByRole('radio', { name: '待复核' }).check();
    fingerprints.set(id, new URL(response.url()).searchParams.get('sha256'));
  }

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const download = await downloadEvent;
  const report = JSON.parse(await readFile(await download.path(), 'utf8'));
  for (const { id, path, sourceText } of confusingPair) {
    const item = report.items.find(item => item.id === id);
    expect(item.status).toBe('recheck');
    const clip = report.clips[item.audio[0].clipIndexes[0]];
    expect(clip).toMatchObject({ path, sourceText, sha256: fingerprints.get(id) });
  }
});

test('全部批次的导出只包含所选学科的待审条目', async ({ page }) => {
  await seedPendingReviews(page, confusingPair);
  await page.goto('/audio-review/');
  await expect(page.getByRole('group', { name: '学科' }).getByRole('button')).toHaveText(['语文']);
  await expect(page.getByLabel('审核批次').locator('option')).toHaveText(['全部批次', '其余拼音录音']);
  await page.getByLabel('审核批次').selectOption('');
  await page.getByLabel('主题').selectOption('pinyin');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const download = await downloadEvent;
  const report = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(report.scope.batch).toBeNull();
  expect(report.scope.subject.id).toBe('chinese');
  expect(new Set(report.locations.map(location => location.batch))).toEqual(new Set(['pinyin']));
  expect(report.reviewed).toBe(0);
  expect(report.items).toHaveLength(2);
  expect(report.items.every(item => !Object.hasOwn(item, 'status'))).toBe(true);
});

test('手机上可翻页查看拼音录音并展开批量审批', async ({ page }) => {
  await seedPendingReviews(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/audio-review/');
  await page.getByLabel('审核批次').selectOption('pinyin');
  await page.getByLabel('每页数量').selectOption('8');
  await expect(page.getByRole('article')).toHaveCount(8);
  const topPages = page.getByRole('navigation', { name: '清单顶部分页' });
  await expect(topPages.getByRole('button', { name: '下一页' })).toBeInViewport();
  await topPages.getByRole('button', { name: '下一页' }).click();
  await expect(topPages.getByText(/第 2 \/ \d+ 页/)).toBeInViewport();
  await page.getByText('批量审批当前页', { exact: true }).click();
  await expect(page.getByLabel('批量审核结果')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('可调整到每页 100 项，批量审核只影响当前页并保留已有备注', async ({ page }) => {
  await seedPendingReviews(page);
  await page.goto('/audio-review/');
  await page.getByLabel('审核批次').selectOption('pinyin');
  const size = page.getByLabel('每页数量');
  const cards = page.getByRole('article');
  await size.selectOption('8');
  await expect(cards).toHaveCount(8);
  for (const [pageSize, displayed] of [[20, 20], [50, 25], [100, 25]]) {
    await size.selectOption(String(pageSize));
    await expect(cards).toHaveCount(displayed);
  }
  await size.selectOption('8');

  const first = cards.first();
  await first.getByRole('radio', { name: '待复核' }).check();
  await first.getByLabel('问题与备注').fill('保留这条单项备注。');
  const second = cards.nth(1);
  await page.getByText('批量审批当前页', { exact: true }).click();
  const result = page.getByLabel('批量审核结果');
  const bulkNote = page.getByLabel('批量备注');
  await result.selectOption('approved');
  await page.getByRole('button', { name: '应用到本页 7 项' }).click();
  await expect(page.getByText('已将本页 7 项标为「通过」。')).toBeVisible();
  await expect(first.getByRole('radio', { name: '待复核' })).toBeChecked();
  await expect(second.getByRole('radio', { name: '通过' })).toBeChecked();

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
  const apply = page.getByRole('button', { name: '应用到本页 8 项' });
  await apply.click();
  await expect(bulkNote).toBeFocused();
  await expect(first.getByRole('radio', { name: '待复核' })).toBeChecked();
  await bulkNote.fill('这组音频需要复听。');
  await apply.click();
  await expect(first.getByRole('radio', { name: '需修改' })).toBeChecked();
  await expect(first.getByLabel('问题与备注')).toHaveValue('保留这条单项备注。');
  await expect(second.getByLabel('问题与备注')).toHaveValue('这组音频需要复听。');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出审核结果（JSON）' }).click();
  const file = await downloadEvent;
  const report = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(report.reviewed).toBe(8);
  expect(report.notes.slice(0, 2)).toEqual(['保留这条单项备注。', '这组音频需要复听。']);
  expect(report.items[0]).toMatchObject({ status: 'needs-change', noteIndex: 0 });
  expect(report.items[1]).toMatchObject({ status: 'needs-change', noteIndex: 1 });
  expect(report.items[7].status).toBe('needs-change');
  expect(report.items[8].status).toBeUndefined();
});
