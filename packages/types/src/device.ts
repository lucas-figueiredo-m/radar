export type DevicePlatform = 'ios' | 'android';

export type DeviceConnectionStatus = 'connected' | 'device-only' | 'offline';

export type DetectedDevice = {
  id: string;
  name: string;
  platform: DevicePlatform;
  osVersion: string;
};

export type Device = DetectedDevice & {
  connectionStatus: DeviceConnectionStatus;
  projectRoot: string | null;
};

export type CliToolStatus = {
  tool: 'xcrun' | 'adb';
  available: boolean;
  error: string | null;
};
