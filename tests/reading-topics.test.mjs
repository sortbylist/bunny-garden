import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { topicDefaults, normalizeTopic, updateTopicActivity, startTopicRound, answerTopic } from '../src/chinese-engine.js';
import { readingPassage, readingLesson } from '../src/reading-view.js';
import { paragraphEntries } from '../src/reading-paragraphs-data.js';
import { rewardTopics, rewardStages, rewardSections } from '../src/reward-curriculum.js';
import { rewardCatalog, initializeRewards, rewardProgress } from '../src/rewards.js';
import { defaultState } from '../src/engine.js';

const topics = chineseTopics.filter(topic => topic.id.startsWith('reading-'));

test('五个阅读主题的三十篇短文与九十道题均有完整、可定位的原文依据', () => {
  assert.equal(topics.length, 5);
  const passages = new Set();
  for (const topic of topics) {
    assert.equal(topic.categories.length, 3);
    assert.equal(topic.lessons.length, 6);
    assert.equal(topic.questions.length, 18);
    for (const category of topic.categories) {
      assert.equal(topic.lessons.filter(lesson => lesson.category === category.id).length, 2);
      assert.equal(topic.questions.filter(question => question.category === category.id).length, 6);
    }
    for (const lesson of topic.lessons) {
      const { passage, focus, guide } = lesson.reading;
      assert.ok(passage.paragraphs.length >= 2);
      assert.ok(passage.paragraphs.join('').length >= 70, lesson.title);
      assert.ok(!passages.has(passage.paragraphs.join('')), lesson.title);
      passages.add(passage.paragraphs.join(''));
      assert.ok(guide && lesson.body && lesson.examples.length >= 2);
      assert.ok(focus.length && focus.every(index => passage.paragraphs[index]));
      const questions = topic.questions.filter(question => question.passage.title === passage.title);
      assert.equal(questions.length, 3);
      for (const question of questions) {
        assert.deepEqual(question.passage, passage);
        assert.ok(question.evidence.length > 0);
        assert.equal(new Set(question.evidence).size, question.evidence.length);
        assert.ok(question.evidence.every(index => Number.isInteger(index) && passage.paragraphs[index]));
        assert.equal(question.passage.guide, undefined);
        assert.equal(new Set(question.options).size, 3);
      }
      if (lesson.activity.type === 'write') assert.ok(lesson.activity.sample && lesson.activity.checklist.length >= 2);
    }
  }
  assert.equal(passages.size, 30);
});

test('阅读线索按篇保存，草稿与排序不串用，也不产生掌握或成绩', () => {
  const topic = topics[0];
  const state = topicDefaults(topic);
  const first = topic.lessons[0];
  assert.ok(!readingLesson(first, state).includes(first.reading.guide));
  updateTopicActivity(topic, state, 'evidence');
  updateTopicActivity(topic, state, 'draft', '我从第二段找到了时间和地点。');
  const restored = normalizeTopic(topic, JSON.parse(JSON.stringify(state)));
  assert.ok(readingLesson(first, restored).includes(first.reading.guide));
  assert.equal(restored.activities[first.id].text, '我从第二段找到了时间和地点。');
  assert.ok(!readingLesson(topic.lessons[1], restored).includes(topic.lessons[1].reading.guide));
  assert.deepEqual(restored.known, []);
  assert.deepEqual(restored.mistakes, []);
  assert.equal(restored.round, null);
  state.activities[first.id].showEvidence = 'true';
  assert.equal(normalizeTopic(topic, state).activities[first.id].showEvidence, false);
  state.view = 'quiz';
  updateTopicActivity(topic, state, 'evidence');
  assert.equal(state.activities[first.id].showEvidence, 'true');
});

test('四组句段排序支持打乱、撤回和刷新，损坏序号过滤且不会直接判为完成', () => {
  const topic = topics.find(item => item.id === 'reading-paragraphs');
  const entries = paragraphEntries.filter(entry => entry.order);
  assert.equal(entries.length, 4);
  for (const entry of entries) {
    const lesson = topic.lessons.find(item => item.id.endsWith(`:${entry.id}`));
    const state = { ...topicDefaults(topic), category: lesson.category, lessonId: lesson.id };
    const activity = lesson.activity;
    assert.equal(new Set(activity.tokens).size, 4);
    assert.notEqual(activity.tokens.join(''), activity.answers[0]);
    updateTopicActivity(topic, state, 'pick', entry.solution[0]);
    updateTopicActivity(topic, state, 'pick', entry.solution[0]);
    assert.equal(state.activities[lesson.id].order.length, 1);
    updateTopicActivity(topic, state, 'undo');
    for (const index of entry.solution) updateTopicActivity(topic, state, 'pick', index);
    updateTopicActivity(topic, state, 'check');
    const restored = normalizeTopic(topic, JSON.parse(JSON.stringify(state)));
    assert.equal(restored.activities[lesson.id].checked, true);
    assert.equal(restored.activities[lesson.id].order.map(index => activity.tokens[index]).join(''), activity.answers[0]);
    state.activities[lesson.id].order = [entry.solution[0], entry.solution[0], -1, 99, '1'];
    const repaired = normalizeTopic(topic, state).activities[lesson.id];
    assert.deepEqual(repaired.order, [entry.solution[0]]);
    assert.equal(repaired.checked, false);
    updateTopicActivity(topic, restored, 'clear');
    assert.deepEqual(restored.activities[lesson.id].order, []);
    assert.equal(restored.round, null);
  }
});

test('阅读练习恢复时重建原文与依据，学习线索不提前揭晓练习答案', () => {
  for (const topic of topics) {
    const state = topicDefaults(topic);
    updateTopicActivity(topic, state, 'evidence');
    startTopicRound(topic, state, 'all', 30);
    assert.equal(state.round.questions.length, 18);
    const question = state.round.questions[0];
    question.passage = { title: '篡改标题', paragraphs: ['篡改原文'] };
    question.evidence = [999];
    const restored = normalizeTopic(topic, JSON.parse(JSON.stringify(state)));
    const canonical = topic.questions.find(item => item.id === question.id);
    assert.deepEqual(restored.round.questions[0].passage, canonical.passage);
    assert.deepEqual(restored.round.questions[0].evidence, canonical.evidence);
    assert.equal(restored.round.revealed, false);
    answerTopic(restored, canonical.options.find(option => option !== canonical.answer));
    assert.equal(restored.round.revealed, false);
    answerTopic(restored, canonical.answer);
    assert.equal(restored.round.revealed, true);
    assert.equal(restored.round.responses[0].correct, false);
    assert.deepEqual(restored.mistakes, [canonical.id]);
  }
});

test('原文、标题和线索安全转义，关闭拼音不丢原文，依据通过文字而非只靠颜色提示', () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const passage = { title: malicious, paragraphs: [malicious, '蒲公英在春天生长。'] };
  const html = readingPassage(passage, true, [1]);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('依据段落'));
  assert.ok(html.includes('<ruby>'));
  const plain = readingPassage(passage, false);
  assert.ok(!plain.includes('<ruby>'));
  assert.ok(plain.includes('蒲公英在春天生长。'));
  assert.ok(!plain.includes('依据段落'));
  const lesson = { ...topics[0].lessons[0], reading: { passage, focus: [1], guide: malicious } };
  const state = { ...topicDefaults(topics[0]), activities: { [lesson.id]: { showEvidence: true } } };
  assert.ok(!readingLesson(lesson, state).includes('<img'));
});

test('五个主题徽章与十五小节纳入第三阶段，扩课后旧古诗记录和已获奖牌保留', () => {
  const stage = rewardStages.find(item => item.id === 'chinese-3');
  assert.equal(stage.topics.length, 8);
  for (const topic of topics) {
    assert.ok(stage.topics.some(item => item.id === topic.id));
    assert.ok(rewardCatalog.some(reward => reward.topicId === topic.id));
    const registered = rewardTopics.find(item => item.id === topic.id);
    assert.equal(registered.sections.length, 3);
    for (const category of topic.categories) {
      const section = rewardSections.get(`${topic.id}/${category.id}`);
      assert.equal(section.learnIds.length, 2);
      assert.equal(section.questionIds.length, 6);
    }
  }
  const root = defaultState();
  initializeRewards(root);
  const awarded = new Date(2026, 10, 16).getTime();
  root.rewards.unlocks['stage-chinese-3-gold'] = awarded;
  root.rewards.unlocks['topic-poetry-culture'] = awarded;
  initializeRewards(root);
  assert.equal(root.rewards.unlocks['stage-chinese-3-gold'], awarded);
  assert.equal(root.rewards.unlocks['topic-poetry-culture'], awarded);
  for (const topic of topics) assert.equal(root.rewards.unlocks[`topic-${topic.id}`], undefined);
  assert.equal(rewardProgress(root.rewards, rewardCatalog.find(reward => reward.id === 'stage-chinese-3-gold')).target, 24);
});
