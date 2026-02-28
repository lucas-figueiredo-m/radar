export const PLATFORM_LABELS = {
  ios: 'iOS',
  android: 'Android',
} as const;

export const STATUS_COLORS = {
  connected: 'bg-status-success',
  'device-only': 'bg-amber-400',
  offline: 'bg-neutral-500',
} as const;

export const STATUS_LABELS = {
  connected: 'Connected',
  'device-only': 'Device running',
  offline: 'Offline',
} as const;
