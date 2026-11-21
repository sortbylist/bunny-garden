import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { alphabet, phonicsModules, phonicsLessons, phonicsWords, phonicsStories, phonicsSentences } from '../src/phonics-data.js';
import { phonicsDefaults, phonicsQuestions, questionPool, createPhonicsRound, answerPhonics, advancePhonicsRound, phonicsStats, normalizePhonicsState, availablePhonicsAudio, shufflePhonics } from '../src/phonics-engine.js';
import { defaultState } from '../src/engine.js';
import { loadState } from '../src/storage.js';
import { appStorageKey, saveState } from '../src/storage.js';
import { encodeLearningData } from '../src/learning-data.js';

test('拼读课程覆盖 12 模块、48 课、600 以上去重词形、36 篇共读与 120 以上短句', () => {
  assert.equal(phonicsModules.length, 12);
  assert.equal(phonicsLessons.length, 48);
  assert.equal(phonicsModules.reduce((total, module) => total + module.count, 0), 48);
  for (const module of phonicsModules) assert.equal(phonicsLessons.filter(lesson => lesson.moduleId === module.id).length, module.count);
  assert.ok(phonicsWords.length >= 600);
  assert.equal(new Set(phonicsWords.map(word => word.id)).size, phonicsWords.length);
  assert.ok(phonicsWords.every(word => word.text && word.meaning && phonicsLessons.some(lesson => lesson.id === word.lessonId)));
  assert.equal(phonicsStories.length, 36);
  assert.ok(phonicsSentences.length >= 120);
  assert.ok(phonicsStories.every(story => story.type === 'guided-reading' && story.prerequisites && story.locale === 'en-GB'));
  assert.equal(alphabet.length, 26);
  assert.equal(alphabet.at(-1).name, 'zed');
  assert.ok(phonicsLessons[6].tip.includes('/ɒ/'));
  assert.ok(phonicsLessons[28].tip.includes('/kɑː/'));
  assert.ok(phonicsWords.some(word => word.text === 'colour'));
  assert.ok(!phonicsWords.some(word => word.text === 'color'));
});

test('文字题超过 960 道，标识唯一、选项不重复、答案唯一存在', () => {
  assert.ok(phonicsQuestions.filter(question => question.kind !== 'listen').length >= 960);
  assert.equal(new Set(phonicsQuestions.map(question => question.id)).size, phonicsQuestions.length);
  for (const question of phonicsQuestions) {
    if (question.kind === 'spelling') { assert.equal(question.letters.join(''), question.answer); continue; }
    assert.equal(question.options.filter(option => option === question.answer).length, 1, question.id);
    assert.equal(new Set(question.options).size, question.options.length, question.id);
  }
});

test('当前课按词成员筛选；全部课程不越过题型边界', () => {
  const state = phonicsDefaults();
  state.mode = 'meaning';
  const pool = questionPool(state);
  assert.equal(pool.length, phonicsLessons[0].words.length);
  assert.ok(pool.every(question => question.kind === 'meaning'));
  state.scope = 'all';
  assert.equal(questionPool(state).length, phonicsWords.length);
  state.mode = 'diagnostic';
  assert.equal(questionPool(state).length, 10);
});

test('洗牌不重复不漏题，范围少于题量时不凑数', () => {
  const pool = phonicsLessons.map(lesson => lesson.rule).slice(0, 4);
  const original = pool.map(question => question.id);
  const round = createPhonicsRound(pool, 10, () => 0.3);
  assert.deepEqual([...round.ids].sort(), [...original].sort());
  assert.equal(new Set(round.ids).size, 4);
  assert.deepEqual(pool.map(question => question.id), original);
  assert.deepEqual(shufflePhonics([]), []);
});

test('首次错误后重试不改正确率，跳过独立记录，结束只写一次历史', () => {
  const state = phonicsDefaults();
  const pool = phonicsLessons.slice(0, 2).map(lesson => lesson.rule);
  const round = createPhonicsRound(pool, 2, () => 0.9);
  const first = pool.find(question => question.id === round.ids[0]);
  answerPhonics(state, round, '错误', 1000);
  assert.equal(advancePhonicsRound(state, round, 'test'), false);
  answerPhonics(state, round, first.answer, 2000);
  assert.equal(phonicsStats(round).correct, 0);
  assert.ok(state.mistakes.includes(first.id));
  advancePhonicsRound(state, round, 'test');
  answerPhonics(state, round, null, 3000);
  advancePhonicsRound(state, round, 'test');
  assert.equal(round.finished, true);
  assert.deepEqual(phonicsStats(round), { total: 2, answered: 2, correct: 0, skipped: 1 });
  advancePhonicsRound(state, round, 'test');
  assert.equal(state.history.length, 1);
  assert.equal(answerPhonics(state, round, first.answer), null);
});

test('独立新轮改正后移出错题并安排复习，1/3/7 天不宣传为诊断', () => {
  const state = phonicsDefaults();
  const question = phonicsLessons[0].rule;
  state.mistakes.push(question.id);
  for (const [index, days] of [1, 3, 7].entries()) {
    const round = createPhonicsRound([question], 1);
    answerPhonics(state, round, question.answer, 1000);
    assert.equal(state.reviews[question.id].success, index + 1);
    assert.equal(state.reviews[question.id].due, 1000 + days * 86400000);
  }
  assert.deepEqual(state.mistakes, []);
});

test('只使用已就绪的英式 gTTS 本地 MP3，不依赖人工审核字段且目标文本匹配', async () => {
  const good = { path: '/audio/phonics/word-map.mp3', text: 'map', locale: 'en-GB', status: 'ready', provider: 'gtts', lang: 'en', tld: 'co.uk' };
  assert.equal(availablePhonicsAudio(good), true);
  for (const changes of [{ locale: 'en-US' }, { status: 'pending' }, { provider: 'unknown' }, { tld: 'com' }, { lang: 'fr' }, { text: 'a map' }, { text: '' }, { path: 42 }, { path: 'https://example.com/map.mp3' }, { path: '/audio/phonics/../word-map.mp3' }]) {
    assert.equal(availablePhonicsAudio({ ...good, ...changes }), false);
  }
  const manifest = JSON.parse(await readFile(new URL('../public/audio/phonics/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.locale, 'en-GB');
  assert.ok(Object.values(manifest.files).every(availablePhonicsAudio));
  const state = { ...phonicsDefaults(), mode: 'listen', scope: 'all' };
  assert.equal(questionPool(state).length, 0);
  assert.ok(questionPool(state, () => true).every(question => question.wordId !== 'word-sea' && question.wordId !== 'word-see'));
});

test('英语从四层数据恢复收藏和拼写草稿，不影响语文', () => {
  const state = { ...phonicsDefaults(), mode: 'spelling' };
  state.favorites = ['word-cat'];
  const round = createPhonicsRound(phonicsQuestions.filter(question => question.kind === 'spelling').slice(0, 2), 2);
  round.drafts[round.ids[0]] = 'ma';
  const key = 'spelling:lesson:lesson-1:10';
  state.sessions[key] = round;
  const root = defaultState();
  root.nickname = '统一存储小兔';
  root.known = ['initial-b'];
  root.phonics = state;
  const calls = [];
  const loaded = loadState({ getItem: storageKey => { calls.push(storageKey); return JSON.stringify(encodeLearningData(root)); } });
  assert.deepEqual(calls, [appStorageKey]);
  assert.equal(loaded.available, true);
  assert.equal(loaded.state.nickname, root.nickname);
  assert.deepEqual(loaded.state.known, root.known);
  assert.deepEqual(loaded.state.phonics.favorites, ['word-cat']);
  assert.deepEqual(loaded.state.phonics.sessions[key].ids, round.ids);
  assert.equal(loaded.state.phonics.sessions[key].drafts[round.ids[0]], 'ma');
  assert.deepEqual(loaded.state.phonics.history, []);
  const writes = [];
  saveState({ setItem: (storageKey, value) => writes.push([storageKey, JSON.parse(value)]) }, loaded.state);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], appStorageKey);
  assert.equal(writes[0][1].profile.nickname, root.nickname);
  const categories = Object.values(writes[0][1].subjects.english.stages).flatMap(stage =>
    Object.values(stage.topics).flatMap(topic => Object.values(topic.categories)));
  assert.deepEqual(categories.flatMap(category => category.favorites || []), ['word-cat']);
});

test('损坏的英语分支无法作为有效本机数据读取', () => {
  const data = encodeLearningData(defaultState());
  data.subjects.english.stages['english-1'].topics.phonics = null;
  assert.equal(loadState({ getItem: () => JSON.stringify(data) }).available, false);
  assert.deepEqual(normalizePhonicsState(undefined), phonicsDefaults());
});

test('旧备份中的规律和达标练习转到普通练习并保留历史轮次', () => {
  for (const mode of ['rules', 'assessment']) {
    const root = defaultState();
    Object.assign(root.phonics, { mode, lessonId: 'lesson-4' });
    const key = `${mode}:lesson:lesson-4:10`;
    root.phonics.sessions[key] = createPhonicsRound([phonicsQuestions.find(question => question.id === 'rule-4')]);
    const data = encodeLearningData(root);
    const restored = loadState({ getItem: () => JSON.stringify(data) }).state.phonics;
    assert.equal(restored.mode, 'mixed');
    assert.equal(restored.lessonId, 'lesson-4');
    assert.equal(restored.scope, 'lesson');
    assert.deepEqual(restored.sessions[key].ids, ['rule-4']);
  }
});
