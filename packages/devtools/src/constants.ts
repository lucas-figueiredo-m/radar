import { Platform } from 'react-native';

export const DEFAULT_HOST =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const DEFAULT_PORT = 8347;
export const RECONNECT_DELAY_MS = 3000;
export const MAX_QUEUE_SIZE = 1000;
