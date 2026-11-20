import { test, expect } from '@playwright/test';
import { defaultState } from '../../src/engine.js';
import { initializeRewards } from '../../src/rewards.js';

async function seed(page, { obtained = [], animations = true, equipped = {} } = {}) {
  const state = defaultState();
  initializeRewards(state);
  for (const id of obtained) state.rewards.unlocks[id] = Date.now();
  Object.assign(state.rewards.equipped, equipped);
  state.settings.animations = animations;
  await page.addInitScript(saved => {
    if (!sessionStorage.getItem('reward-preview-seeded')) {
      localStorage.setItem('bunny-garden-v1', JSON.stringify(saved));
      sessionStorage.setItem('reward-preview-seeded', 'yes');
    }
  }, state);
}

async function openCollection(page) {
  await page.goto('/');
  await page.locator('.garden-links [data-action="reward-collection"]').click();
}

const savedRewards = page => page.evaluate(() => JSON.parse(localStorage.getItem('bunny-garden-v1')).rewards);

test('悬停成长花园和收藏册的贴纸时提示可以查看动效', async ({ page }) => {
  await seed(page, { obtained: ['hello-bunny'], equipped: { sticker: 'hello-bunny' } });
  await page.goto('/');
  const gardenSticker = page.locator('.garden-display .equipped-item.sticker');
  const gardenHint = gardenSticker.locator('.reward-motion-hint');
  await expect(gardenHint).toBeHidden();
  await gardenSticker.hover();
  await expect(gardenHint).toBeVisible();
  await expect(gardenHint).toHaveText('点一下，看它动起来！');
  await page.locator('.garden-links [data-action="reward-collection"]').click();
  const collectionSticker = page.locator('[data-reward="hello-bunny"] .reward-preview-trigger');
  const collectionHint = collectionSticker.locator('.reward-motion-hint');
  await expect(collectionHint).toBeHidden();
  await collectionSticker.hover();
  await expect(collectionHint).toBeVisible();
  await expect(collectionHint).toHaveText('点一下，看它动起来！');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(collectionHint).toBeHidden();
  await collectionSticker.click();
  await expect(page.locator('.reward-detail-dialog')).toBeVisible();
});

test('成长花园与个人空间的佩戴物品可播放动效，关闭后返回原入口且不重复发奖', async ({ page }) => {
  await seed(page, { obtained: ['hello-bunny'], equipped: { sticker: 'hello-bunny' } });
  await page.goto('/');
  const before = await savedRewards(page);
  const gardenItem = page.locator('.garden-display [data-action="equipped-reward-preview"]');
  await gardenItem.click();
  await expect(page.locator('.reward-viewer')).toHaveAttribute('data-effect', 'bunny');
  await expect(page.locator('.reward-viewer .reward-art > g')).toHaveCSS('animation-name', 'viewer-hop');
  await expect(page.getByRole('button', { name: '返回收藏册', exact: true })).toHaveCount(0);
  expect(await page.locator('.reward-viewer-orbit').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(330);
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('#dialog')).not.toBeVisible();
  await expect(gardenItem).toBeFocused();
  await page.locator('.growth-bottom [data-action="profile"]').click();
  const profileItem = page.locator('.profile-display [data-action="equipped-reward-preview"]');
  await profileItem.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.reward-viewer')).toHaveAttribute('data-effect', 'bunny');
  await page.keyboard.press('Escape');
  await expect(page.locator('.profile-dialog')).toBeVisible();
  await expect(profileItem).toBeFocused();
  expect(await savedRewards(page)).toEqual(before);
});

test('所有物品正常彩色展示，只有已获得物品盖印，未获得物品也能放大和旋转', async ({ page }) => {
  await seed(page, { obtained: ['hello-bunny'] });
  await openCollection(page);
  await expect(page.locator('.reward-card')).toHaveCount(94);
  await expect(page.locator('.reward-preview-trigger')).toHaveCount(94);
  await expect(page.locator('.reward-obtained-stamp')).toHaveCount(1);
  await expect(page.locator('[data-reward="hello-bunny"] .reward-obtained-stamp')).toContainText('已获得');
  await expect(page.locator('.reward-obtained-stamp path')).toHaveCount(1);
  const colors = await page.locator('.reward-card.locked .reward-art').evaluateAll(elements => elements.every(element => {
    const style = getComputedStyle(element);
    return !style.filter.includes('grayscale') && style.opacity === '1';
  }));
  expect(colors).toBe(true);
  const before = await savedRewards(page);
  await page.locator('[data-reward="little-sprout"] h3').click();
  await expect(page.locator('.reward-detail-dialog')).toBeVisible();
  await expect(page.locator('.reward-preview-status')).toContainText('尚未获得');
  await expect(page.locator('.reward-detail-progress')).toContainText('0 / 6');
  await expect(page.locator('[data-action="replay-reward"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '返回收藏册', exact: true })).toHaveCount(0);
  const rotation = page.getByRole('slider', { name: '旋转芽芽种子' });
  await page.getByRole('button', { name: '向右旋转', exact: true }).click();
  await expect(rotation).toHaveAttribute('aria-valuenow', '30');
  await rotation.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(rotation).toHaveAttribute('aria-valuenow', '15');
  await page.keyboard.press('Home');
  await expect(rotation).toHaveAttribute('aria-valuenow', '0');
  const bounds = await rotation.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2 - 20, { steps: 5 });
  await page.mouse.up();
  await expect(rotation).toHaveAttribute('aria-valuenow', '48');
  await page.getByRole('button', { name: '回正', exact: true }).click();
  await expect(rotation).toHaveAttribute('aria-valuenow', '0');
  const toggle = page.locator('[data-viewer-action="motion"]');
  await toggle.click();
  await expect(toggle).toHaveText('播放动效');
  await expect(page.locator('.reward-viewer')).toHaveClass(/viewer-paused/);
  await toggle.click();
  await expect(toggle).toHaveText('暂停动效');
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('[data-action="reward-detail"][data-id="little-sprout"]')).toBeFocused();
  expect(await savedRewards(page)).toEqual(before);
});

test('小兔、风车、飞行物品与金牌使用各自动效，预览不发奖且返回保留分类和位置', async ({ page }) => {
  await openCollection(page);
  const before = await savedRewards(page);
  const cases = [
    ['hello-bunny', 'bunny', '.reward-art > g', 'viewer-hop'],
    ['paper-plane', 'plane', '.reward-plane', 'viewer-plane-orbit'],
    ['curious-glass', 'glass', '.reward-glass-content', 'viewer-magnify'],
    ['sections-6', 'map', '.reward-map-arrow', 'viewer-map-route'],
    ['first-topic-math', 'rocket', '.reward-rocket', 'viewer-rocket-launch'],
    ['first-topic-english', 'fairy', '.reward-fairy-wand', 'viewer-wand-wave'],
    ['first-topic-chinese', 'bookmark', '.reward-bookmark', 'viewer-bookmark'],
    ['star-tent', 'tent', '.reward-tent-star', 'viewer-starlight'],
    ['moon-bookmark', 'moon', '.reward-book-moon', 'viewer-starlight'],
    ['explorer', 'compass', '.reward-compass-needle', 'viewer-compass'],
    ['brave-mushroom', 'mushroom', '.reward-art > g', 'viewer-squish'],
    ['garden-pinwheel', 'pinwheel', '.reward-pinwheel-blades', 'gold-rays-turn'],
    ['stage-math-1-gold', 'gold', '.reward-viewer-character', 'gold-arrive'],
  ];
  for (const [id, effect, selector, animation] of cases) {
    await page.locator(`[data-action="reward-detail"][data-id="${id}"]`).click();
    await expect(page.locator('.reward-viewer')).toHaveAttribute('data-effect', effect);
    await expect(page.locator('.reward-viewer')).toHaveClass(/viewer-motion/);
    await expect(page.locator(`.reward-viewer ${selector}`)).toHaveCSS('animation-name', animation);
    await expect(page.locator('.gold-celebration')).toHaveCount(0);
    await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  }
  await page.locator('[data-action="reward-filter"][data-id="medal"]').click();
  const trigger = page.locator('.reward-preview-trigger').last();
  await trigger.scrollIntoViewIfNeeded();
  const scroll = await page.locator('.collection-dialog').evaluate(element => element.scrollTop);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-action="reward-filter"][data-id="medal"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(trigger).toBeFocused();
  expect(await page.locator('.collection-dialog').evaluate(element => element.scrollTop)).toBeCloseTo(scroll, 0);
  expect(await savedRewards(page)).toEqual(before);
});

for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
  test(`纸飞机沿椭圆飞远缩小、飞回放大，放大镜仅放大镜内图案（${viewport.width}px）`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openCollection(page);
    const before = await savedRewards(page);
    await page.locator('[data-action="reward-detail"][data-id="paper-plane"]').click();
    const points = await page.locator('.reward-plane').evaluate(async element => {
      const animation = element.getAnimations()[0];
      const body = element.querySelector('.reward-plane-body');
      const depth = body.getAnimations()[0];
      animation.pause();
      depth.pause();
      await Promise.all([animation.ready, depth.ready]);
      return [0, 750, 1500, 2250, 3000, 3750, 4500, 5250, 6000].map(time => {
        animation.currentTime = time;
        depth.currentTime = time;
        const matrix = new DOMMatrix(getComputedStyle(element).transform);
        const size = new DOMMatrix(getComputedStyle(body).transform);
        const bounds = body.getBoundingClientRect();
        const scene = element.closest('.reward-viewer-scene').getBoundingClientRect();
        return {
          horizontal: matrix.e, vertical: matrix.f, size: Math.hypot(size.a, size.b),
          visible: bounds.left >= scene.left && bounds.right <= scene.right && bounds.top >= scene.top && bounds.bottom <= scene.bottom,
        };
      });
    });
    expect(points[0].horizontal).toBeCloseTo(0, 3);
    expect(points[0].vertical).toBeCloseTo(0, 3);
    for (const point of points) {
      const tilt = 25 * Math.PI / 180;
      const horizontal = point.horizontal * Math.cos(tilt) - point.vertical * Math.sin(tilt);
      const vertical = point.horizontal * Math.sin(tilt) + point.vertical * Math.cos(tilt);
      expect(((horizontal - 22) / 22) ** 2 + (vertical / 11) ** 2).toBeCloseTo(1, 3);
      expect(point.visible).toBe(true);
    }
    expect(points[4].horizontal).toBeGreaterThan(39);
    expect(points[4].vertical).toBeLessThan(-18);
    expect(points[4].size).toBeCloseTo(.4, 3);
    for (let index = 1; index <= 4; index++) expect(points[index].size).toBeLessThan(points[index - 1].size);
    for (let index = 5; index <= 8; index++) expect(points[index].size).toBeGreaterThan(points[index - 1].size);
    expect(points[8]).toEqual(points[0]);
    await page.locator('[data-viewer-action="motion"]').click();
    await expect(page.locator('.reward-plane-body')).toHaveCSS('animation-play-state', 'paused');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.reward-plane')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.reward-plane-body')).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
    await page.locator('[data-action="reward-detail"][data-id="curious-glass"]').click();
    const lens = page.locator('.reward-glass-content');
    const magnification = await lens.evaluate(async element => {
      const animation = element.getAnimations()[0];
      animation.pause();
      await animation.ready;
      return [0, 2340].map(time => {
        animation.currentTime = time;
        const content = element.getBoundingClientRect();
        const frame = element.parentElement.querySelector('circle').getBoundingClientRect();
        return {
          width: content.width, height: content.height,
          centerX: content.x + content.width / 2, centerY: content.y + content.height / 2,
          frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
        };
      });
    });
    expect(magnification[1].width / magnification[0].width).toBeCloseTo(1.35 / .35, 2);
    expect(magnification[1].height / magnification[0].height).toBeCloseTo(1.35 / .35, 2);
    expect(magnification[1].centerX).toBeCloseTo(magnification[0].centerX, 2);
    expect(magnification[1].centerY).toBeCloseTo(magnification[0].centerY, 2);
    expect(magnification[1].frame).toEqual(magnification[0].frame);
    await page.screenshot({ path: `artifacts/reward-glass-${viewport.width}.png` });
    await page.locator('[data-viewer-action="motion"]').click();
    await expect(lens).toHaveCSS('animation-play-state', 'paused');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(lens).toHaveCSS('animation-name', 'none');
    expect(await savedRewards(page)).toEqual(before);
  });

  test(`地图箭头沿虚线走，其余物品只播放指定部位动效（${viewport.width}px）`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openCollection(page);
    const before = await savedRewards(page);
    await page.locator('[data-action="reward-detail"][data-id="sections-6"]').click();
    const routeSamples = await page.locator('.reward-map-arrow').evaluate(async element => {
      const route = element.parentElement.querySelector('.reward-map-route');
      const animation = element.getAnimations()[0];
      animation.pause();
      await animation.ready;
      return [.05, .25, .5, .75, .95].map(progress => {
        animation.currentTime = 4000 * progress;
        const expected = route.getPointAtLength(route.getTotalLength() * progress);
        const actual = new DOMPoint(0, 0).matrixTransform(element.getScreenCTM());
        const expectedScreen = new DOMPoint(expected.x, expected.y).matrixTransform(route.getScreenCTM());
        return { distance: Math.hypot(actual.x - expectedScreen.x, actual.y - expectedScreen.y), horizontal: actual.x };
      });
    });
    for (const sample of routeSamples) expect(sample.distance).toBeLessThan(1);
    expect(routeSamples.at(-1).horizontal - routeSamples[0].horizontal).toBeGreaterThan(100);
    await page.screenshot({ path: `artifacts/reward-map-motion-${viewport.width}.png` });
    await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
    const cases = [
      ['first-topic-math', '.reward-rocket', 'launch'],
      ['first-topic-english', '.reward-fairy-wand', 'wave'],
      ['first-topic-chinese', '.reward-bookmark', 'bookmark'],
      ['star-tent', '.reward-tent-star', 'glow'],
      ['moon-bookmark', '.reward-book-moon', 'glow'],
      ['explorer', '.reward-compass-needle', 'compass'],
    ];
    for (const [id, selector, effect] of cases) {
      await page.locator(`[data-action="reward-detail"][data-id="${id}"]`).click();
      const target = page.locator(`.reward-viewer ${selector}`);
      await expect(page.locator('.reward-viewer-character')).toHaveCSS('animation-name', 'none');
      const samples = await target.evaluate(async element => {
        const animation = element.getAnimations()[0];
        animation.pause();
        await animation.ready;
        const duration = animation.effect.getTiming().duration;
        return [0, .3, .5, .7].map(progress => {
          animation.currentTime = duration * progress;
          const style = getComputedStyle(element);
          const matrix = new DOMMatrix(style.transform);
          return {
            horizontal: matrix.e, vertical: matrix.f,
            angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
            opacity: Number(style.opacity), glow: style.filter,
          };
        });
      });
      if (effect === 'launch') {
        expect(samples[3].vertical).toBeLessThan(-70);
        expect(samples[3].horizontal).toBe(0);
      } else if (effect === 'wave') {
        expect(samples[0].angle).toBeLessThan(0);
        expect(samples[1].angle).toBeGreaterThan(15);
      } else if (effect === 'bookmark') {
        expect(samples[2].vertical).toBeCloseTo(-9, 2);
        expect(samples[2].horizontal).toBe(0);
      } else if (effect === 'glow') {
        expect(samples[2].opacity).toBeGreaterThan(samples[0].opacity);
        expect(samples[2].glow).not.toEqual(samples[0].glow);
      } else {
        expect(samples[0].angle).toBeLessThan(-30);
        expect(samples[2].angle).toBeGreaterThan(30);
      }
      await page.locator('[data-viewer-action="motion"]').click();
      await expect(target).toHaveCSS('animation-play-state', 'paused');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(target).toHaveCSS('animation-name', 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
    }
    expect(await savedRewards(page)).toEqual(before);
  });
}

test('主题徽章在花园、收藏卡片、大图和颁奖中使用同一学习图标', async ({ page }) => {
  await seed(page, { obtained: ['topic-hanzi-structure'], equipped: { badge: 'topic-hanzi-structure' } });
  await page.goto('/');
  const gardenIcon = page.locator('.garden-display .reward-topic-icon');
  await expect(gardenIcon).toHaveAttribute('data-icon', 'pen');
  const expected = await gardenIcon.innerHTML();
  await page.locator('.garden-links [data-action="reward-collection"]').click();
  const cardIcon = page.locator('[data-reward="topic-hanzi-structure"] .reward-topic-icon');
  expect(await cardIcon.innerHTML()).toEqual(expected);
  await page.locator('[data-action="reward-detail"][data-id="topic-hanzi-structure"]').click();
  expect(await page.locator('.reward-viewer .reward-topic-icon').innerHTML()).toEqual(expected);
  await page.locator('[data-action="replay-reward"]').click();
  expect(await page.locator('.reward-notice .reward-topic-icon').innerHTML()).toEqual(expected);
});

test('预览中可以查看未获得奖牌的条件，返回后继续操作且不消费待颁奖队列', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="known"]').click();
  await page.locator('.garden-links [data-action="reward-collection"]').click();
  const before = await savedRewards(page);
  await page.locator('[data-action="reward-detail"][data-id="stage-math-1-gold"]').click();
  await page.getByRole('button', { name: '查看数与运算金牌获得条件', exact: true }).click();
  await expect(page.locator('.reward-scope')).toContainText('混合运算');
  await page.getByRole('button', { name: '返回物品展示', exact: true }).click();
  await expect(page.locator('.reward-detail-dialog')).toBeVisible();
  await page.getByRole('button', { name: '向左旋转', exact: true }).click();
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '-30');
  await expect(page.locator('.reward-notice')).toHaveCount(0);
  expect(await savedRewards(page)).toEqual(before);
});

test('全局关闭动效或系统减少动态效果时静态预览，仍能手动旋转', async ({ page }) => {
  await seed(page, { animations: false });
  await openCollection(page);
  await page.locator('[data-action="reward-detail"][data-id="hello-bunny"]').click();
  await expect(page.locator('.reward-viewer')).not.toHaveClass(/viewer-motion/);
  await expect(page.locator('[data-viewer-action="motion"]')).toBeDisabled();
  await expect(page.locator('.reward-viewer .reward-art > g')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: '向右旋转', exact: true }).click();
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '30');
  await expect(page.locator('.reward-viewer-motion-note')).toContainText('学习设置');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.reward-viewer-motion-note')).toContainText('系统减少动态效果');
});

test.describe('手机预览', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('触控拖动旋转，动态偏好即时生效，界面没有横向溢出', async ({ page }) => {
    await seed(page, { obtained: ['hello-bunny'] });
    await openCollection(page);
    await page.locator('[data-action="reward-detail"][data-id="hello-bunny"]').tap();
    const stage = page.getByRole('slider');
    const bounds = await stage.boundingBox();
    const session = await page.context().newCDPSession(page);
    const horizontal = bounds.x + bounds.width / 2;
    const vertical = bounds.y + bounds.height / 2;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: horizontal, y: vertical }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: horizontal + 50, y: vertical - 15 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(stage).toHaveAttribute('aria-valuenow', '40');
    await page.getByRole('button', { name: '回正', exact: true }).tap();
    await expect(stage).toHaveAttribute('aria-valuenow', '0');
    await page.getByRole('button', { name: '向右旋转', exact: true }).tap();
    await expect(stage).toHaveAttribute('aria-valuenow', '30');
    await page.getByRole('button', { name: '回正', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(stage).toHaveAttribute('aria-valuenow', '0');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.reward-viewer')).not.toHaveClass(/viewer-motion/);
    await expect(page.locator('.reward-viewer .reward-art > g')).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.reward-viewer')).toHaveClass(/viewer-motion/);
    await expect(page.locator('.reward-viewer .reward-art > g')).toHaveCSS('animation-name', 'viewer-hop');
    expect(await page.locator('.reward-detail-dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'artifacts/reward-preview-mobile.png' });
  });
});
