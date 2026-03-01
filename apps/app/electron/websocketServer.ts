import type { BrowserWindow } from 'electron';
import type { WebSocket as WsWebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import type {
  DevicePlatform,
  DetectedDevice,
  MetadataMessage,
} from '@radar/types';

type ConnectedDevice = {
  socket: WsWebSocket;
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
  projectRoot: string | null;
};

type ParsedMessage = Record<string, string | number | boolean | null>;

export type WebSocketServerHandle = {
  getConnectedDeviceIds: () => string[];
  getDevice: (deviceId: string) => ConnectedDevice | undefined;
  getFirstProjectRoot: () => string | null;
  sendToDevice: (deviceId: string, data: string) => void;
  close: () => void;
};

const isMetadataMessage = (
  message: ParsedMessage,
): message is ParsedMessage & MetadataMessage =>
  message.type === 'metadata' &&
  typeof message.deviceId === 'string' &&
  typeof message.deviceName === 'string' &&
  typeof message.platform === 'string' &&
  typeof message.osVersion === 'string';

const WS_PORT = 8347;

export const startWebSocketServer = (
  win: BrowserWindow,
  getDetectedDevices: () => DetectedDevice[],
): WebSocketServerHandle => {
  const connectedDevices = new Map<string, ConnectedDevice>();
  const socketToDeviceId = new Map<WsWebSocket, string>();

  const sendConnectedDevices = () => {
    win.webContents.send(
      'radar:connected-devices',
      Array.from(connectedDevices.keys()),
    );
  };

  const wss = new WebSocketServer({ port: WS_PORT });

  wss.on('listening', () => {
    console.log(`[radar] WebSocket server listening on port ${WS_PORT}`);
  });

  wss.on('connection', socket => {
    console.log('[radar] Client connected, waiting for metadata...');

    socket.on('message', data => {
      try {
        const message = JSON.parse(data.toString()) as ParsedMessage;

        if (isMetadataMessage(message)) {
          const detected = getDetectedDevices();
          const match = detected.find(
            d =>
              d.platform === message.platform &&
              d.osVersion === message.osVersion,
          );

          const resolvedDeviceId = match?.id ?? message.deviceId;

          const device: ConnectedDevice = {
            socket,
            deviceId: resolvedDeviceId,
            deviceName: match?.name ?? message.deviceName,
            platform: message.platform,
            osVersion: message.osVersion,
            projectRoot: message.projectRoot ?? null,
          };

          connectedDevices.set(resolvedDeviceId, device);
          socketToDeviceId.set(socket, resolvedDeviceId);

          console.log(
            `[radar] Device registered: ${device.deviceName} (${resolvedDeviceId})`,
          );
          console.log('[radar] Project root set to:', message.projectRoot);

          sendConnectedDevices();
          win.webContents.send('radar:device-registered', {
            deviceId: resolvedDeviceId,
          });
          return;
        }

        const deviceId = socketToDeviceId.get(socket);
        if (message.type === 'profilerSession') {
          const commits = Array.isArray(message.commits)
            ? message.commits
            : [];
          console.log(
            `[radar:ws] received profilerSession from device ${deviceId ?? 'unknown'} — ${commits.length} commits`,
          );
        }
        if (deviceId) {
          const stamped = { ...message, deviceId };
          win.webContents.send('radar:message', stamped);
        } else {
          win.webContents.send('radar:message', message);
        }
      } catch (err) {
        console.error('[radar] Failed to parse message:', err);
      }
    });

    socket.on('close', () => {
      const deviceId = socketToDeviceId.get(socket);
      if (deviceId) {
        connectedDevices.delete(deviceId);
        socketToDeviceId.delete(socket);
        console.log(`[radar] Device disconnected: ${deviceId}`);
        sendConnectedDevices();
      } else {
        console.log('[radar] Unregistered client disconnected');
      }
    });
  });

  wss.on('error', err => {
    console.error('[radar] WebSocket server error:', err);
  });

  return {
    getConnectedDeviceIds: () => Array.from(connectedDevices.keys()),
    getDevice: (deviceId: string) => connectedDevices.get(deviceId),
    getFirstProjectRoot: () => {
      for (const device of connectedDevices.values()) {
        if (device.projectRoot) {
          return device.projectRoot;
        }
      }
      return null;
    },
    sendToDevice: (deviceId: string, data: string) => {
      const device = connectedDevices.get(deviceId);
      device?.socket.send(data);
    },
    close: () => {
      wss.close();
    },
  };
};
