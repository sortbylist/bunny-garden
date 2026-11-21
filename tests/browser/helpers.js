import { subjects, featureGroups, modes } from '../../src/data.js';
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
  await chooseNavigationItem(page, page.locator('.mode-navigation'), id, modes.find(mode => mode.id === id).group);
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
