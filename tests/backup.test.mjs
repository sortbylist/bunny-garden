import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBackup, parseBackup, restoreBackup, appVersion } from '../src/backup.js';
import { appStorageKey } from '../src/storage.js';
import { defaultState, loadState, createRound, recordAnswer } from '../src/engine.js';
import { createPhonicsRound, phonicsQuestions } from '../src/phonics-engine.js';
import { basics } from '../src/data.js';
import { initializeRewards, grantRewards, equipReward, rewardStats } from '../src/rewards.js';

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    values, getItem: storageKey => values.get(storageKey) ?? null,
    setItem: (storageKey, value) => values.set(storageKey, value),
    removeItem: storageKey => values.delete(storageKey),
  };
}

function completeBackup() {
  const garden = defaultState();
  garden.nickname = '备份小兔';
  garden.known = [basics[0].id];
  garden.favorites = [basics[1].id];
  garden.navigationSelections = { chinese: 'pinyin' };
  garden.settings.animations = false;
  garden.hanzi = { known: ['stroke-heng'], showPinyin: false };
  garden.topics = { sample: { known: ['lesson-a'], activities: { writing: { text: '我的草稿', order: [2, 0, 1] } } } };
  const round = createRound('rules', garden, 5);
  recordAnswer(round, round.questions[0].answer);
  garden.sessions['rules:all:all:retroflex:10'] = round;
  initializeRewards(garden);
  grantRewards(garden, { type: 'recognize', item: basics[0] });
  equipReward(garden.rewards, 'hello-bunny');
  garden.rewards.mastery.example = { version: 1, questionIds: ['q1'], correctIds: ['q1'], time: 1 };
  const english = garden.phonics;
  english.slow = true;
  english.sessions.example = createPhonicsRound(phonicsQuestions.slice(0, 2), 2);
  english.reviews['rule-1'] = { success: 1, due: 12345 };
  english.extension = { preserved: '扩展字段' };
  return { garden, english, text: createBackup(garden, new Date('2026-11-18T00:00:00.000Z'), '9.9.9') };
}

test('完整备份逐字段保留配置、三科记录、草稿、奖励、展示及英语进度', () => {
  const { garden, english, text } = completeBackup();
  const backup = parseBackup(text);
  assert.deepEqual(backup.data, garden);
  assert.deepEqual(backup.data.phonics, english);
  const storage = memoryStorage([['unrelated-site-data', '保留']]);
  restoreBackup(storage, backup);
  assert.deepEqual(JSON.parse(storage.getItem(appStorageKey)), garden);
  assert.equal(storage.values.size, 2);
  assert.equal(storage.getItem('unrelated-site-data'), '保留');
});

test('记录导出应用版本，但导入不比较应用版本，只由格式与数据版本决定兼容', () => {
  const { garden, english, text } = completeBackup();
  const backup = JSON.parse(text);
  assert.equal(backup.producerVersion, '9.9.9');
  assert.equal(backup.exportedAt, '2026-11-18T00:00:00.000Z');
  assert.equal(createBackup(garden).includes(`"producerVersion": "${appVersion}"`), true);
  for (const producerVersion of ['0.9.0', '999.0.0', undefined]) {
    const file = { ...backup, producerVersion };
    if (producerVersion === undefined) delete file.producerVersion;
    assert.deepEqual(parseBackup(JSON.stringify(file)).data, parseBackup(text).data);
    const storage = memoryStorage();
    restoreBackup(storage, file);
    assert.deepEqual(JSON.parse(storage.getItem(appStorageKey)), garden);
    assert.deepEqual(JSON.parse(storage.getItem(appStorageKey)).phonics, english);
    assert.equal(storage.values.size, 1);
  }
});

test('固定 v1 备份补齐新增字段，恢复统一根数据且不重复发放星星', async () => {
  const text = await readFile(new URL('./fixtures/backup-v1.json', import.meta.url), 'utf8');
  const backup = parseBackup('\uFEFF' + text);
  const storage = memoryStorage();
  restoreBackup(storage, backup);
  const state = loadState(storage).state;
  const english = state.phonics;
  assert.equal(state.nickname, '历史小兔');
  assert.equal(state.settings.slow, true);
  assert.equal(state.settings.effects, false);
  assert.equal(state.settings.animations, true);
  assert.equal(state.mode, 'sequence');
  assert.equal(state.group, 'initial');
  assert.deepEqual(state.topics, {});
  assert.deepEqual(english.reviews, {});
  assert.equal(english.lessonId, 'lesson-2');
  assert.equal(state.settings.showPinyin, true);
  assert.equal(english.slow, undefined);
  assert.equal(state.rewards.equipped.sticker, 'curious-glass');
  assert.deepEqual(state.rewards.mastery, {});
  initializeRewards(state);
  const stars = rewardStats(state.rewards).stars;
  initializeRewards(state);
  assert.equal(rewardStats(state.rewards).stars, stars);
  assert.equal(state.rewards.unlocks['curious-glass'], 1794960000000);
});

test('损坏、未来版本、错误类型及危险字段均在写入前拒绝', () => {
  const { text } = completeBackup();
  const changes = [
    backup => { backup.version = 999; },
    backup => { backup.data.version = 999; },
    backup => { backup.data.phonics.version = 999; },
    backup => { backup.data.rewards.version = 999; },
    backup => { delete backup.data; },
    backup => { backup.data.settings = []; },
    backup => { backup.data.known = '不是数组'; },
    backup => { backup.data.history = [{ name: '错误记录', correct: '<img>', total: 1, time: 1 }]; },
    backup => { backup.data.phonics = []; },
    backup => { backup.data.settings.constructor = {}; },
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

test('统一存储写入失败时保留全部原记录，不产生部分导入', () => {
  const { text } = completeBackup();
  for (const original of ['原学习记录', null]) {
    const storage = memoryStorage();
    if (original !== null) storage.setItem(appStorageKey, original);
    let writes = 0;
    storage.setItem = () => { writes++; throw new Error('QuotaExceededError'); };
    assert.throws(() => restoreBackup(storage, parseBackup(text)), /原有记录已保留/);
    assert.equal(storage.getItem(appStorageKey), original);
    assert.equal(writes, 1);
  }
});

test('导入通过单次统一写入完成，不依赖其他分类读取或回滚', () => {
  const { text } = completeBackup();
  const backup = parseBackup(text);
  let writes = 0;
  const storage = memoryStorage();
  const write = storage.setItem;
  storage.setItem = (storageKey, value) => { writes++; write(storageKey, value); };
  storage.getItem = () => { throw new Error('SecurityError'); };
  restoreBackup(storage, backup);
  assert.equal(writes, 1);
  assert.deepEqual(JSON.parse(storage.values.get(appStorageKey)), backup.data);
  assert.equal(storage.values.size, 1);
});
