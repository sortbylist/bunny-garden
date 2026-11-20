import './reward-viewer.css';
import { rewardArt } from './reward-art.js';

function effectFor(reward) {
  if (reward.tier) return reward.tier;
  if (reward.art === 'bunny') return 'bunny';
  if (reward.art === 'pinwheel') return 'pinwheel';
  if (reward.art === 'plane') return 'plane';
  if (reward.art === 'glass') return 'glass';
  if (reward.art === 'map') return 'map';
  if (['rocket', 'fairy', 'bookmark', 'tent', 'compass'].includes(reward.art)) return reward.art;
  if (reward.art === 'book') return 'moon';
  if (['sprout', 'flower', 'sunflower', 'flowerbed'].includes(reward.art)) return 'garden';
  if (reward.art === 'mushroom') return 'mushroom';
  if (['bookshelf', 'house'].includes(reward.art)) return 'reading';
  if (reward.type === 'badge') return 'badge';
  return 'explore';
}

function rewardCharacter(reward) {
  return `<div class="reward-viewer-character">${rewardArt(reward.art, '', reward.icon)}</div>`;
}

export function rewardMotionArt(reward, { animated, className = '' }) {
  return `<div class="reward-motion-art ${className}${animated ? ' viewer-motion' : ''}" data-effect="${effectFor(reward)}" aria-hidden="true">${rewardCharacter(reward)}</div>`;
}

export function rewardViewer(reward) {
  const effect = effectFor(reward);
  return `<div class="reward-viewer" data-effect="${effect}">
    <div class="reward-viewer-scene">
      <div class="reward-viewer-rays" aria-hidden="true"></div>
      <div class="reward-viewer-sparkles" aria-hidden="true">${Array.from({ length: 8 }, (_, index) => `<i style="--i:${index}">✦</i>`).join('')}</div>
      <div class="reward-viewer-shadow" aria-hidden="true"></div>
      <div class="reward-viewer-stage" tabindex="0" role="slider" aria-label="旋转${reward.name}" aria-valuemin="-180" aria-valuemax="180" aria-valuenow="0" aria-valuetext="正面展示" aria-describedby="reward-viewer-hint">
        <div class="reward-viewer-orbit">${rewardCharacter(reward)}</div>
      </div>
    </div>
    <p id="reward-viewer-hint" class="reward-viewer-hint">拖动转一转，也可用左右方向键</p>
    <div class="reward-viewer-controls" role="group" aria-label="物品展示控制">
      <button type="button" data-viewer-action="left" aria-label="向左旋转">↶</button>
      <button type="button" data-viewer-action="reset">回正</button>
      <button type="button" data-viewer-action="right" aria-label="向右旋转">↷</button>
      <button type="button" data-viewer-action="motion" aria-pressed="true">暂停动效</button>
    </div>
    <span class="reward-viewer-motion-note" hidden></span>
  </div>`;
}

export function mountRewardViewer(container, { animations, once = false, autoplay = true }) {
  const viewer = container.querySelector('.reward-viewer');
  if (!viewer) return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const stage = viewer.querySelector('.reward-viewer-stage');
  const controls = viewer.querySelector('.reward-viewer-controls');
  const motionButton = viewer.querySelector('[data-viewer-action="motion"]');
  const note = viewer.querySelector('.reward-viewer-motion-note');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  viewer.classList.toggle('viewer-once', once);
  let rotation = 0;
  let tilt = 0;
  let playing = autoplay;
  let finished = once && !autoplay;
  let drag = null;
  let touchControl = null;

  function updateRotation(value, nextTilt = tilt) {
    rotation = Math.max(-180, Math.min(180, value));
    tilt = Math.max(-20, Math.min(20, nextTilt));
    viewer.style.setProperty('--viewer-rotation', `${rotation}deg`);
    viewer.style.setProperty('--viewer-tilt', `${tilt}deg`);
    stage.setAttribute('aria-valuenow', String(Math.round(rotation)));
    stage.setAttribute('aria-valuetext', rotation ? `向${rotation > 0 ? '右' : '左'}旋转 ${Math.round(Math.abs(rotation))} 度` : '正面展示');
  }

  function updateMotion() {
    const allowed = animations && !reducedMotion.matches;
    const active = allowed && !finished;
    const starting = active && !viewer.classList.contains('viewer-motion');
    viewer.classList.toggle('viewer-motion', active);
    viewer.classList.toggle('viewer-paused', !playing || document.hidden);
    motionButton.disabled = !allowed;
    motionButton.setAttribute('aria-pressed', String(allowed && playing));
    motionButton.textContent = allowed ? playing ? '暂停动效' : '播放动效' : '动效已关闭';
    note.hidden = allowed;
    note.textContent = reducedMotion.matches ? '已跟随系统减少动态效果' : '可在学习设置中开启奖励动效';
    if (once && starting) {
      const cycles = viewer.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSAnimation);
      Promise.all(cycles.map(animation => animation.finished)).then(() => {
        if (controller.signal.aborted) return;
        finished = true;
        playing = false;
        updateMotion();
      }, () => {});
    }
  }

  function activateControl(control) {
    if (!control || control.disabled) return;
    const action = control.dataset.viewerAction;
    if (action === 'left') updateRotation(rotation - 30);
    if (action === 'right') updateRotation(rotation + 30);
    if (action === 'reset') updateRotation(0, 0);
    if (action === 'motion') {
      playing = !playing;
      if (playing) finished = false;
      updateMotion();
    }
  }

  controls.addEventListener('click', event => {
    if (event.pointerType === 'touch') return;
    activateControl(event.target.closest('[data-viewer-action]'));
  }, options);
  controls.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    const control = event.target.closest('[data-viewer-action]');
    if (control && !control.disabled) touchControl = { control, pointerId: event.pointerId, horizontal: event.clientX, vertical: event.clientY };
  }, options);
  controls.addEventListener('pointermove', event => {
    if (touchControl?.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - touchControl.horizontal, event.clientY - touchControl.vertical) > 12) touchControl = null;
  }, options);
  controls.addEventListener('pointerup', event => {
    if (touchControl?.pointerId !== event.pointerId) return;
    const control = touchControl.control;
    touchControl = null;
    const bounds = control.getBoundingClientRect();
    if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) activateControl(control);
  }, options);
  controls.addEventListener('pointercancel', () => { touchControl = null; }, options);
  controls.addEventListener('lostpointercapture', () => { touchControl = null; }, options);
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') updateRotation(rotation - 15);
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') updateRotation(rotation + 15);
    if (event.key === 'Home') updateRotation(0, 0);
    if (event.key === 'End') updateRotation(180, 0);
  }, options);
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { pointerId: event.pointerId, horizontal: event.clientX, vertical: event.clientY, rotation, tilt };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
    stage.focus({ preventScroll: true });
  }, options);
  stage.addEventListener('pointermove', event => {
    if (drag?.pointerId !== event.pointerId) return;
    updateRotation(drag.rotation + (event.clientX - drag.horizontal) * .8, drag.tilt - (event.clientY - drag.vertical) * .2);
  }, options);
  const endDrag = event => {
    if (drag?.pointerId !== event.pointerId) return;
    drag = null;
    stage.classList.remove('dragging');
  };
  stage.addEventListener('pointerup', endDrag, options);
  stage.addEventListener('pointercancel', endDrag, options);
  stage.addEventListener('lostpointercapture', endDrag, options);
  reducedMotion.addEventListener('change', updateMotion, options);
  document.addEventListener('visibilitychange', updateMotion, options);
  updateMotion();
  return () => controller.abort();
}
