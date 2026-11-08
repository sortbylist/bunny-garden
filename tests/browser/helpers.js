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
