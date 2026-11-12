import test from 'node:test';
import assert from 'node:assert/strict';
import { mathTopics } from '../src/math-topics.js';
import { chineseTopics } from '../src/chinese-topics.js';
import { subjects } from '../src/data.js';
import { defaultState, loadState } from '../src/engine.js';
import { topicDefaults, normalizeTopic, startTopicRound, answerTopic, advanceTopic, updateTopicActivity } from '../src/chinese-engine.js';

function calculate(expression) {
  const tokens = expression.match(/\d+|[+−×÷()]/g);
  let position = 0;
  function number() {
    const token = tokens[position++];
    if (token !== '(') return Number(token);
    const value = sum();
    assert.equal(tokens[position++], ')');
    return value;
  }
  function product() {
    let value = number();
    while (['×', '÷'].includes(tokens[position])) {
      const operator = tokens[position++];
      const operand = number();
      assert.ok(operator !== '÷' || operand !== 0);
      value = operator === '×' ? value * operand : Math.floor(value / operand);
    }
    return value;
  }
  function sum() {
    let value = product();
    while (['+', '−'].includes(tokens[position])) {
      const operator = tokens[position++];
      const operand = product();
      value = operator === '+' ? value + operand : value - operand;
    }
    return value;
  }
  const value = sum();
  assert.equal(position, tokens.length);
  return value;
}

test('数学按阶段、主题、小分类组织，五主题覆盖全部三十二小分类', () => {
  assert.deepEqual(mathTopics.map(topic => topic.name), ['数的认识', '加减法', '乘法', '除法', '混合运算']);
  assert.deepEqual(mathTopics.map(topic => topic.categories.length), [5, 6, 8, 8, 5]);
  assert.equal(mathTopics.reduce((total, topic) => total + topic.lessons.length, 0), 64);
  assert.equal(mathTopics.reduce((total, topic) => total + topic.questions.length, 0), 384);
  assert.deepEqual(subjects.find(subject => subject.id === 'math').features.map(feature => feature.id), mathTopics.map(topic => topic.id));
  const identifiers = [];
  for (const topic of [...chineseTopics, ...mathTopics]) {
    identifiers.push(topic.id, ...topic.lessons.map(lesson => lesson.id), ...topic.questions.map(question => question.id));
  }
  assert.equal(new Set(identifiers).size, identifiers.length);
  for (const topic of mathTopics) {
    assert.equal(topic.stage, '第一阶段 · 数与运算');
    assert.equal(topic.subject, 'math');
    assert.ok(topic.id.startsWith('math-'));
    for (const category of topic.categories) {
      const lessons = topic.lessons.filter(lesson => lesson.category === category.id);
      assert.equal(lessons.length, 2);
      for (const lesson of lessons) assert.ok(lesson.body && lesson.examples.length && lesson.task && lesson.activity.sample);
      assert.equal(topic.questions.filter(question => question.category === category.id).length, 12);
    }
    for (const question of topic.questions) {
      assert.ok(question.prompt && question.explanation);
      assert.ok(topic.categories.some(category => category.id === question.category));
      assert.ok(question.options.length >= 3 && question.options.length <= 4);
      assert.equal(new Set(question.options).size, question.options.length);
      assert.equal(question.options.filter(option => option === question.answer).length, 1);
    }
  }
});

test('计算题从显示的算式独立复算，余数和方框满足原式', () => {
  let checked = 0;
  for (const topic of mathTopics) {
    for (const question of topic.questions) {
      const calculation = question.calculation;
      if (!calculation) continue;
      const answer = Number(question.answer);
      if (calculation.operation === 'remainder') {
        const [dividend, divisor] = calculation.operands;
        assert.ok(divisor >= 1 && divisor <= 9);
        assert.ok(answer >= 0 && answer < divisor);
        assert.equal((dividend - answer) / divisor, Math.floor(dividend / divisor));
      } else if (calculation.operation === 'unknown') {
        const [left, right] = question.display.replace('□', question.answer).split('=');
        assert.equal(calculate(left), Number(right), question.id);
      } else if (calculation.operation === 'round-hundred') {
        const value = calculation.operands[0];
        assert.equal(answer % 100, 0);
        assert.ok(value >= answer - 50 && value < answer + 50, question.id);
      } else if (calculation.operation.startsWith('estimate-')) {
        assert.equal(answer % 100, 0);
        if (calculation.operation === 'estimate-multiply') {
          const [value, multiplier] = calculation.operands;
          assert.ok(Math.abs(value * multiplier - answer) <= 50 * multiplier);
        }
      } else {
        assert.equal(calculate(question.display || `${calculation.operands[0]} ${calculation.operation === 'multiply' ? '×' : '÷'} ${calculation.operands[1]}`), answer, question.id);
      }
      checked++;
    }
  }
  assert.ok(checked >= 290);
});

test('关键边界覆盖连续退位、进位、含零乘除、四舍五入及运算顺序', () => {
  const questions = mathTopics.flatMap(topic => topic.questions);
  const find = display => questions.find(question => question.display === display);
  for (const [display, answer] of [['600 − 248', '352'], ['278 + 346', '624'], ['206 × 4', '824'], ['105 × 3', '315'], ['23 × 12', '276'], ['306 ÷ 3', '102'], ['630 ÷ 3', '210'], ['0 ÷ 3', '0'], ['0 × 8', '0'], ['1250', '1300'], ['8049', '8000'], ['8050', '8100'], ['24 ÷ 2 × 2', '24'], ['12 + 2 × 2', '16'], ['(12 + 2) × 2', '28']]) {
    assert.equal(find(display)?.answer, answer, display);
  }
  const division = mathTopics.find(topic => topic.id === 'math-division');
  assert.ok(division.questions.filter(question => question.calculation).every(question => question.calculation.operands[1] > 0));
  const number = mathTopics[0];
  assert.equal(number.questions.find(question => question.display === '3050' && question.category === 'read').answer, '三千零五十');
  assert.equal(number.questions.find(question => question.display === '四千零六').answer, '4006');
});

for (const topic of mathTopics) {
  test(`${topic.name}：自由学习、分层组题、未练题优先与断点恢复`, () => {
    const state = topicDefaults(topic);
    assert.equal(state.showPinyin, false);
    for (const category of topic.categories) {
      state.practiceLength = 30;
      assert.equal(startTopicRound(topic, state, category.id), true);
      assert.equal(state.round.questions.length, 12);
      assert.ok(state.round.questions.every(question => question.category === category.id));
    }
    state.practiceSeen = [];
    state.practiceLength = 10;
    startTopicRound(topic, state, 'all');
    assert.equal(new Set(state.round.questions.map(question => question.category)).size, topic.categories.length);
    const firstIds = state.round.questions.map(question => question.id);
    startTopicRound(topic, state, 'all');
    assert.ok(state.round.questions.every(question => !firstIds.includes(question.id)));
    state.practiceLength = 30;
    startTopicRound(topic, state, 'all');
    assert.equal(state.round.questions.length, 30);
    const restored = normalizeTopic(topic, JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored.round.questions, state.round.questions);
    assert.equal(restored.round.index, state.round.index);
    assert.equal(restored.round.scope, 'all');
    assert.ok(restored.round.responses.every(response => response === null));
    assert.deepEqual(restored.practiceSeen, state.practiceSeen);
    state.round.questions[0].answer = '外来答案';
    state.round.questions[0].prompt = '<script>外来题目</script>';
    const canonical = normalizeTopic(topic, state);
    assert.notEqual(canonical.round.questions[0].answer, '外来答案');
    assert.ok(!canonical.round.questions[0].prompt.includes('<script>'));
    state.round.questions[0].id = chineseTopics[0].questions[0].id;
    assert.equal(normalizeTopic(topic, state).round, null);
  });

  test(`${topic.name}：首次统计不被重试覆盖，跳过保留错题，独立复习才移出`, () => {
    const state = topicDefaults(topic);
    assert.equal(startTopicRound(topic, state, 'review'), false);
    startTopicRound(topic, state, topic.categories[0].id);
    const first = state.round.questions[0];
    answerTopic(state, first.options.find(option => option !== first.answer));
    answerTopic(state, first.answer);
    assert.equal(state.round.responses[0].correct, false);
    assert.deepEqual(state.mistakes, [first.id]);
    advanceTopic(topic, state);
    const second = state.round.questions[1];
    answerTopic(state, null);
    assert.ok(state.mistakes.includes(second.id));
    startTopicRound(topic, state, 'review');
    assert.equal(state.round.questions.length, 2);
    while (!state.round.finished) {
      const current = state.round.questions[state.round.index];
      assert.equal(answerTopic(state, current.answer).reviewed, true);
      const history = advanceTopic(topic, state);
      if (history) assert.equal(history.correct, 2);
    }
    assert.deepEqual(state.mistakes, []);
    assert.equal(advanceTopic(topic, state), null);
  });
}

test('数学参考思路保存，自评和错题不会混入语文，旧存档可补齐', () => {
  const topic = mathTopics[0];
  const state = topicDefaults(topic);
  updateTopicActivity(topic, state, 'example');
  assert.equal(normalizeTopic(topic, state).activities[state.lessonId].showExample, true);
  state.known = [topic.lessons[0].id, chineseTopics[0].lessons[0].id];
  state.mistakes = [topic.questions[0].id, chineseTopics[0].questions[0].id];
  const restored = normalizeTopic(topic, state);
  assert.deepEqual(restored.known, [topic.lessons[0].id]);
  assert.deepEqual(restored.mistakes, [topic.questions[0].id]);
  const old = defaultState();
  delete old.topics;
  old.known = ['single-a'];
  const loaded = loadState({ getItem: () => JSON.stringify(old) });
  assert.deepEqual(loaded.state.known, ['single-a']);
  assert.deepEqual(loaded.state.topics, {});
});
