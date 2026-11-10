import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { sentenceBuildingTopic } from '../src/sentence-building-data.js';
import { topicDefaults, normalizeTopic, updateTopicActivity } from '../src/chinese-engine.js';

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
