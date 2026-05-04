import type { StorageBackend, StorageValueType } from '@radar/types';

export const BACKEND_LABELS: Record<StorageBackend, string> = {
  asyncStorage: 'AsyncStorage',
  mmkv: 'MMKV',
};

export const VALUE_TYPE_COLORS: Record<StorageValueType, string> = {
  string: 'text-green-400',
  number: 'text-blue-400',
  boolean: 'text-yellow-400',
};

export const VALUE_TYPE_BG_COLORS: Record<StorageValueType, string> = {
  string: 'bg-green-400/10 text-green-400',
  number: 'bg-blue-400/10 text-blue-400',
  boolean: 'bg-yellow-400/10 text-yellow-400',
};

export const ESTIMATED_ROW_HEIGHT = 36;

export const MAX_VALUE_PREVIEW_LENGTH = 120;
