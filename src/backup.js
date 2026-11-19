import { defaultState, loadState } from './engine.js';
import { phonicsDefaults } from './phonics-engine.js';
import { emptyRewards } from './rewards.js';
import { basics, vocabulary } from './data.js';
import { saveState } from './storage.js';

export const backupFormat = 'bunny-learning-garden';
export const backupVersion = 1;
export const maxBackupBytes = 20 * 1024 * 1024;
export const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = () => { throw new Error('备份内容不完整或数据格式有误，未修改本机记录。'); };

function checkTree(value, depth = 0) {
  if (depth > 80) invalid();
  if (!value || typeof value !== 'object') return;
  for (const [field, entry] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(field)) invalid();
    checkTree(entry, depth + 1);
  }
}

function withDefaults(saved, defaults) {
  if (!isRecord(saved)) invalid();
  const result = { ...saved };
  for (const [field, fallback] of Object.entries(defaults)) {
    const value = saved[field];
    if (value === undefined) result[field] = structuredClone(fallback);
    else if (Array.isArray(fallback)) {
      if (!Array.isArray(value)) invalid();
    } else if (isRecord(fallback)) result[field] = withDefaults(value, fallback);
    else if (fallback !== null && (typeof value !== typeof fallback || typeof value === 'number' && !Number.isFinite(value))) invalid();
  }
  return result;
}

function checkStringArrays(saved, fields) {
  for (const field of fields) {
    if (!Array.isArray(saved[field]) || !saved[field].every(value => typeof value === 'string')) invalid();
  }
}

function checkQuestion(question) {
  if (!isRecord(question) || typeof question.id !== 'string' || typeof question.kind !== 'string' || typeof question.answer !== 'string' || !Array.isArray(question.options)) invalid();
  if (!question.options.every(option => typeof option === 'string' || isRecord(option) && typeof option.value === 'string' && typeof option.sound === 'string')) invalid();
  if (question.kind === 'blend') checkStringArrays(question, ['parts']);
}

function migrateGarden(saved) {
  if (!isRecord(saved)) invalid();
  if (saved.version !== 1) throw new Error('不支持此学习数据版本，请使用兼容的新版本应用导入。');
  const state = withDefaults(saved, defaultState());
  state.phonics = migratePhonics(state.phonics);
  checkStringArrays(state, ['seen', 'known', 'favorites']);
  if (state.hanzi !== null && !isRecord(state.hanzi)) invalid();
  if (!state.history.every(entry => isRecord(entry) && typeof entry.name === 'string' && Number.isFinite(entry.time) && Number.isFinite(entry.correct) && Number.isFinite(entry.total))) invalid();
  if (!state.mistakes.every(entry => isRecord(entry) && isRecord(entry.question))) invalid();
  state.mistakes.forEach(entry => checkQuestion(entry.question));
  for (const session of Object.values(state.sessions)) {
    if (!isRecord(session)) invalid();
    for (const field of ['ids', 'pairs', 'right', 'matched', 'wrong']) {
      if (session[field] !== undefined) checkStringArrays(session, [field]);
    }
    if (session.pairs) {
      checkStringArrays(session, ['right', 'matched', 'wrong']);
      const itemIds = new Set([...basics, ...vocabulary].map(item => item.id));
      if (![...session.pairs, ...session.right].every(id => itemIds.has(id))) invalid();
      if (session.left !== null && !itemIds.has(session.left)) invalid();
    }
    if (session.questions !== undefined) {
      if (!Array.isArray(session.questions) || !Array.isArray(session.responses) || !session.responses.every(value => value === null || isRecord(value))) invalid();
      session.questions.forEach(checkQuestion);
    }
  }
  for (const topic of Object.values(state.topics)) {
    if (!isRecord(topic)) invalid();
    if (topic.known !== undefined) checkStringArrays(topic, ['known']);
  }
  if (state.rewards !== null) {
    if (state.rewards.version !== 1) throw new Error('不支持此奖励数据版本，请使用兼容的新版本应用导入。');
    state.rewards = withDefaults(state.rewards, emptyRewards());
    checkStringArrays(state.rewards, ['pending']);
    if (!state.rewards.events.every(event => isRecord(event) && typeof event.id === 'string' && typeof event.kind === 'string' && Number.isFinite(event.stars) && event.stars >= 0)) invalid();
  }
  if (!loadState({ getItem: () => JSON.stringify(state) }).available) invalid();
  return state;
}

function migratePhonics(saved) {
  if (!isRecord(saved)) invalid();
  if (saved.version !== 1 || saved.locale !== 'en-GB') throw new Error('不支持此英语数据版本，请使用兼容的新版本应用导入。');
  const state = withDefaults(saved, phonicsDefaults());
  checkStringArrays(state, ['seen', 'known', 'favorites', 'mistakes']);
  return state;
}

const backupMigrations = {
  1: backup => {
    return {
      ...backup,
      data: migrateGarden(backup.data),
    };
  },
};

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > maxBackupBytes) {
    throw new Error('备份文件过大，请选择不超过 20 MB 的 JSON 备份。');
  }
  let backup;
  try { backup = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('无法读取 JSON，请选择由小兔学习乐园导出的备份文件。'); }
  if (!isRecord(backup) || backup.format !== backupFormat) throw new Error('这不是小兔学习乐园的备份文件。');
  if (!Number.isInteger(backup.version) || !Object.hasOwn(backupMigrations, backup.version)) {
    throw new Error('不支持此备份版本，请更新应用后导入；本机记录未修改。');
  }
  checkTree(backup);
  return backupMigrations[backup.version](backup);
}

export function createBackup(state, date = new Date(), producerVersion = appVersion) {
  const text = JSON.stringify({
    format: backupFormat, version: backupVersion, producerVersion, exportedAt: date.toISOString(),
    data: state,
  }, null, 2);
  parseBackup(text);
  return text;
}

export function restoreBackup(storage, backup) {
  const checked = parseBackup(JSON.stringify(backup));
  try {
    saveState(storage, checked.data);
  } catch {
    throw new Error('导入失败，原有记录已保留。请检查浏览器存储权限或可用空间。');
  }
}
