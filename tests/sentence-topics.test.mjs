import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { sentenceBuildingTopic } from '../src/sentence-building-data.js';
import { punctuationTopic } from '../src/punctuation-data.js';
import { sentencePatternsTopic } from '../src/sentence-patterns-data.js';
import { sentenceRevisionTopic } from '../src/sentence-revision-data.js';
import { vividExpressionTopic } from '../src/vivid-expression-data.js';
import { topicDefaults, normalizeTopic, updateTopicActivity } from '../src/chinese-engine.js';

test('第二阶段五主题按规划排序，自由访问且学习活动覆盖完整', () => {
  const topics = chineseTopics.filter(topic => topic.stage.startsWith('第二阶段'));
  assert.deepEqual(topics.map(topic => topic.name), ['连词成句与补全句子', '标点符号', '句式积累与仿写', '扩句与句子修改', '比喻、拟人与生动表达']);
  assert.equal(topics.reduce((total, topic) => total + topic.lessons.length, 0), 47);
  assert.equal(topics.reduce((total, topic) => total + topic.questions.length, 0), 94);
  assert.equal(topics.flatMap(topic => topic.lessons).filter(lesson => lesson.activity.type === 'write').length, 43);
});

test('生动表达包含比喻、拟人、直接描写和“像”字反例', () => {
  assert.equal(vividExpressionTopic.lessons.length, 8);
  assert.equal(vividExpressionTopic.questions.length, 16);
  assert.equal(vividExpressionTopic.questions.find(question => question.id.endsWith('not-every-like-1')).answer, '雪花像轻盈的羽毛。');
  assert.equal(vividExpressionTopic.questions.find(question => question.id.endsWith('not-every-like-2')).answer, '猜测');
  assert.equal(vividExpressionTopic.questions.find(question => question.id.endsWith('compare-1')).answer, '比喻');
  assert.equal(vividExpressionTopic.questions.find(question => question.id.endsWith('compare-2')).answer, '拟人');
  assert.ok(vividExpressionTopic.lessons.find(lesson => lesson.id.endsWith(':senses')).body.includes('不必每句话'));
});

test('扩句保留原意，修改覆盖缺成分、用词不当和重复啰唆', () => {
  assert.deepEqual(sentenceRevisionTopic.categories.map(category => category.id), ['expand', 'missing', 'wording', 'repeat']);
  assert.equal(sentenceRevisionTopic.lessons.length, 9);
  assert.equal(sentenceRevisionTopic.questions.length, 18);
  assert.equal(sentenceRevisionTopic.questions.find(question => question.id.endsWith('detail-2')).answer, '花谢了。');
  assert.ok(sentenceRevisionTopic.lessons.find(lesson => lesson.id.endsWith(':missing-who')).body.includes('没有上下文'));
  assert.equal(sentenceRevisionTopic.questions.find(question => question.id.endsWith('about-1')).answer, '活动大约需要十分钟。');
});

test('句式仿写涵盖同时、先后、因果、假设、转折和进一步补充', () => {
  assert.equal(sentencePatternsTopic.lessons.length, 8);
  assert.equal(sentencePatternsTopic.questions.length, 16);
  for (const phrase of ['一边', '先', '因为', '如果', '虽然', '既', '不但']) {
    assert.ok(sentencePatternsTopic.lessons.some(lesson => lesson.activity.sample.includes(phrase)));
  }
  assert.equal(sentencePatternsTopic.questions.find(question => question.id.endsWith('not-sequence-1')).answer, '我先洗手，再吃饭。');
  assert.equal(sentencePatternsTopic.questions.find(question => question.id.endsWith('if-1')).answer, '没有，只是在作假设');
});

test('标点覆盖六种常见符号，练习含疑问词反例和完整对话', () => {
  assert.deepEqual(punctuationTopic.categories.map(category => category.id), ['period', 'comma', 'question', 'exclamation', 'colon', 'quotes']);
  assert.equal(punctuationTopic.lessons.length, 12);
  assert.equal(punctuationTopic.questions.length, 24);
  assert.equal(punctuationTopic.questions.find(question => question.id.endsWith('not-every-who-1')).answer, '。');
  for (const lesson of punctuationTopic.lessons) {
    const sample = lesson.activity.sample;
    assert.equal([...sample].filter(character => character === '“').length, [...sample].filter(character => character === '”').length);
  }
  assert.equal(punctuationTopic.questions.find(question => question.id.endsWith('inside-1')).answer, '妈妈问：“你饿了吗？”');
});

test('连词成句包含四个可操作例子，并接受时间词的两种位置', () => {
  const topic = sentenceBuildingTopic;
  const lessons = topic.lessons.filter(lesson => lesson.activity.type === 'order');
  assert.equal(lessons.length, 4);
  for (const lesson of lessons) {
    const state = topicDefaults(topic);
    state.lessonId = lesson.id;
    for (const answer of lesson.activity.answers) {
      updateTopicActivity(topic, state, 'clear');
      let remaining = answer;
      while (remaining) {
        const index = lesson.activity.tokens.findIndex(token => remaining.startsWith(token));
        assert.ok(index >= 0);
        updateTopicActivity(topic, state, 'pick', String(index));
        remaining = remaining.slice(lesson.activity.tokens[index].length);
      }
      updateTopicActivity(topic, state, 'check');
      assert.equal(state.activities[lesson.id].checked, true);
      assert.equal(state.activities[lesson.id].order.length, lesson.activity.tokens.length);
      const before = [...state.activities[lesson.id].order];
      updateTopicActivity(topic, state, 'pick', String(before[0]));
      updateTopicActivity(topic, state, 'pick', '-1');
      assert.deepEqual(state.activities[lesson.id].order, before);
      updateTopicActivity(topic, state, 'undo');
      assert.equal(state.activities[lesson.id].checked, false);
    }
  }
  assert.equal(lessons.find(lesson => lesson.id.endsWith(':when')).activity.answers.length, 2);
});

for (const topic of chineseTopics.filter(topic => topic.stage.startsWith('第二阶段'))) {
  test(`${topic.name}：表达活动齐全，草稿按学习卡隔离并安全恢复`, () => {
    const state = topicDefaults(topic);
    for (const lesson of topic.lessons) {
      assert.ok(lesson.activity);
      if (lesson.activity.type !== 'write') continue;
      assert.ok(lesson.activity.sample && lesson.activity.checklist.length >= 2);
      state.lessonId = lesson.id;
      state.category = lesson.category;
      updateTopicActivity(topic, state, 'draft', `${lesson.title}<img src=x onerror=alert(1)>`);
      updateTopicActivity(topic, state, 'example');
    }
    assert.deepEqual(normalizeTopic(topic, state).activities, state.activities);
    const lesson = topic.lessons.find(lesson => lesson.activity.type === 'write');
    state.lessonId = lesson.id;
    updateTopicActivity(topic, state, 'draft', '字'.repeat(600));
    assert.equal(state.activities[lesson.id].text.length, 500);
    state.activities.foreign = { text: '外来草稿' };
    state.activities[lesson.id].order = [0, 0, -1, '1', null, 999];
    const restored = normalizeTopic(topic, state);
    assert.equal(restored.activities.foreign, undefined);
    assert.deepEqual(restored.activities[lesson.id].order, []);
    assert.equal(restored.activities[lesson.id].checked, false);
    assert.deepEqual(topicDefaults(topic).activities, {});
  });
}
