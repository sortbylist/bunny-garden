import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { hanziQuestions } from '../src/hanzi-data.js';
import { topicDefaults, normalizeTopic, startTopicRound } from '../src/chinese-engine.js';
import { createHanziState, normalizeHanziState, startHanziRound } from '../src/hanzi-engine.js';
import { selectPractice } from '../src/chinese-practice.js';
import { readingText } from '../src/chinese-reading.js';
import { dictionaryDiagram, lessonVisual } from '../src/chinese-visuals.js';

test('拼音按完整词组匹配，处理多音词并转义内容，关闭后保留原文', () => {
  const text = '整理整理、狐假虎威、果实累累、拔苗助长';
  const html = readingText(text);
  assert.equal((html.match(/<ruby>/g) || []).length, 4);
  for (const reading of ['zhěng lǐ zhěng lǐ', 'hú jiǎ hǔ wēi', 'guǒ shí léi léi', 'bá miáo zhù zhǎng']) assert.ok(html.includes(`<rt>${reading}</rt>`));
  assert.equal(readingText(text, false), text);
  assert.equal(readingText('<script>"&"</script>', false), '&lt;script&gt;&quot;&amp;&quot;&lt;/script&gt;');
  assert.ok(!readingText('<img src=x onerror=alert(1)>蝴蝶').includes('<img'));
  assert.equal(readingText('长大、银行、快乐'), '长大、银行、快乐');
});

test('抽题先覆盖小节再优先未见题，不改原题库，题量不足不重复凑数', () => {
  const pool = Array.from({ length: 12 }, (_, index) => ({ id: `item-${index}`, category: index < 6 ? 'first' : 'second' }));
  const original = JSON.stringify(pool);
  const first = selectPractice(pool, ['first', 'second'], 4, [], items => [...items]);
  const second = selectPractice(pool, ['first', 'second'], 4, first.seenIds, items => [...items]);
  assert.deepEqual(new Set(first.questions.map(item => item.category)), new Set(['first', 'second']));
  assert.ok(second.questions.every(item => !first.seenIds.includes(item.id)));
  const full = selectPractice(pool, [], 30, second.seenIds, items => [...items]);
  assert.equal(full.questions.length, 12);
  assert.equal(new Set(full.questions.map(item => item.id)).size, 12);
  assert.deepEqual(selectPractice(pool, [], 4, [...pool.map(item => item.id), 'outside'], items => [...items]).seenIds, ['outside', ...pool.slice(0, 4).map(item => item.id)]);
  assert.equal(JSON.stringify(pool), original);
});

test('分类多于题数时，末尾分类仍可进入练习，后续轮次优先有未练题的分类', () => {
  const categories = Array.from({ length: 12 }, (_, index) => `category-${index}`);
  const pool = categories.flatMap(category => [0, 1].map(index => ({ id: `${category}-${index}`, category })));
  const first = selectPractice(pool, categories, 10, [], items => [...items].reverse());
  assert.ok(first.questions.some(question => question.category === categories.at(-1)));
  assert.equal(new Set(first.questions.map(question => question.category)).size, 10);
  const practicedCategories = categories.slice(0, 10);
  const seenIds = pool.filter(question => practicedCategories.includes(question.category)).map(question => question.id);
  const next = selectPractice(pool, categories, 10, seenIds, items => [...items]);
  for (const category of categories.slice(10)) assert.ok(next.questions.some(question => question.category === category));
  assert.equal(new Set(next.questions.map(question => question.id)).size, 10);
});

const practiceSubjects = [
  ...chineseTopics.map(topic => ({
    name: topic.name, questions: topic.questions, defaults: () => topicDefaults(topic),
    normalize: state => normalizeTopic(topic, state), start: (state, scope) => startTopicRound(topic, state, scope),
  })),
  { name: '汉字', questions: hanziQuestions, defaults: createHanziState, normalize: normalizeHanziState, start: startHanziRound },
];

for (const subject of practiceSubjects) {
  test(`${subject.name}：20/30题可恢复，辅助设置不改当前答案，旧记录兼容`, () => {
    for (const length of [20, 30]) {
      const state = subject.defaults();
      state.showPinyin = false;
      state.practiceLength = length;
      subject.start(state, 'all');
      const count = Math.min(length, subject.questions.length);
      state.round.responses = Array(count).fill(null);
      assert.equal(state.round.questions.length, count);
      const restored = subject.normalize(JSON.parse(JSON.stringify(state)));
      assert.deepEqual(restored, state);
      restored.practiceLength = 10;
      restored.showPinyin = true;
      assert.deepEqual(restored.round, state.round);
      assert.equal(new Set(restored.round.questions.map(item => item.id)).size, count);
      restored.mistakes = [subject.questions[0].id, subject.questions[1].id];
      const seen = [...restored.practiceSeen];
      subject.start(restored, 'review');
      assert.equal(restored.round.questions.length, 2);
      assert.deepEqual(restored.practiceSeen, seen);
    }
    const old = subject.defaults();
    subject.start(old, 'all');
    old.round.responses = Array(10).fill(null);
    delete old.showPinyin;
    delete old.practiceLength;
    delete old.practiceSeen;
    const restored = subject.normalize(old);
    assert.equal(restored.showPinyin, true);
    assert.equal(restored.practiceLength, 10);
    assert.deepEqual(restored.round, old.round);
    const invalid = subject.normalize({ practiceLength: 999, showPinyin: 'false', practiceSeen: ['foreign', subject.questions[0].id, subject.questions[0].id] });
    assert.equal(invalid.practiceLength, 10);
    assert.equal(invalid.showPinyin, true);
    assert.deepEqual(invalid.practiceSeen, [subject.questions[0].id]);
  });
}

test('查字图解给出完整路线，近反义词和其他主题有可读图示', () => {
  const sound = dictionaryDiagram('sound');
  for (const value of ['qíng', '>Q<', '>qing<', '>晴<', 'aria-label="翻开的字典"']) assert.ok(sound.includes(value));
  const radical = dictionaryDiagram('radical', false);
  for (const value of ['4 画', '>日<', '8 画', '晴共 12 画']) assert.ok(radical.includes(value));
  assert.ok(!radical.includes('<ruby>'));
  for (const topicId of ['dictionary', 'word-relations', 'word-categories', 'collocations', 'word-patterns']) {
    const topic = chineseTopics.find(item => item.id === topicId);
    const visuals = topic.lessons.map(lesson => lessonVisual(topic, lesson));
    assert.ok(visuals.some(html => html.includes('role="img"') && html.includes('aria-label=')), topicId);
    assert.ok(visuals.every(html => !html.includes('http') && !html.includes('<script')));
  }
});
