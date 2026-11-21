import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, restoreBackup, appVersion } from '../src/backup.js';
import { appStorageKey, loadState, saveState } from '../src/storage.js';
import { defaultState, createRound, recordAnswer } from '../src/engine.js';
import { createPhonicsRound, phonicsQuestions } from '../src/phonics-engine.js';
import { startTopicRound, topicDefaults } from '../src/chinese-engine.js';
import { createHanziState } from '../src/hanzi-engine.js';
import { hanziLessons } from '../src/hanzi-data.js';
import { chineseTopics } from '../src/chinese-topics.js';
import { mathTopics } from '../src/math-topics.js';
import { phonicsLessons } from '../src/phonics-data.js';
import { initializeRewards, grantRewards, equipReward } from '../src/rewards.js';
import { basics } from '../src/data.js';

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const topicNode = (data, subject, stage, topic) => data.subjects[subject].stages[stage].topics[topic];
const phonicsNode = data => topicNode(data, 'english', 'english-1', 'phonics');
const phonicsCategory = data => phonicsNode(data).categories['lesson-1'];
const pinyinNode = data => topicNode(data, 'chinese', 'chinese-1', 'pinyin');

function completeBackup() {
  const state = defaultState();
  state.nickname = '备份小兔';
  state.known = [basics[0].id];
  state.favorites = [basics[1].id];
  state.hanzi = createHanziState();
  state.hanzi.known.push(hanziLessons[0].id);
  state.settings.animations = false;
  const writing = chineseTopics.find(topic => topic.id === 'sentence-building');
  const lesson = writing.lessons.find(item => item.activity?.type === 'write');
  state.topics[writing.id] = topicDefaults(writing);
  state.topics[writing.id].activities[lesson.id] = { text: '我的草稿', order: [], checked: false, showExample: false };
  state.savedContent.push(`chinese/${writing.id}/lesson/${lesson.id}`);
  const math = mathTopics[0];
  const category = math.categories[0].id;
  const progress = state.topics[math.id] = topicDefaults(math);
  progress.known.push(math.lessons[0].id);
  startTopicRound(math, progress, category);
  recordAnswer(progress.round, progress.round.questions[0].answer);
  state.history.push({ topicId: math.id, category, name: math.name, time: 12, correct: 1, total: 1 });
  const round = createRound('rules', state, 5);
  recordAnswer(round, round.questions[0].answer);
  state.sessions['rules:all:all:retroflex:10'] = round;
  state.phonics.known.push(phonicsLessons[0].words[0].id);
  state.phonics.sessions['rules:lesson:lesson-1:10'] = createPhonicsRound(phonicsQuestions.slice(0, 1));
  state.phonics.sessions['rules:all:lesson-1:10'] = createPhonicsRound(phonicsQuestions.slice(0, 3));
  state.phonics.reviews['rule-1'] = { success: 1, due: 12345 };
  initializeRewards(state);
  grantRewards(state, { type: 'recognize', item: basics[0] });
  equipReward(state.rewards, 'hello-bunny');
  state.rewards.mastery[`${math.id}/${category}`] = {
    version: 1, questionIds: [progress.round.questions[0].id], correctIds: [progress.round.questions[0].id], time: 12,
  };
  return { state, writing, lesson, math, category, text: createBackup(state, new Date('2026-11-18T00:00:00.000Z'), '9.9.9') };
}

test('本机和备份共用四层结构，恢复学习进度、断点、草稿和奖励', () => {
  const { state, writing, lesson, math, category, text } = completeBackup();
  const backup = parseBackup('\uFEFF' + text);
  const { data } = backup;
  assert.equal(appStorageKey, 'bunny-garden-v1');
  assert.equal(backup.version, 1);
  assert.equal(data.version, 1);
  const mathCategory = topicNode(data, 'math', 'math-1', math.id).categories[category];
  const writingCategory = topicNode(data, 'chinese', 'chinese-2', writing.id).categories[lesson.category];
  assert.deepEqual(Object.keys(data), ['version', 'profile', 'settings', 'navigation', 'subjects']);
  assert.equal(data.profile.nickname, state.nickname);
  assert.equal(data.profile.rewards.equipped.sticker, 'hello-bunny');
  assert.equal(Object.keys(data.subjects.chinese.stages['chinese-1'].topics)[0], 'pinyin');
  assert.equal(data.subjects.math.selectedStage, 'math-1');
  assert.equal(data.subjects.math.stages['math-1'].selectedTopic, math.id);
  assert.deepEqual(Object.keys(data.subjects.english.stages), ['english-1']);
  assert.deepEqual(Object.keys(data.subjects.english.stages['english-1'].topics), ['phonics', 'english-vocabulary', 'english-listening', 'english-speaking']);
  assert.equal(Object.keys(phonicsNode(data).categories).length, 48);
  assert.deepEqual(pinyinNode(data).categories.single.known, state.known);
  assert.equal(Object.keys(pinyinNode(data).categories.rules.sessions).length, 1);
  assert.equal(writingCategory.activities[lesson.id].text, '我的草稿');
  assert.deepEqual(writingCategory.savedContent, state.savedContent);
  assert.deepEqual(mathCategory.known, state.topics[math.id].known);
  assert.ok(mathCategory.round.questions.every(question => !('prompt' in question)));
  assert.equal(mathCategory.history[0].correct, 1);
  assert.ok(mathCategory.mastery);
  assert.deepEqual(phonicsCategory(data).known, state.phonics.known);
  assert.ok(phonicsCategory(data).reviews['rule-1']);
  assert.ok(phonicsCategory(data).sessions['rules:lesson:lesson-1:10']);
  assert.ok(phonicsNode(data).sessions['rules:all:lesson-1:10']);
  const local = memoryStorage();
  saveState(local, state);
  assert.deepEqual(JSON.parse(local.getItem(appStorageKey)), data);
  const storage = memoryStorage([['unrelated-site-data', '保留']]);
  restoreBackup(storage, backup);
  assert.deepEqual(JSON.parse(storage.getItem(appStorageKey)), data);
  const loaded = loadState(storage);
  assert.equal(loaded.available, true);
  assert.deepEqual(loaded.state.phonics.sessions, state.phonics.sessions);
  assert.deepEqual(loaded.state.history, state.history);
  assert.deepEqual(loaded.state.rewards, state.rewards);
  assert.deepEqual(loaded.state.topics[math.id].round.questions, state.topics[math.id].round.questions);
  assert.deepEqual(parseBackup(createBackup(loaded.state)).data, data);
  assert.equal(storage.values.size, 2);
  assert.equal(storage.getItem('unrelated-site-data'), '保留');
});

test('记录导出应用版本，导入只要求当前数据格式', () => {
  const { state, text } = completeBackup();
  const backup = parseBackup(text);
  assert.equal(backup.producerVersion, '9.9.9');
  assert.equal(new Date(backup.exportedAt).toISOString(), '2026-11-18T00:00:00.000Z');
  assert.equal(parseBackup(createBackup(state)).producerVersion, appVersion);
  for (const producerVersion of ['0.9.0', '999.0.0']) {
    assert.deepEqual(parseBackup(JSON.stringify({ ...backup, producerVersion })).data, backup.data);
  }
});

test('同版本扩课后可读取本机档和导入备份，仅为新增内容补默认值', () => {
  const { state, text, writing, lesson, math, category } = completeBackup();
  const backup = JSON.parse(text);
  delete backup.data.subjects.english;
  delete backup.data.subjects.chinese.stages['chinese-3'];
  delete backup.data.subjects.chinese.stages['chinese-1'].topics['hanzi-structure'];
  const mathNode = topicNode(backup.data, 'math', 'math-1', math.id);
  const newCategory = Object.keys(mathNode.categories).find(id => id !== category);
  delete mathNode.categories[newCategory];
  delete backup.data.settings.showPinyin;

  const local = memoryStorage([[appStorageKey, JSON.stringify(backup.data)]]);
  const imported = memoryStorage();
  restoreBackup(imported, backup);
  const loaded = loadState(local);
  const full = loadState(memoryStorage([[appStorageKey, JSON.stringify(JSON.parse(text).data)]]));
  assert.equal(loaded.available, true);
  assert.deepEqual(loadState(imported), loaded);
  assert.deepEqual(loaded.state.topics[math.id].round, full.state.topics[math.id].round);
  assert.deepEqual(loaded.state.topics[writing.id].activities[lesson.id], state.topics[writing.id].activities[lesson.id]);
  assert.deepEqual(loaded.state.rewards, state.rewards);
  assert.equal(loaded.state.settings.animations, false);
  assert.equal(loaded.state.settings.showPinyin, defaultState().settings.showPinyin);
  const exported = parseBackup(createBackup(loaded.state)).data;
  assert.deepEqual(phonicsCategory(exported), {});
  assert.deepEqual(topicNode(exported, 'math', 'math-1', math.id).categories[newCategory], {});
});

test('损坏、未发布格式、未来版本、分类错位和危险字段均在写入前拒绝', () => {
  const { text, math, category } = completeBackup();
  const changes = [
    backup => { backup.data = { version: 1, settings: {}, sessions: {}, features: {} }; },
    backup => { backup.version = 999; },
    backup => { backup.data.version = 999; },
    backup => { backup.data.profile.rewards.version = 999; },
    backup => { delete backup.data; },
    backup => { backup.data.settings = []; },
    backup => { pinyinNode(backup.data).categories.single.known = '不是数组'; },
    backup => { pinyinNode(backup.data).categories.initial.known = ['single-a']; },
    backup => { phonicsNode(backup.data).options = []; },
    backup => { backup.data.settings.constructor = {}; },
    backup => { backup.data.subjects.math.selectedStage = 'english-1'; },
    backup => { backup.data.subjects.english.stages['english-1'].selectedTopic = math.id; },
    backup => { phonicsNode(backup.data).categories.unknown = {}; },
    backup => { delete topicNode(backup.data, 'math', 'math-1', math.id).categories[category]; },
  ];
  for (const change of changes) {
    const backup = JSON.parse(text);
    change(backup);
    const storage = memoryStorage([[appStorageKey, '原记录']]);
    assert.throws(() => restoreBackup(storage, backup));
    assert.deepEqual([...storage.values.values()], ['原记录']);
  }
  for (const invalidText of ['{broken', 'null', '{}']) assert.throws(() => parseBackup(invalidText));
});

test('导入使用单次写入，失败时保留原记录', () => {
  const { text } = completeBackup();
  const backup = parseBackup(text);
  const storage = memoryStorage([[appStorageKey, '原记录']]);
  let writes = 0;
  const write = storage.setItem;
  storage.setItem = () => { writes++; throw new Error('QuotaExceededError'); };
  assert.throws(() => restoreBackup(storage, backup), /原有记录已保留/);
  assert.equal(storage.getItem(appStorageKey), '原记录');
  assert.equal(writes, 1);
  storage.setItem = (key, value) => { writes++; write(key, value); };
  storage.getItem = () => { throw new Error('SecurityError'); };
  restoreBackup(storage, backup);
  assert.equal(writes, 2);
  assert.deepEqual(JSON.parse(storage.values.get(appStorageKey)), backup.data);
});
