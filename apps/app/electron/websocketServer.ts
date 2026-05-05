import type { BrowserWindow } from 'electron';
import type { WebSocket as WsWebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import type {
  DevicePlatform,
  DetectedDevice,
  RadarMessage,
} from '@radar/types';
import { radarMessageSchema } from '@radar/types';
import type { RadarDatabase } from '@radar/database';

type ConnectedDevice = {
  socket: WsWebSocket;
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
  projectRoot: string | null;
};

export type WebSocketServerHandle = {
  getConnectedDeviceIds: () => string[];
  getDevice: (deviceId: string) => ConnectedDevice | undefined;
  getFirstProjectRoot: () => string | null;
  sendToDevice: (deviceId: string, data: string) => void;
  close: () => void;
};

const WS_PORT = 8347;
const WS_HOST = '0.0.0.0';
const WS_MAX_PAYLOAD_BYTES = 32 * 1024 * 1024;

const NOTIFICATION_CHANNELS: Record<string, string> = {
  console: 'radar:db:console:changed',
  network: 'radar:db:network:changed',
  componentTree: 'radar:db:componentTree:changed',
  inspectComponent: 'radar:db:inspectedComponent:changed',
  profilerSession: 'radar:db:profiler:changed',
  performanceMetric: 'radar:db:performance:changed',
  storageCapabilities: 'radar:db:storage:capabilities:changed',
  storageData: 'radar:db:storage:changed',
  stateCapabilities: 'radar:db:state:capabilities:changed',
  stateSnapshot: 'radar:db:state:changed',
  stateAction: 'radar:db:state:action:changed',
  startupMetrics: 'radar:db:startup:changed',
};

const notifyRenderer = (
  win: BrowserWindow,
  deviceId: string,
  message: RadarMessage,
): void => {
  const channel = NOTIFICATION_CHANNELS[message.type];
  if (!channel) return;

  const payload =
    message.type === 'inspectComponent'
      ? { deviceId, componentId: message.componentId }
      : { deviceId };

  win.webContents.send(channel, payload);
};

const persistMessage = (
  db: RadarDatabase,
  deviceId: string,
  message: RadarMessage,
): void => {
  try {
    switch (message.type) {
      case 'console': {
        db.console.insert({
          device_id: deviceId,
          level: message.level,
          args: JSON.stringify(message.args),
          timestamp: message.timestamp,
        });
        break;
      }
      case 'network': {
        if (message.event === 'request') {
          db.network.insertRequest({
            id: message.id,
            device_id: deviceId,
            method: message.method,
            url: message.url,
            request_headers: message.requestHeaders
              ? JSON.stringify(message.requestHeaders)
              : null,
            request_body:
              message.requestBody !== undefined
                ? JSON.stringify(message.requestBody)
                : null,
            graphql_type: message.graphql?.operationType ?? null,
            graphql_name: message.graphql?.operationName ?? null,
            timestamp: message.timestamp,
          });
        } else {
          db.network.updateResponse({
            id: message.id,
            status: message.status ?? null,
            status_text: message.statusText ?? null,
            response_headers: message.responseHeaders
              ? JSON.stringify(message.responseHeaders)
              : null,
            response_body:
              message.responseBody !== undefined
                ? JSON.stringify(message.responseBody)
                : null,
            duration: message.duration ?? null,
            response_timestamp: message.timestamp ?? null,
          });
        }
        break;
      }
      case 'componentTree': {
        db.componentTree.insert({
          device_id: deviceId,
          root_nodes: JSON.stringify(message.rootNodes),
          timestamp: message.timestamp,
        });
        break;
      }
      case 'inspectComponent': {
        if (message.data) {
          db.inspectedComponent.upsert({
            device_id: deviceId,
            component_id: message.componentId,
            data: JSON.stringify(message.data),
            timestamp: message.timestamp,
          });
        }
        break;
      }
      case 'profilerSession': {
        const session = db.profiler.insertSession({
          device_id: deviceId,
          timestamp: message.timestamp,
        });
        for (const commit of message.commits) {
          db.profiler.insertCommit({
            profiler_session_id: session.id,
            device_id: deviceId,
            commit_index: commit.index,
            timestamp: commit.timestamp,
            duration: commit.duration,
            components: JSON.stringify(commit.components),
          });
        }
        break;
      }
      case 'performanceMetric': {
        db.performance.insert({
          device_id: deviceId,
          js_fps: message.jsFps,
          ui_fps: message.uiFps,
          js_heap: message.jsHeap,
          native_ram: message.nativeRam,
          cpu_usage: message.cpuUsage,
          dropped_frames: message.droppedFrames,
          gc_events: message.gcEvents,
          timestamp: message.timestamp,
        });
        break;
      }
      case 'storageCapabilities': {
        for (const backend of message.backends) {
          db.storage.upsertCapability({
            device_id: deviceId,
            backend: backend.backend,
            available: backend.available ? 1 : 0,
            instance_id: backend.instanceId ?? null,
          });
        }
        break;
      }
      case 'storageData': {
        db.storage.replaceEntries(
          deviceId,
          message.backend,
          message.instanceId ?? null,
          message.entries.map(e => ({
            device_id: deviceId,
            backend: message.backend,
            instance_id: message.instanceId ?? null,
            key: e.key,
            value: e.value,
            value_type: e.valueType,
            timestamp: message.timestamp,
          })),
        );
        break;
      }
      case 'stateCapabilities': {
        for (const store of message.stores) {
          db.state.upsertCapability({
            device_id: deviceId,
            store_name: store.name,
            store_type: store.storeType,
          });
        }
        break;
      }
      case 'stateSnapshot': {
        db.state.upsertSnapshot({
          device_id: deviceId,
          store_name: message.storeName,
          state: message.state,
          timestamp: message.timestamp,
        });
        break;
      }
      case 'stateAction': {
        db.state.insertAction({
          device_id: deviceId,
          store_name: message.storeName,
          action_type: message.actionType,
          payload: message.payload,
          state: message.state,
          timestamp: message.timestamp,
        });
        break;
      }
      case 'startupMetrics': {
        db.startup.upsert({
          device_id: deviceId,
          js_bundle_eval: message.jsBundleEval,
          native_launch: message.nativeLaunch,
          tti: message.tti,
          timestamp: message.timestamp,
        });
        break;
      }
      case 'metadata':
        break;
    }
  } catch (err) {
    console.error('[radar] Failed to persist message:', err);
  }
};

export const startWebSocketServer = (
  win: BrowserWindow,
  getDetectedDevices: () => DetectedDevice[],
  db: RadarDatabase,
): WebSocketServerHandle => {
  const connectedDevices = new Map<string, ConnectedDevice>();
  const socketToDeviceId = new Map<WsWebSocket, string>();

  const sendConnectedDevices = () => {
    win.webContents.send(
      'radar:connected-devices',
      Array.from(connectedDevices.keys()),
    );
  };

  const wss = new WebSocketServer({
    host: WS_HOST,
    port: WS_PORT,
    maxPayload: WS_MAX_PAYLOAD_BYTES,
    verifyClient: (info: {
      origin: string;
      req: { headers: { host?: string } };
    }) => {
      if (!info.origin) return true;
      try {
        const originHost = new URL(info.origin).host;
        const requestHost = info.req.headers.host;
        if (originHost === requestHost) return true;
        console.warn(
          `[radar] Rejected origin "${info.origin}" — host "${originHost}" vs request host "${requestHost}"`,
        );
      } catch (err) {
        console.warn(
          `[radar] Rejected unparseable origin "${info.origin}": ${
            (err as Error).message
          }`,
        );
      }
      return false;
    },
  });

  wss.on('listening', () => {
    console.log(`[radar] WebSocket server listening on port ${WS_PORT}`);
  });

  wss.on('connection', socket => {
    console.log('[radar] Client connected, waiting for metadata...');

    socket.on('message', data => {
      const result = (() => {
        try {
          return radarMessageSchema.safeParse(JSON.parse(data.toString()));
        } catch (err) {
          console.error('[radar] Failed to parse message JSON:', err);
          return null;
        }
      })();
      if (!result) return;

      if (!result.success) {
        console.error(
          '[radar] Rejected malformed message:',
          result.error.issues,
        );
        return;
      }

      const message = result.data;

      if (message.type === 'metadata') {
        if (socketToDeviceId.has(socket)) {
          console.warn(
            '[radar] Rejected duplicate metadata from already-registered socket',
          );
          return;
        }

        const detected = getDetectedDevices();
        const match = detected.find(
          d =>
            d.platform === message.platform &&
            d.osVersion === message.osVersion,
        );

        const resolvedDeviceId = match?.id ?? message.deviceId;

        if (connectedDevices.has(resolvedDeviceId)) {
          console.warn(
            `[radar] Rejected metadata claiming already-registered deviceId: ${resolvedDeviceId}`,
          );
          return;
        }

        const device: ConnectedDevice = {
          socket,
          deviceId: resolvedDeviceId,
          deviceName: match?.name ?? message.deviceName,
          platform: message.platform,
          osVersion: message.osVersion,
          projectRoot: message.projectRoot || null,
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

      if (deviceId) {
        persistMessage(db, deviceId, message);
        notifyRenderer(win, deviceId, message);
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
