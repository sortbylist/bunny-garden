import { basics, vocabulary } from './data.js';
import { rewardTopics, rewardStages, phonicsRewardModules, curriculumProgress } from './reward-curriculum.js';
import { phonicsQuestionById } from './phonics-engine.js';
import { phonicsWordById } from './phonics-data.js';

const topicNames = { chinese: '语文主题', math: '数学主题', english: '英语主题或自然拼读模块' };
const badgeTopics = [...rewardTopics.filter(topic => !topic.phonics), ...phonicsRewardModules];

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
  ...[
    [50, '思考小能手'], [75, '解题小探险家'], [100, '百题小达人'], [150, '知识小航海家'],
    [200, '双百小能手'], [250, '智慧小探索家'], [300, '思考小领航员'],
  ].map(([target, name]) => ({ id: `solved-${target}`, type: 'badge', name, art: `thinking-${target}`, metric: 'solved', target, rule: `累计答对 ${target} 道不同的题。`, description: '每一道认真想过的题，都是前进的脚印。' })),
  ...[
    [1, '出发小脚印', 'footprints'], [3, '知识小背包', 'backpack'], [6, '探索小地图', 'map'],
  ].map(([target, name, art]) => ({ id: `sections-${target}`, type: 'sticker', name, art, metric: 'sections', target, rule: `${target === 1 ? '首次完成一个小节' : `累计完成 ${target} 个不同小节`}。`, description: '一步一步，走出属于你的学习小路。' })),
  ...[
    ['chinese', '故事小书签', 'bookmark'], ['math', '数字小火箭', 'rocket'], ['english', '字母小精灵', 'fairy'],
  ].map(([subject, name, art]) => ({ id: `first-topic-${subject}`, type: 'sticker', name, art, subject, metric: `topics-${subject}`, target: 1, rule: `获得首枚${topicNames[subject]}徽章。`, description: '一个新主题，一份值得珍藏的发现。' })),
  ...badgeTopics.map(topic => ({
    id: `topic-${topic.id}`, type: 'badge', name: `${topic.name}小能手`, art: `topic-${topic.subject}`,
    topicId: topic.id, subject: topic.subject, icon: topic.icon, metric: 'topic', target: 1,
    rule: `完成“${topic.name}”${phonicsRewardModules.includes(topic) ? '模块' : '主题'}的全部小节。`,
    description: '把一点一滴的练习，连成一份完整的收获。',
  })),
  ...rewardStages.flatMap(stage => [
    ['bronze', '铜牌', 1], ['silver', '银牌', 2], ['gold', '金牌', 3],
  ].map(([tier, label, portion]) => ({
    id: `stage-${stage.id}-${tier}`, type: 'medal', name: `${stage.name}${label}`, art: `medal-${tier}`,
    stageId: stage.id, tier, portion, metric: 'stage',
    rule: `完成${stage.label}${portion === 3 ? '全部小节' : `至少${portion === 1 ? '三分之一' : '三分之二'}的小节`}。`,
    description: `${stage.name}这一站，你又向前走了一大步！`, help: 'stage',
  }))),
  ...[
    ['chinese', 3, '书香小书架', 'bookshelf'], ['math', 2, '数字积木塔', 'blocks'], ['english', 2, '字母小路牌', 'signpost'],
  ].map(([subject, target, name, art]) => ({
    id: `garden-topics-${subject}`, type: 'decoration', name, art, metric: `topics-${subject}`, target,
    rule: `获得 ${target} 枚不同的${topicNames[subject]}徽章。`,
    description: '让学习的收获，在花园里留下小小的纪念。',
  })),
  { id: 'garden-golden-flower', type: 'decoration', name: '金色向日葵', art: 'sunflower', metric: 'gold', target: 1, rule: '获得首枚阶段金牌。', description: '向着阳光，记住这一刻的成长。' },
  { id: 'garden-three-colors', type: 'decoration', name: '三色花圃', art: 'flowerbed', metric: 'subjects', target: 3, help: 'three-subjects', rule: '语文、数学、英语各获得至少 1 枚主题或模块徽章。', description: '三种好奇心，开成三种颜色的花。' },
];

export function emptyRewards() {
  return { version: 1, events: [], unlocks: {}, mastery: {}, pending: [], unlockDetails: {}, equipped: { sticker: null, badge: null, medal: null, decoration: null } };
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function rewardStats(rewards) {
  const count = kind => rewards.events.filter(event => event.kind === kind).length;
  return { stars: rewards.events.reduce((sum, event) => sum + event.stars, 0), learned: count('learn'), solved: count('solve'), reviewed: count('review'), days: count('daily'), modes: count('mode') };
}

export function rewardProgress(rewards, reward, progress = curriculumProgress(rewards), stats = rewardStats(rewards)) {
  if (reward.metric === 'sections') return { value: progress.completed, target: reward.target };
  if (reward.metric === 'topic') {
    const topic = badgeTopics.find(item => item.id === reward.topicId);
    return { value: topic.sections.filter(section => progress.sections.get(section.id).complete).length, target: topic.sections.length };
  }
  if (reward.metric === 'stage') {
    const sections = rewardStages.find(stage => stage.id === reward.stageId).topics.flatMap(topic => topic.sections);
    return { value: sections.filter(section => progress.sections.get(section.id).complete).length, target: Math.ceil(sections.length * reward.portion / 3) };
  }
  const topicCount = subject => badgeTopics.filter(topic => topic.subject === subject && rewards.unlocks[`topic-${topic.id}`]).length;
  if (reward.metric.startsWith('topics-')) return { value: topicCount(reward.metric.slice(7)), target: reward.target };
  if (reward.metric === 'gold') return { value: rewardCatalog.filter(item => item.tier === 'gold' && rewards.unlocks[item.id]).length, target: 1 };
  if (reward.metric === 'subjects') return { value: ['chinese', 'math', 'english'].filter(subject => topicCount(subject) > 0).length, target: 3 };
  return { value: stats[reward.metric] || 0, target: reward.target };
}

export function refreshRewards(rewards, time = Date.now(), retroactive = false) {
  const stats = rewardStats(rewards);
  const progress = curriculumProgress(rewards);
  const unlocked = [];
  for (let pass = 0; pass < 2; pass++) {
    for (const reward of rewardCatalog) {
      const condition = rewardProgress(rewards, reward, progress, stats);
      if (!rewards.unlocks[reward.id] && condition.target > 0 && condition.value >= condition.target) {
        rewards.unlocks[reward.id] = time;
        rewards.unlockDetails[reward.id] = { retroactive };
        if (!rewards.pending.includes(reward.id)) rewards.pending.push(reward.id);
        unlocked.push(reward.id);
      }
    }
  }
  return unlocked;
}

export function initializeRewards(state, date = new Date(), english = state.phonics) {
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
  const rewards = state.rewards;
  rewards.mastery = rewards.mastery && typeof rewards.mastery === 'object' ? rewards.mastery : {};
  rewards.unlockDetails = rewards.unlockDetails && typeof rewards.unlockDetails === 'object' ? rewards.unlockDetails : {};
  rewards.pending = [...new Set(Array.isArray(rewards.pending) ? rewards.pending : [])].filter(id => rewardCatalog.some(reward => reward.id === id) && rewards.unlocks[id]);
  const confirmations = [
    ...Object.entries(state.topics || {}).flatMap(([, topic]) => topic.known || []),
    ...(state.hanzi?.known || []).map(id => `hanzi:${id}`),
    ...(english?.known || []).map(id => `english:${id}`),
  ];
  const knownIds = new Set(rewards.events.map(event => event.id));
  for (const id of confirmations) {
    if (!knownIds.has(`learn:${id}`)) {
      rewards.events.push({ id: `learn:${id}`, kind: 'learn', stars: id.startsWith('english:') ? 1 : 0, label: `以前确认的学习项目：${phonicsWordById.get(id.replace(/^english:/, ''))?.text || id}`, time: date.getTime(), day: localDay(date), migrated: true });
      knownIds.add(`learn:${id}`);
    }
  }
  for (const [topicId, topic] of Object.entries(state.topics || {})) {
    if (topic.round?.finished) recordMastery(rewards, topicId, topic.round.questions, topic.round.responses, date.getTime());
  }
  if (state.hanzi?.round?.finished) recordMastery(rewards, 'hanzi-structure', state.hanzi.round.questions, state.hanzi.round.responses, date.getTime());
  for (const [sessionKey, round] of Object.entries(english?.sessions || {})) {
    for (const id of round.ids || []) {
      const question = phonicsQuestionById.get(id);
      const response = round.responses?.[id];
      const view = round.views?.[id];
      if (question && (response?.answer === question.answer || view?.answer === question.answer) && !knownIds.has(`solve:english:${id}`)) {
        rewards.events.push({ id: `solve:english:${id}`, kind: 'solve', stars: 1, label: `以前答对的英语题：${question.display || question.prompt}`, time: date.getTime(), day: localDay(date), migrated: true });
        knownIds.add(`solve:english:${id}`);
      }
    }
    if (round.finished) {
      const lessonId = sessionKey.split(':')[2];
      const sectionId = `english/${lessonId}`;
      const topic = rewardTopics.find(entry => entry.subject === 'english' && entry.sections.some(section => section.id === sectionId));
      if (topic) recordMastery(rewards, topic.id, round.ids.map(id => ({ id: `english:${id}` })), round.ids.map(id => round.responses?.[id]), date.getTime(), sectionId);
    }
  }
  refreshRewards(rewards, date.getTime(), true);
  for (const type of ['sticker', 'badge', 'medal', 'decoration']) {
    const id = state.rewards.equipped[type];
    if (!rewardCatalog.some(reward => reward.id === id && reward.type === type && state.rewards.unlocks[id])) state.rewards.equipped[type] = null;
  }
  return state.rewards;
}

export function recordMastery(rewards, topicId, questions, responses, time = Date.now(), sectionId = null) {
  const topic = rewardTopics.find(item => item.id === topicId);
  if (!topic || !Array.isArray(questions) || !Array.isArray(responses) || !questions.length || questions.length !== responses.length || responses.some(response => !response)) return;
  for (const section of topic.sections.filter(item => !sectionId || item.id === sectionId)) {
    const entries = questions.map((question, index) => ({ id: question.id, response: responses[index] })).filter(entry => section.questionIds.includes(entry.id));
    const required = Math.min(5, section.questionIds.length);
    if (!required || entries.length < required || new Set(entries.map(entry => entry.id)).size !== entries.length) continue;
    const correctIds = entries.filter(entry => entry.response.correct && !entry.response.skipped).map(entry => entry.id);
    if (correctIds.length < Math.ceil(entries.length * 0.8)) continue;
    rewards.mastery[section.id] = { version: 1, time, questionIds: entries.map(entry => entry.id), correctIds };
  }
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
    if (action.questions && action.responses) recordMastery(rewards, action.topicId, action.questions, action.responses, date.getTime(), action.sectionId);
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
  return { stars: earned.reduce((sum, event) => sum + event.stars, 0), unlocked: refreshRewards(rewards, date.getTime()), reasons: earned.filter(event => event.stars > 0).map(event => event.label) };
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
