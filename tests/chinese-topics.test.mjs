import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { dictionaryEntries, dictionaryLookup } from '../src/dictionary-data.js';
import { topicDefaults, normalizeTopic, startTopicRound, answerTopic, advanceTopic } from '../src/chinese-engine.js';
import { defaultState, loadState } from '../src/engine.js';
import { vocabularyEntries } from '../src/vocabulary-data.js';
import { synonymPairs, antonymPairs, relationContexts } from '../src/word-relations-data.js';
import { measureWords, verbPairs, deSamples, deQuestions } from '../src/collocations-data.js';
import { repeatedWords, idioms, fourCharacterPhrases } from '../src/word-patterns-data.js';
import { subjects } from '../src/data.js';

test('各主题标识全局唯一，题目答案唯一且覆盖所有小节', () => {
  const identifiers = [];
  for (const topic of chineseTopics) {
    assert.ok(topic.lessons.length >= 6);
    assert.ok(topic.questions.length >= 15);
    for (const category of topic.categories) {
      assert.ok(topic.lessons.some(item => item.category === category.id));
      assert.ok(topic.questions.some(item => item.category === category.id));
    }
    for (const lesson of topic.lessons) {
      identifiers.push(lesson.id);
      assert.ok(lesson.title && lesson.body && lesson.task && lesson.examples.length);
      assert.ok(topic.categories.some(item => item.id === lesson.category));
    }
    for (const question of topic.questions) {
      identifiers.push(question.id);
      assert.equal(new Set(question.options).size, question.options.length, question.id);
      assert.equal(question.options.filter(option => option === question.answer).length, 1, question.id);
      assert.ok(question.options.length >= 3 && question.explanation && question.prompt);
      assert.ok(topic.categories.some(item => item.id === question.category));
    }
  }
  assert.equal(new Set(identifiers).size, identifiers.length);
});

test('第一阶段六个主题的真实入口完整，与内容注册一致', () => {
  const features = subjects.find(subject => subject.id === 'chinese').features;
  assert.deepEqual(features.map(item => item.id), ['pinyin', 'hanzi-structure', ...chineseTopics.map(item => item.id)]);
  for (const topic of chineseTopics) assert.equal(features.find(item => item.id === topic.id).name, topic.name);
});

test('词语积累覆盖六类、每类十词，分类与用词练习均有完整语境', () => {
  assert.equal(vocabularyEntries.length, 60);
  assert.equal(new Set(vocabularyEntries.map(item => item.text)).size, 60);
  const topic = chineseTopics.find(item => item.id === 'word-categories');
  assert.deepEqual(topic.categories.map(item => item.id), ['people', 'animals', 'plants', 'actions', 'feelings', 'seasons']);
  assert.equal(topic.questions.length, 180);
  for (const category of topic.categories) assert.equal(vocabularyEntries.filter(item => item.category === category.id).length, 10);
  for (const question of topic.questions) assert.ok(question.display && question.explanation);
  assert.equal(topic.questions.filter(item => item.display.includes('____')).length, 60);
});

test('近反义词都在完整句子中辨认，并覆盖不可随意互换的语境', () => {
  const topic = chineseTopics.find(item => item.id === 'word-relations');
  assert.equal(synonymPairs.length, 18);
  assert.equal(antonymPairs.length, 18);
  assert.equal(relationContexts.length, 12);
  assert.equal(topic.lessons.length, 48);
  assert.equal(topic.questions.length, 96);
  assert.ok(topic.questions.every(item => item.display));
  assert.ok(topic.lessons.some(item => item.body.includes('自豪')));
  for (const item of relationContexts) {
    assert.equal(item.cases.length, 2);
    for (const [answer, sentence, other] of item.cases) {
      assert.ok(sentence.includes('____'));
      assert.notEqual(answer, other);
    }
  }
});

test('词语搭配覆盖量词、修饰语和三个结构助词，题目只有一个正确选项', () => {
  const topic = chineseTopics.find(item => item.id === 'collocations');
  assert.equal(measureWords.length, 12);
  assert.equal(verbPairs.length, 8);
  assert.equal(deSamples.length, 4);
  assert.equal(deQuestions.length, 12);
  assert.deepEqual(topic.lessons.filter(item => item.category === 'measure').length, 12);
  assert.equal(topic.questions.length, 32);
  for (const item of deQuestions) {
    assert.ok(item.display.includes('____'));
    assert.ok(['的', '地', '得'].includes(item.answer));
    assert.ok(!item.display.replace('____', item.answer).includes('____'));
  }
  for (const question of topic.questions) {
    assert.equal(question.options[0], question.answer);
    assert.equal(question.options.filter(option => option === question.answer).length, 1);
  }
});

test('叠词字形符合 ABB/AABB/ABAB，成语包含释义与用法边界', () => {
  const topic = chineseTopics.find(item => item.id === 'word-patterns');
  assert.equal(repeatedWords.length, 12);
  assert.equal(idioms.length, 8);
  assert.equal(fourCharacterPhrases.length, 4);
  assert.equal(topic.lessons.length, 24);
  assert.equal(topic.questions.length, 49);
  for (const item of repeatedWords) {
    const characters = [...item.text];
    assert.equal(characters.length, item.pattern.length);
    for (let first = 0; first < characters.length; first++) {
      for (let second = 0; second < characters.length; second++) assert.equal(characters[first] === characters[second], item.pattern[first] === item.pattern[second], item.text);
    }
  }
  for (const item of idioms) {
    assert.ok(item.meaning && item.warning && item.situation);
    assert.equal(item.distractors.length, 2);
  }
  assert.equal(topic.questions.find(item => item.id.endsWith('phrase-not-idiom')).answer, '我的书包');
});

for (const topic of chineseTopics) {
  test(`${topic.name}：自由组题、首次统计、跳过、复习、恢复与完成去重`, () => {
    const state = topicDefaults(topic);
    assert.equal(startTopicRound(topic, state, 'review'), false);
    assert.equal(startTopicRound(topic, state, 'bad'), false);
    for (const category of topic.categories) {
      startTopicRound(topic, state, category.id);
      assert.ok(state.round.questions.every(item => item.category === category.id));
    }
    startTopicRound(topic, state, 'all');
    assert.equal(new Set(state.round.questions.map(item => item.category)).size, topic.categories.length);
    assert.equal(new Set(state.round.questions.map(item => item.id)).size, state.round.questions.length);
    assert.equal(state.round.questions.length, 10);
    assert.equal(advanceTopic(topic, state), null);
    assert.equal(answerTopic(state, 'invalid'), null);
    const question = state.round.questions[0];
    answerTopic(state, question.options.find(option => option !== question.answer));
    const restored = normalizeTopic(topic, JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored.round.questions, state.round.questions);
    assert.equal(answerTopic(restored, question.answer).correct, true);
    assert.equal(restored.round.responses[0].correct, false);
    assert.equal(answerTopic(restored, question.answer), null);
    assert.deepEqual(restored.mistakes, [question.id]);
    startTopicRound(topic, restored, 'review');
    answerTopic(restored, null);
    assert.equal(restored.round.responses[0].skipped, true);
    assert.deepEqual(restored.mistakes, [question.id]);
    startTopicRound(topic, restored, 'review');
    assert.equal(answerTopic(restored, question.answer).reviewed, true);
    assert.deepEqual(restored.mistakes, []);
    assert.equal(advanceTopic(topic, restored).correct, 1);
    assert.equal(advanceTopic(topic, restored), null);
    assert.equal(normalizeTopic(topic, JSON.parse(JSON.stringify(restored))).round.finished, true);
  });

  test(`${topic.name}：损坏存储局部降级，外来题目和 HTML 不进入课程`, () => {
    const state = topicDefaults(topic);
    startTopicRound(topic, state, 'all');
    state.round.questions[0].prompt = '<script>alert(1)</script>';
    assert.equal(normalizeTopic(topic, state).round.questions[0].prompt.includes('<script>'), false);
    state.round.questions[0].id = 'foreign';
    state.known = [topic.lessons[0].id, topic.lessons[0].id, 'foreign'];
    state.mistakes = ['foreign'];
    const restored = normalizeTopic(topic, state);
    assert.equal(restored.round, null);
    assert.equal(restored.view, 'learn');
    assert.deepEqual(restored.known, [topic.lessons[0].id]);
    assert.deepEqual(restored.mistakes, []);
    const old = defaultState();
    delete old.topics;
    old.known = ['single-a'];
    const loaded = loadState({ getItem: () => JSON.stringify(old) });
    assert.deepEqual(loaded.state.known, ['single-a']);
    assert.deepEqual(normalizeTopic(topic, loaded.state.topics?.[topic.id]), topicDefaults(topic));
  });
}

test('查字实验的音序、部首索引均可到达每个例字，剩余笔画准确', () => {
  assert.equal(dictionaryEntries.length, 24);
  const topic = chineseTopics.find(item => item.id === 'dictionary');
  assert.equal(topic.lessons.length, 36);
  assert.equal(topic.questions.length, 181);
  for (const entry of dictionaryEntries) {
    assert.equal(entry.initial, entry.syllable[0].toUpperCase());
    assert.ok(entry.strokes > entry.radicalStrokes);
    for (const [method, path] of [
      ['sound', [entry.initial, entry.syllable, entry.text]],
      ['radical', [String(entry.radicalStrokes), entry.radical, String(entry.strokes - entry.radicalStrokes), entry.text]],
    ]) {
      for (let index = 0; index < path.length; index++) assert.ok(dictionaryLookup(method, path.slice(0, index)).options.includes(path[index]));
      assert.equal(dictionaryLookup(method, path).entry.text, entry.text);
    }
  }
  assert.deepEqual(dictionaryLookup('sound', ['H', 'bad']).selections, ['H']);
  assert.deepEqual(dictionaryLookup('radical', null).selections, []);
  assert.deepEqual(dictionaryLookup('radical', ['3', '氵', '8']).options.sort(), ['深', '清']);
  assert.deepEqual(dictionaryLookup('sound', ['Q', 'qing']).options.sort(), ['情', '晴', '清', '请']);
});
