import { Platform } from 'react-native';
import type { DevicePlatform } from '@radar/types';

type DeviceInfo = {
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
};

export const getDeviceInfo = (): DeviceInfo => ({
  platform: Platform.OS as DevicePlatform,
  osVersion: String(Platform.Version),
  deviceId: `${Platform.OS}-${Date.now()}`,
  deviceName: `${Platform.OS === 'ios' ? 'iOS' : 'Android'} Device`,
});
