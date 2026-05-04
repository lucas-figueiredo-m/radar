import type { StorageBackendInfo, StateStoreInfo } from '@radar/types';

type AsyncStorageModule = {
  default: {
    getAllKeys: () => Promise<string[]>;
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    // v3 API
    getMany?: (keys: string[]) => Promise<Record<string, string | null>>;
    // v2 legacy API
    multiGet?: (keys: string[]) => Promise<[string, string | null][]>;
  };
};

type MMKVInstance = {
  getAllKeys: () => string[];
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  getBoolean: (key: string) => boolean | undefined;
  set: (key: string, value: string | number | boolean) => void;
  delete?: (key: string) => boolean;
  remove?: (key: string) => boolean;
  clearAll: () => void;
  contains: (key: string) => boolean;
};

export type AsyncStorageAPI = AsyncStorageModule['default'];
export type MMKVAPI = MMKVInstance;

export const detectAsyncStorage = (): AsyncStorageAPI | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as Record<
      string,
      unknown
    >;
    // v2: mod.default is the API; v3: mod itself or mod.default may be the API
    const api = (mod.default ?? mod) as AsyncStorageAPI;
    if (typeof api.getAllKeys !== 'function') return null;
    return api;
  } catch {
    return null;
  }
};

export const detectMMKVDefault = (): MMKVAPI | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-mmkv') as Record<string, unknown>;
    // v4: createMMKV(), v3: new MMKV()
    const createFn = mod.createMMKV as (() => MMKVInstance) | undefined;
    if (typeof createFn === 'function') {
      const instance = createFn();
      if (typeof instance.getAllKeys === 'function') return instance;
    }
    const MMKVClass = mod.MMKV as (new () => MMKVInstance) | undefined;
    if (typeof MMKVClass === 'function') {
      const instance = new MMKVClass();
      if (typeof instance.getAllKeys === 'function') return instance;
    }
    return null;
  } catch {
    return null;
  }
};

export const buildStorageBackendInfos = (
  asyncStorage: AsyncStorageAPI | null,
  mmkvInstances: Record<string, MMKVAPI>,
): StorageBackendInfo[] => {
  const backends: StorageBackendInfo[] = [];

  backends.push({
    backend: 'asyncStorage',
    available: asyncStorage !== null,
  });

  const mmkvKeys = Object.keys(mmkvInstances);
  if (mmkvKeys.length === 0) {
    backends.push({
      backend: 'mmkv',
      available: false,
    });
  } else {
    for (const instanceId of mmkvKeys) {
      backends.push({
        backend: 'mmkv',
        available: true,
        instanceId,
      });
    }
  }

  return backends;
};

export type StoreRegistration = {
  getState: () => Record<string, unknown>;
  subscribe: (listener: (state: Record<string, unknown>) => void) => () => void;
};

export const detectStoreType = (
  store: Record<string, unknown>,
): StateStoreInfo['storeType'] => {
  if (
    typeof store.getState === 'function' &&
    typeof store.subscribe === 'function' &&
    typeof store.setState === 'function'
  ) {
    if (typeof (store as Record<string, unknown>).dispatch === 'function') {
      return 'redux';
    }
    return 'zustand';
  }
  if (
    typeof store.getState === 'function' &&
    typeof store.subscribe === 'function' &&
    typeof (store as Record<string, unknown>).dispatch === 'function'
  ) {
    return 'redux';
  }
  return 'other';
};
