export async function chooseMode(page, id) {
  if (['mistakes', 'favorites'].includes(id)) {
    await page.locator(`.garden-links [data-action="mode"][data-id="${id}"]`).click();
    return;
  }
  if (await page.locator('.play-selector-toggle').getAttribute('aria-expanded') === 'false') {
    await page.locator('.play-selector-toggle').click();
  }
  await page.locator(`.play-selector [data-action="mode"][data-id="${id}"]`).click();
}

export async function stored(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('bunny-garden-v1')));
}

export async function selectTopic(page, name) {
  const tab = page.getByRole('tab', { name, exact: true });
  if (!await tab.count()) await page.locator('[data-action="expand-tabs"]').click();
  await tab.click();
}
