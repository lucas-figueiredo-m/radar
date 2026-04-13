import type { RadarDatabase } from '@radar/database';

export type WebSocketHandle = {
  getConnectedDeviceIds: () => string[];
  getDevice: (
    deviceId: string,
  ) =>
    | {
        deviceId: string;
        deviceName: string;
        platform: string;
        osVersion: string;
        projectRoot: string | null;
      }
    | undefined;
  sendToDevice: (deviceId: string, data: string) => void;
};

export type McpContext = {
  db: RadarDatabase;
  wsHandle: WebSocketHandle;
};

export type McpServerHandle = {
  close: () => void;
};

export const resolveDeviceId = (
  wsHandle: WebSocketHandle,
  deviceId?: string,
): string => {
  if (deviceId) return deviceId;

  const ids = wsHandle.getConnectedDeviceIds();
  if (ids.length === 0) {
    throw new Error('No devices connected to Radar.');
  }
  if (ids.length === 1) {
    return ids[0];
  }
  throw new Error(
    `Multiple devices connected. Please specify a deviceId. Available: ${ids.join(', ')}`,
  );
};
