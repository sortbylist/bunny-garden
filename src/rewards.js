import { basics, vocabulary } from './data.js';

export const rewardCatalog = [
  { id: 'hello-bunny', type: 'sticker', name: '出发小兔', art: 'bunny', description: '每一个新朋友，都是一次小小的出发。', metric: 'learned', target: 1, rule: '首次标记认识 1 个学习项目' },
  { id: 'little-sprout', type: 'sticker', name: '芽芽种子', art: 'sprout', description: '你认识的朋友，正在慢慢发芽。', metric: 'learned', target: 6, rule: '累计首次标记认识 6 个不同项目' },
  { id: 'curious-glass', type: 'sticker', name: '好奇放大镜', art: 'glass', description: '仔细看、认真听，你找到了答案。', metric: 'solved', target: 1, rule: '累计答对 1 道不同的题，重试答对也算' },
  { id: 'paper-plane', type: 'sticker', name: '知识纸飞机', art: 'plane', description: '带着新知识，再飞远一点点。', metric: 'solved', target: 10, rule: '累计答对 10 道不同的题' },
  { id: 'brave-mushroom', type: 'sticker', name: '勇气小蘑菇', art: 'mushroom', description: '愿意再试一次，就是很棒的勇气。', metric: 'reviewed', target: 1, rule: '在错题本中首次独立改正 1 道错题' },
  { id: 'rainbow-flower', type: 'sticker', name: '彩虹小花', art: 'flower', description: '一点点认识，开成了一朵花。', metric: 'learned', target: 20, rule: '累计首次标记认识 20 个不同项目' },
  { id: 'moon-bookmark', type: 'sticker', name: '月亮书签', art: 'book', description: '书签记得每一次认真学习的你。', metric: 'days', target: 3, rule: '累计 3 天完成有效练习，不要求连续' },
  { id: 'star-tent', type: 'sticker', name: '星光帐篷', art: 'tent', description: '给爱探索的自己，搭一个小营地。', metric: 'days', target: 7, rule: '累计 7 天完成有效练习，不要求连续' },
  { id: 'thoughtful', type: 'badge', name: '认真思考家', art: 'medal', description: '每一道题，都是思考留下的足迹。', metric: 'solved', target: 25, rule: '累计答对 25 道不同的题' },
  { id: 'try-again', type: 'badge', name: '勇敢再试家', art: 'medal', description: '把“还不会”，变成“再试试”。', metric: 'reviewed', target: 5, rule: '在错题本中首次独立改正 5 道不同错题' },
  { id: 'explorer', type: 'badge', name: '好奇探索家', art: 'compass', description: '用不同的方法，发现学习的乐趣。', metric: 'modes', target: 3, rule: '在 3 种不同玩法中完成有效练习' },
  { id: 'steady-grower', type: 'badge', name: '慢慢成长家', art: 'medal', description: '不用赶路，自己的节奏就很好。', metric: 'days', target: 7, rule: '累计 7 天完成有效练习，不要求连续' },
  { id: 'garden-sprout', type: 'decoration', name: '窗边小树苗', art: 'sprout', description: '给你的成长花园添一抹绿色。', metric: 'stars', target: 10, rule: '累计获得 10 颗星星' },
  { id: 'garden-flower', type: 'decoration', name: '晴天花盆', art: 'flower', description: '让花园开出一朵属于你的花。', metric: 'stars', target: 30, rule: '累计获得 30 颗星星' },
  { id: 'garden-pinwheel', type: 'decoration', name: '彩色小风车', art: 'pinwheel', description: '让好奇心，像风车一样转起来。', metric: 'stars', target: 60, rule: '累计获得 60 颗星星' },
  { id: 'garden-house', type: 'decoration', name: '小兔阅读屋', art: 'house', description: '一座装满新知识和好故事的小屋。', metric: 'stars', target: 100, rule: '累计获得 100 颗星星' },
];

export function emptyRewards() {
  return { version: 1, events: [], unlocks: {}, equipped: { sticker: null, badge: null, decoration: null } };
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function rewardStats(rewards) {
  const count = kind => rewards.events.filter(event => event.kind === kind).length;
  return { stars: rewards.events.reduce((sum, event) => sum + event.stars, 0), learned: count('learn'), solved: count('solve'), reviewed: count('review'), days: count('daily'), modes: count('mode') };
}

function unlockRewards(rewards, time) {
  const stats = rewardStats(rewards);
  const unlocked = [];
  for (const reward of rewardCatalog) {
    if (!rewards.unlocks[reward.id] && stats[reward.metric] >= reward.target) {
      rewards.unlocks[reward.id] = time;
      unlocked.push(reward.id);
    }
  }
  return unlocked;
}

export function initializeRewards(state, date = new Date()) {
  const existing = state.rewards;
  if (existing?.version === 1 && Array.isArray(existing.events) && existing.unlocks && typeof existing.unlocks === 'object') {
    const seen = new Set();
    const events = existing.events.filter(event => {
      if (!event || typeof event.id !== 'string' || seen.has(event.id) || !Number.isFinite(event.stars) || event.stars < 0) return false;
      seen.add(event.id);
      return true;
    });
    state.rewards = { ...emptyRewards(), ...existing, events, equipped: { ...emptyRewards().equipped, ...existing.equipped } };
  } else {
    state.rewards = emptyRewards();
    const items = [...basics, ...vocabulary];
    for (const id of new Set(state.known)) {
      const item = items.find(entry => entry.id === id);
      if (item) state.rewards.events.push({ id: `learn:${id}`, kind: 'learn', stars: 1, label: `以前认识的朋友：${item.text}`, time: date.getTime(), day: localDay(date), migrated: true });
    }
  }
  unlockRewards(state.rewards, date.getTime());
  for (const type of ['sticker', 'badge', 'decoration']) {
    const id = state.rewards.equipped[type];
    if (!rewardCatalog.some(reward => reward.id === id && reward.type === type && state.rewards.unlocks[id])) state.rewards.equipped[type] = null;
  }
  return state.rewards;
}

export function grantRewards(state, action, date = new Date()) {
  const rewards = state.rewards;
  const candidates = [];
  const day = localDay(date);
  if (action.type === 'recognize') candidates.push({ id: `learn:${action.item.id}`, kind: 'learn', stars: 1, label: `第一次认识：${action.item.text}` });
  if (action.type === 'answer') {
    candidates.push({ id: `solve:${action.question.id}`, kind: 'solve', stars: 1, label: `第一次答对：${action.question.display || action.question.prompt}` });
    if (action.reviewed) candidates.push({ id: `review:${action.question.id}`, kind: 'review', stars: 2, label: `独立改正错题：${action.question.display || action.question.prompt}` });
  }
  if (action.type === 'round') {
    const qualifies = action.mode === 'match' ? action.total >= 4 && action.answered === action.total : action.total >= 5 && action.answered >= 5;
    if (qualifies) {
      candidates.push({ id: `daily:${day}`, kind: 'daily', stars: 3, label: `今日完成有效练习：${action.name}` });
      candidates.push({ id: `mode:${action.mode}`, kind: 'mode', stars: 0, label: `探索了新玩法：${action.name}` });
    }
  }
  const earned = [];
  for (const event of candidates) {
    if (rewards.events.some(existing => existing.id === event.id)) continue;
    const entry = { ...event, time: date.getTime(), day };
    rewards.events.push(entry);
    earned.push(entry);
  }
  return { stars: earned.reduce((sum, event) => sum + event.stars, 0), unlocked: unlockRewards(rewards, date.getTime()), reasons: earned.filter(event => event.stars > 0).map(event => event.label) };
}

export function equipReward(rewards, id) {
  const reward = rewardCatalog.find(item => item.id === id);
  if (!reward || !rewards.unlocks[id]) return false;
  rewards.equipped[reward.type] = rewards.equipped[reward.type] === id ? null : id;
  return true;
}

export function normalizeNickname(value) {
  const name = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (!name || [...name].length > 12) return null;
  return name;
}
