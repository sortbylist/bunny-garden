import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { paragraphEntries } from '../../src/reading-paragraphs-data.js';
import { stored, selectTopic, setLearningPreference } from './helpers.js';

const topics = chineseTopics.filter(topic => topic.id.startsWith('reading-'));

for (const topic of topics) {
  test(`${topic.name}：原文、线索、草稿与答后依据独立恢复`, async ({ page }) => {
    const errors = [];
    const external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) external.push(request.url());
    });
    await page.goto('/');
    await selectTopic(page, topic.name);
    const first = topic.lessons[0];
    await expect(page.locator('.learning-main > .section-title')).toHaveCount(0);
    await expect(page.locator('.ct-reading-passage h4')).toHaveText(first.title);
    await expect(page.locator('.ct-reading-passage li')).toHaveCount(first.reading.passage.paragraphs.length);
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(0);
    await page.locator('[data-action="ct-activity-evidence"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ct-reading-guide')).toHaveText(first.reading.guide);
    await page.locator('#ct-draft').fill('我的依据来自原文，我想再读一遍。');
    await page.reload();
    await expect(page.locator('#ct-reading-guide')).toHaveText(first.reading.guide);
    await expect(page.locator('#ct-draft')).toHaveValue('我的依据来自原文，我想再读一遍。');
    await page.locator('[data-action="ct-next"]').click();
    await expect(page.locator('#ct-reading-guide')).toBeEmpty();
    await expect(page.locator('#ct-draft')).toHaveValue('');
    await page.locator('[data-action="ct-previous"]').click();
    await expect(page.locator('#ct-reading-guide')).toHaveText(first.reading.guide);
    const root = await stored(page);
    expect(root.rewards.events).toEqual([]);
    expect(root.topics[topic.id].known).toEqual([]);
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    const round = (await stored(page)).topics[topic.id].round;
    const question = round.questions[0];
    await expect(page.locator('.ct-reading-passage h4')).toHaveText(question.passage.title);
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(0);
    await expect(page.locator('[data-action="ct-activity-evidence"]')).toHaveCount(0);
    const wrong = question.options.find(option => option !== question.answer);
    await page.locator('.ct-quiz').getByRole('button', { name: wrong, exact: true }).click();
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(0);
    await page.locator('.ct-quiz').getByRole('button', { name: question.answer, exact: true }).click();
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(question.evidence.length);
    const explanation = await page.locator('.answer-feedback p').evaluate(element => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll('rt, rp').forEach(node => node.remove());
      return copy.textContent;
    });
    expect(explanation).toBe(question.explanation);
    await page.reload();
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(question.evidence.length);
    const restored = (await stored(page)).topics[topic.id];
    expect(restored.round.responses[0].correct).toBe(false);
    expect(restored.mistakes).toContain(question.id);
    await page.locator('[data-action="ct-advance"]').click();
    await expect(page.locator('.ct-reading-evidence')).toHaveCount(0);
    await page.locator('[data-action="ct-skip"]').click();
    await expect(page.locator('.ct-reading-evidence')).not.toHaveCount(0);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('句段排序键盘可操作，错序可撤回，四组顺序与阅读线索分别保存', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '段落理解与顺序整理');
  for (const entry of paragraphEntries.filter(item => item.order)) {
    await page.locator(`[data-action="ct-category"][data-id="${entry.category}"]`).click();
    await page.locator(`[data-action="ct-lesson"][data-id$=":${entry.id}"]`).click();
    await expect(page.locator('[data-action="ct-activity-check"]')).toBeDisabled();
    await expect(page.locator('.ct-order-feedback')).toContainText('每个句段用一次');
    for (let index = 0; index < entry.order.length; index++) {
      await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).click();
    }
    await page.locator('[data-action="ct-activity-check"]').click();
    await expect(page.locator('.ct-order-feedback')).toContainText('再看看时间和事情发展');
    await page.locator('[data-action="ct-activity-undo"]').click();
    await expect(page.locator('.ct-reading-order button:not(:disabled)')).toHaveCount(1);
    await page.locator('[data-action="ct-activity-clear"]').click();
    for (const index of entry.solution.slice(0, 2)) {
      await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).focus();
      await page.keyboard.press('Enter');
    }
    await page.reload();
    await expect(page.locator('.ct-reading-order button:disabled')).toHaveCount(2);
    for (const index of entry.solution.slice(2)) await page.locator(`[data-action="ct-activity-pick"][data-value="${index}"]`).click();
    await page.locator('[data-action="ct-activity-check"]').click();
    await expect(page.locator('.ct-order-feedback')).toContainText('顺序理清啦');
  }
  const root = await stored(page);
  expect(Object.values(root.topics['reading-paragraphs'].activities).filter(activity => activity.checked)).toHaveLength(4);
  expect(root.rewards.events).toEqual([]);
  expect(root.history).toEqual([]);
});

for (const width of [320, 820, 1440]) {
  test(`${width}px 五个阅读主题原文和练习可读，切换拼音不丢段落`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/');
    for (const topic of topics) {
      await selectTopic(page, topic.name);
      await setLearningPreference(page, 'showPinyin', false);
      await expect(page.locator('.ct-reading-passage ruby')).toHaveCount(0);
      for (const text of topic.lessons[0].reading.passage.paragraphs) await expect(page.locator('.ct-reading-passage')).toContainText(text);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('[data-action="ct-activity-evidence"]').click();
      await page.screenshot({ path: `artifacts/${topic.id}-${width}.png`, fullPage: true });
      await page.locator('[data-action="ct-start"][data-id="all"]').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await setLearningPreference(page, 'showPinyin', true);
      await expect(page.locator('.ct-reading-passage')).toBeVisible();
    }
  });
}

test('原有古诗草稿与阅读记录隔离，清空后阅读线索与排序一并重置', async ({ page }) => {
  await page.goto('/');
  await selectTopic(page, '古诗与传统文化');
  await page.locator('#ct-draft').fill('原来写的古诗想法。');
  await page.locator('[data-action="ct-activity-recite"]').click();
  for (const topic of topics) {
    await selectTopic(page, topic.name);
    await page.locator('#ct-draft').fill(topic.name);
    await page.locator('[data-action="ct-activity-evidence"]').click();
  }
  await selectTopic(page, '段落理解与顺序整理');
  await page.locator('[data-action="ct-category"][data-id="time"]').click();
  await page.locator('[data-action="ct-activity-pick"][data-value="1"]').click();
  await page.reload();
  await selectTopic(page, '古诗与传统文化');
  await expect(page.locator('#ct-draft')).toHaveValue('原来写的古诗想法。');
  await expect(page.locator('.ct-poem-lines')).toContainText('原文已遮住');
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="reset-confirm"]').click();
  await page.locator('[data-action="reset-all"]').click();
  const root = await stored(page);
  for (const topic of topics) expect(root.topics[topic.id].activities).toEqual({});
  expect(root.topics['poetry-culture'].activities).toEqual({});
});

test('阅读主题徽章与第三阶段奖牌显示新增范围', async ({ page }) => {
  await page.goto('/');
  await page.locator('.garden-links [data-action="reward-collection"]').click();
  await expect(page.locator('.reward-card')).toHaveCount(94);
  for (const topic of topics) {
    await expect(page.locator(`.reward-card[data-reward="topic-${topic.id}"]`)).toHaveCount(1);
  }
  await page.getByRole('button', { name: '查看阅读积累金牌获得条件', exact: true }).click();
  for (const topic of topics) await expect(page.locator('.reward-scope')).toContainText(topic.name);
  await expect(page.locator('.reward-scope')).toContainText('按事情发展排序');
});
