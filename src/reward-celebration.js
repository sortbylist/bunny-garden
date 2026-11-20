import { rewardCatalog } from './rewards.js';
import { rewardMotionArt } from './reward-viewer.js';

const noticeDuration = 20_000;
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function createRewardCelebration({ getState, persist, mainDialog, myTarget, playSound }) {
  let notice = null;
  let timer = null;
  let closing = false;
  let replay = null;
  let starsOnly = null;
  const starAmounts = new Map();
  const paused = () => document.hidden || mainDialog.open && ['collection-dialog', 'reward-help-dialog', 'reward-rules-dialog', 'reward-detail-dialog'].some(name => mainDialog.classList.contains(name));
  const motion = () => getState().settings.animations && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clear() {
    clearTimeout(timer);
    if (closing) return;
    if (notice?.tagName === 'DIALOG') notice.close();
    notice?.remove();
    notice = null;
    replay = null;
  }

  function resume() {
    queueMicrotask(pump);
  }

  function pump() {
    if (notice || closing || !replay && paused()) return;
    const state = getState();
    const pending = state.rewards.pending;
    const identifier = replay || pending[0];
    const reward = rewardCatalog.find(item => item.id === identifier);
    if (!reward && !starsOnly) return;
    const gold = reward?.tier === 'gold';
    const animated = motion();
    const art = reward ? rewardMotionArt(reward, { animated, className: gold ? 'gold-prize' : '' }) : '<span class="reward-star-symbol" aria-hidden="true">★</span>';
    notice = document.createElement(gold ? 'dialog' : 'aside');
    notice.dataset.rewardNotice = identifier || 'stars';
    notice.dataset.replay = replay ? 'true' : 'false';
    const extra = reward ? starAmounts.get(identifier) || 0 : starsOnly;
    const retroactive = reward && state.rewards.unlockDetails[identifier]?.retroactive;
    const count = pending.length > 1 ? `还有 ${pending.length - 1} 件收获等着你` : '每一步成长，都值得庆祝';
    if (gold) {
      notice.className = `gold-celebration ${animated ? 'gold-motion' : ''}`;
      notice.setAttribute('aria-labelledby', 'gold-title');
      notice.innerHTML = `<div class="gold-rays" aria-hidden="true"></div><div class="gold-sparkles" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--i:${index}">✦</i>`).join('')}</div><button type="button" data-action="dismiss-reward" class="gold-close" aria-label="收下金牌并关闭">×</button><div class="gold-heading">属于你的闪亮时刻</div>${art}<h2 id="gold-title">${escape(reward.name)}</h2><p>${escape(reward.description)}</p><p class="gold-rule">${escape(reward.rule)}</p>${retroactive ? '<small>根据历史学习记录补发</small>' : ''}${extra ? `<p>同时收获 ${extra} 颗成长星</p>` : ''}<button type="button" data-action="dismiss-reward" class="gold-accept">太棒啦，收下金牌</button><small>${count}</small>`;
      document.body.append(notice);
      notice.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
      notice.showModal();
      notice.querySelector('.gold-accept').focus();
      if (!replay) playSound();
    } else {
      notice.className = `reward-notice ${animated ? 'animate-reward' : ''}`;
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      const viewReward = reward ? ` data-id="${reward.id}"` : '';
      notice.innerHTML = `<div class="reward-confetti" aria-hidden="true">${Array.from({ length: 9 }, (_, index) => `<i style="--i:${index}"></i>`).join('')}</div>${art}<div class="reward-notice-copy"><strong>${reward ? `解锁了${escape(reward.name)}` : `收获 ${extra} 颗成长星`}</strong><p>${extra && reward ? `+${extra} 星 · ` : ''}${reward ? escape(reward.rule) : '认真尝试，值得庆祝'}</p><small>${retroactive ? '根据历史学习记录补发 · ' : ''}${reward ? count : ''}</small></div><button type="button" data-action="reward-notice-view"${viewReward} class="reward-notice-view">查看</button><button type="button" data-action="dismiss-reward" class="reward-notice-ack">知道了</button><button type="button" data-action="dismiss-reward" class="reward-notice-close" aria-label="收起奖励提示">×</button>`;
      (mainDialog.open ? mainDialog : document.body).append(notice);
    }
    timer = setTimeout(() => dismiss({ animate: false }), noticeDuration);
  }

  async function dismiss({ animate = true } = {}) {
    if (!notice || closing) return;
    closing = true;
    clearTimeout(timer);
    const current = notice;
    const identifier = current.dataset.rewardNotice;
    if (animate && current.classList.contains('gold-celebration') && motion()) {
      const prize = current.querySelector('.gold-prize');
      const target = myTarget()?.getBoundingClientRect();
      const origin = prize.getBoundingClientRect();
      const horizontal = target ? target.left + target.width / 2 - origin.left - origin.width / 2 : 0;
      const vertical = target ? target.top + target.height / 2 - origin.top - origin.height / 2 : -200;
      await prize.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${horizontal}px, ${vertical}px) scale(.08)`, opacity: 0 },
      ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});
    }
    if (current.dataset.replay === 'true') replay = null;
    else if (identifier === 'stars') starsOnly = null;
    else {
      const rewards = getState().rewards;
      rewards.pending = rewards.pending.filter(id => id !== identifier);
      starAmounts.delete(identifier);
      persist();
    }
    if (current.tagName === 'DIALOG') current.close();
    current.remove();
    notice = null;
    closing = false;
    timer = setTimeout(pump, 250);
  }

  function celebrate(result) {
    if (!result || !result.stars && !result.unlocked?.length) return;
    if (result.replay) {
      clear();
      replay = result.unlocked[0];
    } else if (result.unlocked?.length) {
      starAmounts.set(result.unlocked[0], result.stars || 0);
      starsOnly = null;
    } else if (!getState().rewards.pending.length && !notice) starsOnly = result.stars;
    persist();
    pump();
  }

  function reset() {
    clear();
    starsOnly = null;
    starAmounts.clear();
  }

  return { clear, resume, celebrate, dismiss, reset };
}
