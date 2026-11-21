import test from 'node:test';
import assert from 'node:assert/strict';
import { basics, modes, playModes, modeSections } from '../src/data.js';
import { defaultState, loadState } from '../src/engine.js';
import { encodeLearningData } from '../src/learning-data.js';
import { initializeRewards, grantRewards, rewardStats, equipReward, normalizeNickname, localDay } from '../src/rewards.js';

const firstDate = () => new Date(2026, 10, 8, 12);
function fresh() { const state = defaultState(); initializeRewards(state, firstDate()); return state; }

test('12 种玩法分三组，内容分类不与玩法并列，复习工具有独立入口', () => {
  assert.equal(playModes.length, 12);
  assert.deepEqual(modeSections.map(section => playModes.filter(mode => mode.group === section).length), [3, 6, 3]);
  assert.equal(modes.some(mode => ['initials', 'finals', 'whole'].includes(mode.id)), false);
  assert.equal(playModes.some(mode => ['mistakes', 'favorites'].includes(mode.id)), false);
});

test('认读和题目奖励去重，重新标记、切换玩法、重载不重复发星', () => {
  const state = fresh();
  const action = { type: 'recognize', item: basics[0] };
  const earned = grantRewards(state, action, firstDate());
  assert.equal(earned.stars, 1);
  assert.deepEqual(earned.unlocked, ['hello-bunny']);
  assert.equal(grantRewards(state, action, firstDate()).stars, 0);
  const restored = loadState({ getItem: () => JSON.stringify(encodeLearningData(state)) }).state;
  initializeRewards(restored, firstDate());
  assert.equal(grantRewards(restored, action, firstDate()).stars, 0);
  assert.equal(grantRewards(restored, { type: 'answer', question: { id: 'rule:r1', prompt: '水' } }, firstDate()).stars, 1);
  assert.equal(grantRewards(restored, { type: 'answer', question: { id: 'rule:r1', prompt: '水' } }, firstDate()).stars, 0);
  assert.equal(rewardStats(restored.rewards).stars, 2);
});

test('错题独立改正只奖励一次，可与首次答对叠加', () => {
  const state = fresh();
  const question = { id: 'rule:r2', prompt: '九' };
  const first = grantRewards(state, { type: 'answer', question, reviewed: false }, firstDate());
  assert.equal(first.stars, 1);
  const corrected = grantRewards(state, { type: 'answer', question, reviewed: true }, firstDate());
  assert.equal(corrected.stars, 2);
  assert.ok(corrected.unlocked.includes('brave-mushroom'));
  assert.equal(grantRewards(state, { type: 'answer', question, reviewed: true }, firstDate()).stars, 0);
  assert.equal(grantRewards(state, { type: 'answer', question: { id: 'new' }, reviewed: true }, firstDate()).stars, 3);
});

test('有效练习每天一次，无需连续学习，跳过或不足题量无每日奖励', () => {
  const state = fresh();
  assert.equal(grantRewards(state, { type: 'round', mode: 'rules', name: '标调', total: 10, answered: 0 }, firstDate()).stars, 0);
  assert.equal(grantRewards(state, { type: 'round', mode: 'mistakes', name: '错题', total: 3, answered: 3 }, firstDate()).stars, 0);
  const action = { type: 'round', mode: 'rules', name: '标调', total: 5, answered: 5 };
  assert.equal(grantRewards(state, action, firstDate()).stars, 3);
  assert.equal(grantRewards(state, action, firstDate()).stars, 0);
  assert.equal(grantRewards(state, { type: 'round', mode: 'match', name: '配对', total: 4, answered: 4 }, firstDate()).stars, 0);
  assert.equal(grantRewards(state, action, new Date(2026, 10, 10)).stars, 3);
  const third = grantRewards(state, action, new Date(2026, 10, 15));
  assert.equal(third.stars, 3);
  assert.ok(third.unlocked.includes('moon-bookmark'));
  assert.equal(rewardStats(state.rewards).days, 3);
  assert.equal(localDay(new Date(2026, 0, 2)), '2026-01-02');
});

test('贴纸、徽章和摆件按真实进度解锁，未解锁不能展示，展示不花星', () => {
  const state = fresh();
  assert.equal(equipReward(state.rewards, 'garden-house'), false);
  for (let index = 0; index < 10; index++) grantRewards(state, { type: 'recognize', item: basics[index] }, firstDate());
  assert.ok(state.rewards.unlocks['little-sprout']);
  assert.ok(state.rewards.unlocks['garden-sprout']);
  assert.equal(equipReward(state.rewards, 'garden-sprout'), true);
  assert.equal(state.rewards.equipped.decoration, 'garden-sprout');
  assert.equal(rewardStats(state.rewards).stars, 10);
  assert.equal(equipReward(state.rewards, 'garden-sprout'), true);
  assert.equal(state.rewards.equipped.decoration, null);
  for (let index = 0; index < 25; index++) grantRewards(state, { type: 'answer', question: { id: `question-${index}` } }, firstDate());
  assert.ok(state.rewards.unlocks['thoughtful']);
  for (const mode of ['listen', 'match', 'rules']) grantRewards(state, { type: 'round', mode, total: 5, answered: 5, name: mode }, firstDate());
  assert.ok(state.rewards.unlocks.explorer);
});

test('初始化奖励时，对尚未入账的认识记录只补发一次', () => {
  const old = defaultState();
  delete old.rewards;
  old.known = ['single-a', 'single-a', 'single-o', 'unknown'];
  old.history = [{ total: 10, correct: 10 }];
  initializeRewards(old, firstDate());
  assert.equal(rewardStats(old.rewards).stars, 2);
  assert.ok(old.rewards.events.every(event => event.migrated));
  initializeRewards(old, firstDate());
  assert.equal(rewardStats(old.rewards).stars, 2);
});

test('昵称去空白、支持中文、拒绝空昵称及过长昵称', () => {
  assert.equal(normalizeNickname('  小兔  '), '小兔');
  assert.equal(normalizeNickname('星星\u0000同学'), '星星同学');
  assert.equal(normalizeNickname(''), null);
  assert.equal(normalizeNickname(' '.repeat(10)), null);
  assert.equal(normalizeNickname('你'.repeat(13)), null);
  assert.equal(normalizeNickname('🐰'.repeat(12)), '🐰'.repeat(12));
});
