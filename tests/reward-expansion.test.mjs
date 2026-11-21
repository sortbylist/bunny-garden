import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../src/engine.js';
import { rewardCatalog, initializeRewards, grantRewards, recordMastery, refreshRewards, rewardProgress, rewardStats, equipReward } from '../src/rewards.js';
import { rewardTopics, rewardStages, rewardSections, sectionProgress } from '../src/reward-curriculum.js';
import { rewardHelp } from '../src/reward-help.js';
import { subjects } from '../src/data.js';
import { phonicsModules } from '../src/phonics-data.js';
import { iconPaths } from '../src/icons.js';
import { rewardArt } from '../src/reward-art.js';

const date = new Date(2026, 10, 14, 12);
function fresh() { const state = defaultState(); initializeRewards(state, date); return state; }
function completeSection(rewards, section) {
  for (const id of section.learnIds) {
    if (!rewards.events.some(event => event.id === `learn:${id}`)) rewards.events.push({ id: `learn:${id}`, kind: 'learn', stars: 0, time: date.getTime() });
  }
  const questions = section.questionIds.slice(0, 5).map(id => ({ id }));
  recordMastery(rewards, section.topicId || rewardTopics.find(topic => topic.sections.includes(section)).id, questions, questions.map(() => ({ correct: true })), date.getTime(), section.id);
}

test('目录包含中间里程碑、三科主题与九套奖牌，标识唯一，摘要不超过100字', () => {
  assert.equal(new Set(rewardCatalog.map(reward => reward.id)).size, 100);
  assert.deepEqual(rewardCatalog.filter(reward => reward.id.startsWith('solved-')).map(reward => reward.target), [50, 75, 100, 150, 200, 250, 300]);
  assert.equal(rewardCatalog.filter(reward => reward.type === 'medal').length, 27);
  assert.equal(rewardStages.filter(stage => stage.subject === 'english').length, 5);
  assert.equal(rewardSections.size, 160);
  for (const help of Object.values(rewardHelp)) assert.ok([...help.summary].length <= 100);
});

test('词语和部首扩充同步登记学习确认、专项练习与阶段范围', () => {
  const words = rewardTopics.find(topic => topic.id === 'word-categories');
  assert.equal(words.sections.length, 12);
  for (const section of words.sections) {
    const count = ['people', 'animals', 'plants'].some(category => section.id.endsWith(`/${category}`)) ? 20 : 10;
    assert.equal(section.learnIds.length, count);
    assert.equal(section.questionIds.length, count * 3);
  }
  const radicals = rewardSections.get('hanzi-structure/radicals');
  assert.equal(radicals.learnIds.length, 30);
  assert.equal(radicals.questionIds.length, 210);
  assert.ok(rewardStages.find(stage => stage.id === 'chinese-1').topics.includes(words));
});

test('所有主题徽章复用学习入口图标，汉字结构用笔，英语模块支持独立图标', () => {
  for (const topic of rewardTopics) {
    const subject = subjects.find(item => item.id === topic.subject);
    const expected = topic.phonics
      ? phonicsModules.find(module => module.id === topic.id).icon || subject.features[0].icon
      : subject.features.find(feature => feature.id === topic.id).icon;
    const reward = rewardCatalog.find(item => item.topicId === topic.id);
    assert.equal(reward.icon, expected, topic.name);
    assert.ok(rewardArt(reward.art, '', reward.icon).includes(iconPaths(expected)), topic.name);
  }
  assert.equal(rewardCatalog.find(item => item.topicId === 'hanzi-structure').icon, 'pen');
});

test('后加90题徽章追溯100题历史，只补发一次且不增加星星', context => {
  const state = fresh();
  for (let index = 0; index < 100; index++) grantRewards(state, { type: 'answer', question: { id: `historical-${index}` } }, date);
  const stars = rewardStats(state.rewards).stars;
  const lateReward = { id: 'test-late-90', type: 'badge', name: '后来新增', metric: 'solved', target: 90 };
  rewardCatalog.push(lateReward);
  context.after(() => rewardCatalog.splice(rewardCatalog.indexOf(lateReward), 1));
  initializeRewards(state, date);
  assert.ok(state.rewards.unlocks[lateReward.id]);
  assert.equal(state.rewards.unlockDetails[lateReward.id].retroactive, true);
  initializeRewards(state, date);
  assert.equal(state.rewards.pending.filter(id => id === lateReward.id).length, 1);
  assert.equal(rewardStats(state.rewards).stars, stars);
});

test('小节必须同时学习确认和独立80%，重试正确不能覆盖首次失败，轮次不能拼接', () => {
  const { rewards } = fresh();
  const section = rewardSections.get('math-numbers/read-write') || [...rewardSections.values()].find(item => item.subject === 'math');
  const questions = section.questionIds.slice(0, 5).map(id => ({ id }));
  recordMastery(rewards, section.topicId, questions, questions.map((question, index) => ({ correct: index < 4 })));
  assert.equal(sectionProgress(rewards, section).passed, true);
  assert.equal(sectionProgress(rewards, section).complete, false);
  completeSection(rewards, section);
  assert.equal(sectionProgress(rewards, section).complete, true);
  delete rewards.mastery[section.id];
  for (let attempt = 0; attempt < 2; attempt++) recordMastery(rewards, section.topicId, questions, questions.map((question, index) => ({ correct: (index + attempt) % 2 === 0 })));
  assert.equal(sectionProgress(rewards, section).passed, false);
  recordMastery(rewards, section.topicId, questions.slice(0, 4), questions.slice(0, 4).map(() => ({ correct: true })));
  assert.equal(sectionProgress(rewards, section).passed, false);
});

test('少题向上取整、重复题和损坏证据不能达标', context => {
  const { rewards } = fresh();
  const topic = rewardTopics.find(item => item.subject === 'math');
  const section = { id: 'test-short', learnIds: ['short-learn'], questionIds: ['short-1', 'short-2', 'short-3'] };
  topic.sections.push(section);
  context.after(() => topic.sections.pop());
  const questions = section.questionIds.map(id => ({ id }));
  recordMastery(rewards, topic.id, questions, [{ correct: true }, { correct: true }, { correct: false }]);
  assert.equal(sectionProgress(rewards, section).passed, false);
  recordMastery(rewards, topic.id, questions, questions.map(() => ({ correct: true })));
  assert.equal(sectionProgress(rewards, section).passed, true);
  rewards.mastery[section.id] = { questionIds: 'broken', correctIds: [] };
  assert.equal(sectionProgress(rewards, section).passed, false);
  delete rewards.mastery[section.id];
  recordMastery(rewards, topic.id, [questions[0], questions[0], questions[1]], questions.map(() => ({ correct: true })));
  assert.equal(sectionProgress(rewards, section).passed, false);
});

test('阶段按小节数取整发铜银金，扩课统一当前分母，已有奖牌保留', context => {
  const { rewards } = fresh();
  const stage = rewardStages.find(item => item.id === 'math-1');
  const sections = stage.topics.flatMap(topic => topic.sections);
  const bronze = rewardCatalog.find(reward => reward.id === 'stage-math-1-bronze');
  const silver = rewardCatalog.find(reward => reward.id === 'stage-math-1-silver');
  assert.equal(rewardProgress(rewards, bronze).target, 11);
  for (const section of sections.slice(0, 11)) completeSection(rewards, section);
  refreshRewards(rewards);
  assert.ok(rewards.unlocks[bronze.id]);
  assert.equal(rewards.unlocks[silver.id], undefined);
  for (const section of sections.slice(11, 22)) completeSection(rewards, section);
  refreshRewards(rewards);
  assert.ok(rewards.unlocks[silver.id]);
  for (const section of sections.slice(22)) completeSection(rewards, section);
  refreshRewards(rewards);
  assert.ok(rewards.unlocks['stage-math-1-gold']);
  assert.ok(rewards.unlocks['garden-golden-flower']);
  assert.equal(equipReward(rewards, 'stage-math-1-gold'), true);
  stage.topics[0].sections.push({ id: 'future-section', learnIds: ['new-learning'], questionIds: ['new-question'] });
  context.after(() => stage.topics[0].sections.pop());
  assert.equal(rewardProgress(rewards, bronze).target, 11);
  assert.equal(rewardProgress(rewards, rewardCatalog.find(reward => reward.id === 'stage-math-1-gold')).target, 33);
  refreshRewards(rewards);
  assert.ok(rewards.unlocks['stage-math-1-gold']);
});

test('三色花圃按三科主题徽章计算，不以答题徽章或奖牌替代', () => {
  const { rewards } = fresh();
  rewards.unlocks['solved-100'] = date.getTime();
  rewards.unlocks['stage-english-1-gold'] = date.getTime();
  refreshRewards(rewards);
  assert.equal(rewards.unlocks['garden-three-colors'], undefined);
  for (const subject of ['chinese', 'math', 'english']) {
    const topic = rewardTopics.find(item => item.subject === subject);
    rewards.unlocks[`topic-${topic.id}`] = date.getTime();
  }
  refreshRewards(rewards);
  assert.ok(rewards.unlocks['garden-three-colors']);
});

test('旧英语认识和可证明答对记录补发，重复初始化不重复发星，缺失证据不虚构', () => {
  const state = fresh();
  const english = { known: ['word-map'], sessions: { old: { ids: ['rule-1', 'rule-2'], responses: { 'rule-1': { answer: 'zed' } }, views: {} } } };
  initializeRewards(state, date, english);
  assert.equal(rewardStats(state.rewards).learned, 1);
  assert.equal(rewardStats(state.rewards).solved, 1);
  assert.equal(Object.keys(state.rewards.mastery).length, 0);
  initializeRewards(state, date, english);
  assert.equal(rewardStats(state.rewards).stars, 2);
});
