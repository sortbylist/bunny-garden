export const appStorageKey = 'bunny-garden-v1';

export function saveState(storage, state) {
  storage.setItem(appStorageKey, JSON.stringify(state));
}
