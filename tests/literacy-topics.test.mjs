import test from 'node:test';
import assert from 'node:assert/strict';
import { chineseTopics } from '../src/chinese-topics.js';
import { similarCharacterGroups, similarCharactersTopic } from '../src/similar-characters-data.js';
import { homophoneGroups, polyphonicCharacters, characterReadingsTopic } from '../src/character-readings-data.js';
import { poems, poetryTopic } from '../src/poetry-data.js';
import { literacySupplement } from '../src/chinese-literacy.js';
import { normalizeTopic, topicDefaults, updateTopicActivity } from '../src/chinese-engine.js';

test('第三阶段三个主题可独立开始，表达活动有参考和检查提示', () => {
  const topics = chineseTopics.filter(topic => topic.stage.startsWith('第三阶段'));
  assert.deepEqual(topics.map(topic => topic.id), ['similar-characters', 'character-readings', 'poetry-culture']);
  for (const topic of topics) {
    const state = topicDefaults(topic);
    assert.equal(state.lessonId, topic.lessons[0].id);
    assert.deepEqual(state.known, []);
    for (const lesson of topic.lessons) {
      assert.equal(lesson.activity.type, 'write');
      assert.ok(lesson.activity.sample && lesson.activity.checklist.length >= 2);
    }
  }
});

test('形近字既比较偏旁也比较细微笔画，每个字都有完整语境', () => {
  assert.deepEqual(new Set(similarCharacterGroups.map(group => group.category)), new Set(['radicals', 'details']));
  for (const group of similarCharacterGroups) {
    for (const [text, pinyin, clue, word, sentence] of group.characters) {
      assert.ok(word.includes(text) && pinyin && clue);
      assert.equal(sentence.split('____').length, 2);
      const question = similarCharactersTopic.questions.find(item => item.id === `${similarCharactersTopic.id}:question:${group.id}-${group.characters.findIndex(item => item[0] === text)}`);
      assert.equal(question.answer, text);
      assert.equal(question.display, sentence);
      assert.ok(question.explanation.includes(sentence.replace('____', word)));
    }
  }
  const lesson = similarCharactersTopic.lessons.find(item => item.id.endsWith(':qing-one'));
  const state = topicDefaults(similarCharactersTopic);
  const html = literacySupplement(lesson, state);
  for (const word of ['晴天', '眼睛', '心情', 'qíng', 'jīng']) assert.ok(html.includes(word));
  assert.ok(!literacySupplement(lesson, { ...state, showPinyin: false }).includes('<ruby>'));
});

test('多音字不按单字猜读音，覆盖三读音与轻声并保持词句一致', () => {
  assert.ok(homophoneGroups.some(group => group.words.map(item => item[0]).join('') === '带戴'));
  for (const entry of polyphonicCharacters) {
    for (const [pinyin, word, sentence] of entry.readings) {
      assert.ok(word.includes(entry.text) && sentence.includes(word), `${entry.text} / ${word}`);
      const question = characterReadingsTopic.questions.find(item => item.display === sentence);
      assert.equal(question.answer, pinyin);
      assert.ok(question.prompt.includes(word));
    }
  }
  const readings = polyphonicCharacters.find(entry => entry.text === '得').readings;
  assert.deepEqual(readings.map(item => item[0]), ['dé', 'děi', 'de']);
  const findReading = word => characterReadingsTopic.questions.find(item => item.prompt.includes(`“${word}”`)).answer;
  for (const [word, pinyin] of [['长大', 'zhǎng'], ['银行', 'háng'], ['音乐', 'yuè'], ['背着', 'bēi'], ['看着', 'zhe']]) assert.equal(findReading(word), pinyin);
});

test('古诗逐字注音对应汉字，题目区分背诵、词义和理解', () => {
  assert.equal(poems.length, 8);
  assert.equal(poems.find(poem => poem.title === '春晓').author, '孟浩然');
  assert.equal(poems.find(poem => poem.title === '小池').dynasty, '宋');
  for (const poem of poems) {
    assert.equal(poem.lines.length, 4);
    for (const [text, pinyin] of poem.lines) {
      assert.equal([...text.matchAll(/\p{Script=Han}/gu)].length, pinyin.split(' ').length, `${poem.title}：${text}`);
    }
    const [recall, vocabulary, understanding] = poetryTopic.questions.filter(item => item.id.startsWith(`poetry-culture:question:${poem.id}-`));
    assert.ok(poem.lines.some(([text]) => text === recall.answer));
    assert.ok(!recall.display.includes(recall.answer));
    assert.ok(vocabulary.display && understanding.display);
  }
  const state = topicDefaults(poetryTopic);
  const lesson = poetryTopic.lessons[0];
  const html = literacySupplement(lesson, state);
  assert.equal((html.match(/<ruby>/g) || []).length, 18);
  assert.ok(html.includes('<rt>qū</rt>'));
  assert.ok(!literacySupplement(lesson, { ...state, showPinyin: false }).includes('<ruby>'));
});

test('遮文背诵按诗保存，不改变草稿、自评、错题或成绩；损坏值降级', () => {
  const state = topicDefaults(poetryTopic);
  const first = poetryTopic.lessons[0];
  updateTopicActivity(poetryTopic, state, 'draft', '我看到白鹅在水里游。');
  updateTopicActivity(poetryTopic, state, 'recite');
  const restored = normalizeTopic(poetryTopic, JSON.parse(JSON.stringify(state)));
  assert.equal(restored.activities[first.id].hidePoem, true);
  assert.equal(restored.activities[first.id].text, '我看到白鹅在水里游。');
  const html = literacySupplement(first, restored);
  assert.ok(html.includes('原文已遮住'));
  assert.ok(!html.includes('曲项向天歌'));
  state.lessonId = poetryTopic.lessons[1].id;
  assert.ok(!literacySupplement(poetryTopic.lessons[1], state).includes('原文已遮住'));
  state.lessonId = first.id;
  updateTopicActivity(poetryTopic, state, 'recite');
  assert.equal(state.activities[first.id].hidePoem, false);
  assert.deepEqual(state.known, []);
  assert.deepEqual(state.mistakes, []);
  assert.equal(state.round, null);
  state.activities[first.id].hidePoem = 'true';
  assert.equal(normalizeTopic(poetryTopic, state).activities[first.id].hidePoem, false);
  state.view = 'quiz';
  updateTopicActivity(poetryTopic, state, 'recite');
  assert.equal(state.activities[first.id].hidePoem, 'true');
});

test('对照卡和诗文转义外来文本，不把文本当成 HTML', () => {
  const state = topicDefaults(poetryTopic);
  const unsafe = '<img src=x onerror=alert(1)>';
  const lesson = { ...poetryTopic.lessons[0], poem: { author: unsafe, dynasty: unsafe, lines: [[unsafe, '']] } };
  assert.ok(!literacySupplement(lesson, { ...state, showPinyin: false }).includes('<img'));
  const comparison = { comparison: [{ text: unsafe, pinyin: unsafe, word: unsafe, clue: unsafe }] };
  assert.ok(!literacySupplement(comparison, state).includes('<img'));
});
