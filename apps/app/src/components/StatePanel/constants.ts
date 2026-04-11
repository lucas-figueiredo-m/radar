import type { StateStoreType } from '@radar/types';

export const STORE_TYPE_LABELS: Record<StateStoreType, string> = {
  zustand: 'Zustand',
  redux: 'Redux',
  other: 'Store',
};

export const STORE_TYPE_COLORS: Record<StateStoreType, string> = {
  zustand: 'bg-purple-400/10 text-purple-400',
  redux: 'bg-violet-400/10 text-violet-400',
  other: 'bg-gray-400/10 text-gray-400',
};
