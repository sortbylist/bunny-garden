import { defaultState } from './engine.js';
import { decodeLearningData, encodeLearningData } from './learning-data.js';

export const appStorageKey = 'bunny-garden-v2';

export function saveState(storage, state) {
  writeLearningData(storage, encodeLearningData(state));
}

export function writeLearningData(storage, data) {
  storage.setItem(appStorageKey, JSON.stringify(data));
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(appStorageKey);
    return { state: raw === null ? defaultState() : decodeLearningData(JSON.parse(raw)), available: true };
  } catch {
    return { state: defaultState(), available: false };
  }
}
