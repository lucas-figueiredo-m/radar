import type { StorageEntry, StorageValueType } from '@radar/types';
import type { MMKVAPI } from './detectBackends';

const detectValueType = (
  instance: MMKVAPI,
  key: string,
): { value: string; valueType: StorageValueType } => {
  const strVal = instance.getString(key);
  if (strVal !== undefined) {
    return { value: strVal, valueType: 'string' };
  }

  const numVal = instance.getNumber(key);
  if (numVal !== undefined && !Number.isNaN(numVal)) {
    return { value: String(numVal), valueType: 'number' };
  }

  const boolVal = instance.getBoolean(key);
  if (boolVal !== undefined) {
    return { value: String(boolVal), valueType: 'boolean' };
  }

  return { value: '', valueType: 'string' };
};

export const createMMKVAdapter = (instance: MMKVAPI) => {
  const getAllEntries = (): StorageEntry[] => {
    const keys = instance.getAllKeys();
    return keys.map(key => {
      const { value, valueType } = detectValueType(instance, key);
      return { key, value, valueType };
    });
  };

  const setEntry = (
    key: string,
    value: string,
    valueType: StorageValueType,
  ): void => {
    if (valueType === 'number') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        instance.set(key, num);
        return;
      }
    }
    if (valueType === 'boolean') {
      instance.set(key, value === 'true');
      return;
    }
    instance.set(key, value);
  };

  const removeEntry = (key: string): void => {
    // v4 uses remove(), v3 uses delete()
    if (typeof instance.remove === 'function') {
      instance.remove(key);
    } else if (typeof instance.delete === 'function') {
      instance.delete(key);
    }
  };

  const clearAll = (): void => {
    instance.clearAll();
  };

  return { getAllEntries, setEntry, removeEntry, clearAll };
};
