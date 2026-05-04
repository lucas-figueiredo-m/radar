import type { StorageEntry } from '@radar/types';
import type { AsyncStorageAPI } from './detectBackends';

export const createAsyncStorageAdapter = (asyncStorage: AsyncStorageAPI) => {
  const getAllEntries = async (): Promise<StorageEntry[]> => {
    const keys = await asyncStorage.getAllKeys();
    if (keys.length === 0) return [];

    // v3 uses getMany (returns Record), v2 uses multiGet (returns tuples)
    if (typeof asyncStorage.getMany === 'function') {
      const record = await asyncStorage.getMany(keys);
      return Object.entries(record).map(([key, value]) => ({
        key,
        value: value ?? '',
        valueType: 'string' as const,
      }));
    }

    if (typeof asyncStorage.multiGet === 'function') {
      const pairs = await asyncStorage.multiGet(keys);
      return pairs.map(([key, value]) => ({
        key,
        value: value ?? '',
        valueType: 'string' as const,
      }));
    }

    // Fallback: getItem one by one
    const entries: StorageEntry[] = [];
    for (const key of keys) {
      const value = await asyncStorage.getItem(key);
      entries.push({ key, value: value ?? '', valueType: 'string' });
    }
    return entries;
  };

  const setEntry = async (key: string, value: string): Promise<void> => {
    await asyncStorage.setItem(key, value);
  };

  const removeEntry = async (key: string): Promise<void> => {
    await asyncStorage.removeItem(key);
  };

  const clearAll = async (): Promise<void> => {
    await asyncStorage.clear();
  };

  return { getAllEntries, setEntry, removeEntry, clearAll };
};
