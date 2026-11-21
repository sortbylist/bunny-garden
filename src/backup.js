import { dataVersion, decodeLearningData, encodeLearningData, isRecord } from './learning-data.js';
import { writeLearningData } from './storage.js';

export const backupFormat = 'bunny-learning-garden';
export const backupVersion = dataVersion;
export const maxBackupBytes = 20 * 1024 * 1024;
export const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';

function localExportTime(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetMagnitude = Math.abs(offsetMinutes);
  const hours = String(Math.floor(offsetMagnitude / 60)).padStart(2, '0');
  const minutes = String(offsetMagnitude % 60).padStart(2, '0');
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const localTime = new Date(date.getTime() + offsetMinutes * 60000).toISOString().slice(0, -1);
  return `${localTime}${sign}${hours}:${minutes}`;
}

export function backupFilename(date) {
  const timestamp = localExportTime(date).replace(/[:.]/g, '-');
  return `小兔学习乐园-完整备份-${timestamp}.json`;
}

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > maxBackupBytes) {
    throw new Error('备份文件过大，请选择不超过 20 MB 的 JSON 备份。');
  }
  let backup;
  try { backup = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('无法读取 JSON，请选择由小兔学习乐园导出的备份文件。'); }
  if (!isRecord(backup) || backup.format !== backupFormat) throw new Error('这不是小兔学习乐园的备份文件。');
  if (backup.version !== backupVersion || backup.data?.version !== dataVersion) {
    throw new Error('不支持此备份版本，本机记录未修改。');
  }
  if (typeof backup.producerVersion !== 'string' || typeof backup.exportedAt !== 'string' ||
      !Number.isFinite(Date.parse(backup.exportedAt)) || Object.keys(backup).length !== 5) {
    throw new Error('备份信息格式有误，本机记录未修改。');
  }
  decodeLearningData(backup.data);
  return backup;
}

export function createBackup(state, date = new Date(), producerVersion = appVersion) {
  const text = JSON.stringify({
    format: backupFormat,
    version: backupVersion,
    producerVersion,
    exportedAt: localExportTime(date),
    data: encodeLearningData(state),
  }, null, 2);
  parseBackup(text);
  return text;
}

export function restoreBackup(storage, backup) {
  const checked = parseBackup(JSON.stringify(backup));
  try {
    writeLearningData(storage, checked.data);
  } catch {
    throw new Error('导入失败，原有记录已保留。请检查浏览器存储权限或可用空间。');
  }
}
