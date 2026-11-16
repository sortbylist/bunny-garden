import test from 'node:test';
import assert from 'node:assert/strict';
import { hanziCategories, hanziLessons, hanziQuestions, strokeCharacters, radicals } from '../src/hanzi-data.js';
import { createHanziState, normalizeHanziState, startHanziRound, answerHanzi, advanceHanziRound } from '../src/hanzi-engine.js';
import { defaultState, loadState } from '../src/engine.js';
import { initializeRewards, grantRewards, rewardStats } from '../src/rewards.js';

test('六小节覆盖规划范围，学习项目和题目唯一且每题只有一个答案', () => {
  assert.deepEqual(hanziCategories.map(item => item.id), ['strokes', 'order', 'radicals', 'single', 'left-right', 'top-bottom']);
  assert.equal(hanziLessons.length, 109);
  assert.equal(hanziQuestions.length, 358);
  assert.equal(new Set(hanziLessons.map(item => item.id)).size, hanziLessons.length);
  assert.equal(new Set(hanziQuestions.map(item => item.id)).size, hanziQuestions.length);
  for (const category of hanziCategories) {
    assert.ok(hanziLessons.some(item => item.category === category.id));
    assert.ok(hanziQuestions.filter(item => item.category === category.id).length >= 5);
  }
  for (const question of hanziQuestions) {
    assert.equal(question.options.filter(option => option === question.answer).length, 1);
    assert.equal(new Set(question.options).size, question.options.length);
    assert.ok(question.explanation);
  }
});

test('三十种偏旁部首各有六个不重复例字，每个例字都有对应练习', () => {
  assert.equal(radicals.length, 30);
  for (const radical of radicals) {
    assert.equal(radical.examples.length, 6, radical.text);
    assert.equal(new Set(radical.examples).size, 6, radical.text);
    assert.ok(radical.name && radical.tip && radical.word);
    for (const text of radical.examples) {
      assert.ok(hanziQuestions.some(question => question.category === 'radicals' && question.display === text && question.answer === radical.text), text);
    }
  }
});

test('逐笔示例包含横折单笔、封口顺序及木字旁变点', () => {
  const expected = {
    三: ['横', '横', '横'], 十: ['横', '竖'], 人: ['撇', '捺'], 大: ['横', '撇', '捺'],
    小: ['竖钩', '撇', '点'], 木: ['横', '竖', '撇', '捺'], 口: ['竖', '横折', '横'],
    日: ['竖', '横折', '横', '横'], 林: ['横', '竖', '撇', '点', '横', '竖', '撇', '捺'],
    土: ['横', '竖', '横'], 王: ['横', '横', '竖', '横'], 上: ['竖', '横', '横'],
    下: ['横', '竖', '点'], 天: ['横', '横', '撇', '捺'], 禾: ['撇', '横', '竖', '撇', '捺'],
    山: ['竖', '竖折', '竖'], 田: ['竖', '横折', '横', '竖', '横'], 目: ['竖', '横折', '横', '横', '横'],
    又: ['横撇', '捺'],
  };
  for (const item of strokeCharacters) {
    assert.deepEqual(item.strokes.map(stroke => stroke.name), expected[item.text]);
    for (const stroke of item.strokes) assert.match(stroke.path, /^M\d+ \d+/);
  }
});

test('无需完成前置课程，专项和综合练习不重复且综合覆盖全部小节', () => {
  for (const scope of ['all', ...hanziCategories.map(item => item.id)]) {
    const state = createHanziState();
    assert.equal(startHanziRound(state, scope), true);
    assert.equal(new Set(state.round.questions.map(item => item.id)).size, state.round.questions.length);
    if (scope === 'all') {
      assert.equal(state.round.questions.length, 10);
      assert.equal(new Set(state.round.questions.map(item => item.category)).size, 6);
    } else assert.ok(state.round.questions.every(item => item.category === scope));
  }
  const state = createHanziState();
  assert.equal(startHanziRound(state, 'review'), false);
  assert.equal(startHanziRound(state, 'invalid'), false);
  assert.equal(state.round, null);
});

test('答错重试保留首次结果，查看答案不清错题，独立复习才移出', () => {
  const state = createHanziState();
  startHanziRound(state, 'all');
  const question = state.round.questions[0];
  assert.equal(answerHanzi(state, 'invalid'), null);
  assert.equal(advanceHanziRound(state), null);
  const wrong = question.options.find(option => option !== question.answer);
  answerHanzi(state, wrong);
  const restored = normalizeHanziState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.round.selected, wrong);
  assert.deepEqual(restored.round.questions[0].options, question.options);
  assert.equal(answerHanzi(restored, question.answer).correct, true);
  assert.equal(restored.round.responses[0].correct, false);
  assert.deepEqual(restored.mistakes, [question.id]);
  assert.equal(answerHanzi(restored, question.answer), null);
  startHanziRound(restored, 'review');
  answerHanzi(restored, null);
  assert.deepEqual(restored.mistakes, [question.id]);
  assert.equal(restored.round.responses[0].skipped, true);
  const revealed = normalizeHanziState(JSON.parse(JSON.stringify(restored)));
  assert.equal(revealed.round.revealed, true);
  startHanziRound(revealed, 'review');
  assert.equal(answerHanzi(revealed, question.answer).reviewed, true);
  assert.deepEqual(revealed.mistakes, []);
  const history = advanceHanziRound(revealed);
  assert.equal(history.correct, 1);
  assert.equal(history.total, 1);
  assert.equal(advanceHanziRound(revealed), null);
  assert.equal(normalizeHanziState(JSON.parse(JSON.stringify(revealed))).round.finished, true);
});

test('旧记录新增默认汉字状态，损坏汉字数据局部降级且不丢拼音记录', () => {
  const root = defaultState();
  root.known = ['single-a'];
  delete root.hanzi;
  const loaded = loadState({ getItem: () => JSON.stringify(root) });
  assert.deepEqual(normalizeHanziState(loaded.state.hanzi), createHanziState());
  assert.deepEqual(loaded.state.known, ['single-a']);
  const state = normalizeHanziState({
    category: 'order', lessonId: 'order-日', strokeStep: 999, view: 'quiz',
    known: ['order-日', 'bad', 'order-日'], mistakes: ['bad'],
    round: { scope: 'all', questions: [{ id: 'bad' }], index: -1, responses: {} },
  });
  assert.equal(state.strokeStep, 4);
  assert.deepEqual(state.known, ['order-日']);
  assert.equal(state.round, null);
  assert.equal(state.view, 'learn');
  assert.deepEqual(normalizeHanziState(null), createHanziState());
});

test('汉字题奖励跨刷新去重，与已有拼音奖励共存', () => {
  const root = defaultState();
  initializeRewards(root);
  grantRewards(root, { type: 'recognize', item: { id: 'single-a', text: 'a' } });
  const action = { type: 'answer', question: hanziQuestions[0] };
  assert.equal(grantRewards(root, action).stars, 1);
  const restored = JSON.parse(JSON.stringify(root));
  initializeRewards(restored);
  assert.equal(grantRewards(restored, action).stars, 0);
  assert.equal(grantRewards(restored, { ...action, reviewed: true }).stars, 2);
  assert.equal(grantRewards(restored, { ...action, reviewed: true }).stars, 0);
  assert.equal(rewardStats(restored.rewards).stars, 4);
});
