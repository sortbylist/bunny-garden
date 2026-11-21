import { subjects, featureGroups } from '../../src/data.js';
import { appStorageKey } from '../../src/storage.js';
import { decodeLearningData, encodeLearningData } from '../../src/learning-data.js';

async function chooseNavigationItem(page, root, id, category) {
  const currentGroup = root.locator('[data-action="nav-group"][aria-current="true"]');
  if (await currentGroup.count() && await currentGroup.getAttribute('data-id') !== category) {
    await root.locator('.nav-group-picker summary').click();
    await root.locator(`[data-action="nav-group"][data-id="${category}"]`).click();
  }
  const tab = root.locator(`.nav-tabs [data-id="${id}"]`);
  if (await tab.isVisible()) await tab.click();
  else if (await root.locator('.nav-catalog-picker').count()) {
    await root.locator('.nav-catalog-picker summary').click();
    await root.locator(`.nav-catalog-item[data-id="${id}"]`).click();
  }
}

export async function chooseMode(page, id) {
  if (id === 'mistakes') {
    await openMyMenu(page, '[data-action="library-open"][data-id="mistakes"]');
    await page.locator('[data-action="library-review-group"][data-id="pinyin"]').click();
    return;
  }
  const navigation = page.locator('[data-navigation="pinyin-modes"]');
  const area = ['sequence', 'random', 'tones', 'favorites'].includes(id) ? 'learn' : 'practice';
  const tab = navigation.locator(`[data-action="pinyin-area"][data-id="${area}"]`);
  if (await tab.getAttribute('aria-pressed') !== 'true') await tab.click();
  if (['sequence', 'random'].includes(id)) {
    const order = page.locator('[data-action="pinyin-order"]');
    if (!(await order.count())) await navigation.locator('[data-action="pinyin-category"]').first().click();
    if (await order.textContent() === (id === 'sequence' ? '顺序学习' : '随机认读')) await order.click();
  } else if (id === 'favorites') {
    await openMyMenu(page, '[data-action="library-open"][data-id="favorites"]');
  } else await navigation.locator(`.nav-tabs [data-action="mode"][data-id="${id}"]`).click();
}

export async function choosePhonicsMode(page, id) {
  if (['mixed', 'meaning', 'spelling', 'listen'].includes(id)) {
    const tab = page.locator('[data-action="ph-area"][data-id="practice"]');
    if (await tab.getAttribute('aria-pressed') !== 'true') await tab.click();
    await page.locator(`[data-action="ph-practice"][data-id="${id}"]`).click();
    return;
  }
  if (['learn', 'random', 'reading', 'rules'].includes(id)) {
    const tab = page.locator('[data-action="ph-area"][data-id="learn"]');
    if (await tab.getAttribute('aria-pressed') !== 'true') await tab.click();
    if (!(await page.locator('.ph-rule').count())) await page.locator('[data-action="ph-mode"][data-id="learn"]').click();
    if (id === 'rules') {
      await page.locator('.ph-rule .section-practice-shortcut').click();
      const { phonics } = await stored(page);
      const round = phonics.sessions[`mixed:lesson:${phonics.lessonId}:${phonics.length}`];
      const index = round.ids.findIndex(questionId => questionId.startsWith('rule-'));
      await page.locator(`[data-action="ph-question"][data-index="${index}"]`).click();
    } else if (id !== 'learn') await page.locator(`.ph-rule [data-action="ph-mode"][data-id="${id}"]`).click();
  }
}

export async function openMyMenu(page, selector) {
  const menu = page.locator('.my-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  await menu.locator(selector).click();
}

export async function stored(page) {
  const data = await storedDocument(page);
  return data && decodeLearningData(data);
}

export function storedDocument(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), appStorageKey);
}

export function seedStoredState(page, state) {
  return page.addInitScript(({ key, data }) => {
    if (sessionStorage.getItem('learning-data-seeded')) return;
    localStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem('learning-data-seeded', 'yes');
  }, { key: appStorageKey, data: encodeLearningData(state) });
}

export async function setLearningPreference(page, field, enabled) {
  await page.locator('.my-menu-toggle').click();
  await page.locator('[data-action="menu-settings"]').click();
  const dialog = page.getByRole('dialog', { name: '学习设置' });
  await dialog.locator(`[data-setting="${field}"]`).setChecked(enabled);
  await dialog.getByRole('button', { name: '关闭弹窗' }).click();
}

export async function setRoundLength(page, length) {
  const settings = page.locator('.round-settings');
  if (await settings.getAttribute('open') === null) await settings.locator('summary').click();
  await settings.getByLabel('每轮题数').selectOption(String(length));
}

export async function selectTopic(page, name, subjectId = 'chinese') {
  const subject = subjects.find(item => item.id === subjectId);
  const stage = featureGroups(subject).find(group => group.items.some(item => item.name === name));
  const feature = stage.items.find(item => item.name === name);
  await chooseNavigationItem(page, page.locator('.feature-navigation'), feature.id, stage.id);
}

export async function startCombinedPractice(page, prefix = 'ct') {
  const tab = page.locator(`[data-action="${prefix}-area"][data-id="practice"]`);
  if (await tab.getAttribute('aria-pressed') !== 'true') await tab.click();
  await page.locator(`[data-action="${prefix}-start"][data-id="all"]`).click();
}

export async function chooseLearningCategory(page, prefix, id) {
  const tab = page.locator(`[data-action="${prefix}-area"][data-id="learn"]`);
  if (await tab.getAttribute('aria-pressed') !== 'true') await tab.click();
  await page.locator(`[data-action="${prefix}-category"][data-id="${id}"]`).click();
}
