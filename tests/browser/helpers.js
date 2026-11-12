import { subjects, modes } from '../../src/data.js';

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
  if (['mistakes', 'favorites'].includes(id)) {
    await page.locator(`.garden-links [data-action="mode"][data-id="${id}"]`).click();
    return;
  }
  await chooseNavigationItem(page, page.locator('.mode-navigation'), id, modes.find(mode => mode.id === id).group);
}

export async function stored(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('bunny-garden-v1')));
}

export async function selectTopic(page, name) {
  const feature = subjects.find(subject => subject.id === 'chinese').features.find(item => item.name === name);
  await chooseNavigationItem(page, page.locator('.feature-navigation'), feature.id, feature.category);
}
