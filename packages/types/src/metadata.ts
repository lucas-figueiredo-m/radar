import type { DevicePlatform } from './device';

export type MetadataMessage = {
  type: 'metadata';
  projectRoot: string;
  timestamp: number;
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
};
