import type { BrowserWindow } from 'electron';
import type { WebSocket as WsWebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import type {
  DevicePlatform,
  DetectedDevice,
  MetadataMessage,
  ConsoleMessage,
  NetworkMessage,
  ComponentTreeMessage,
  InspectComponentResponse,
  ProfilerSessionMessage,
  PerformanceMetricMessage,
  StorageCapabilitiesMessage,
  StorageDataMessage,
  StateCapabilitiesMessage,
  StateSnapshotMessage,
  StateActionMessage,
} from '@radar/types';
import type { RadarDatabase } from '@radar/database';

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
};

const notifyRenderer = (
  win: BrowserWindow,
  deviceId: string,
  message: ParsedMessage,
): void => {
  const channel = NOTIFICATION_CHANNELS[message.type as string];
  if (!channel) return;

  const payload =
    message.type === 'inspectComponent'
      ? { deviceId, componentId: String(message.componentId) }
      : { deviceId };

  win.webContents.send(channel, payload);
};

const persistMessage = (
  db: RadarDatabase,
  deviceId: string,
  message: ParsedMessage,
): void => {
  try {
    switch (message.type) {
      case 'console': {
        const msg = message as unknown as ConsoleMessage;
        db.console.insert({
          device_id: deviceId,
          level: msg.level,
          args: JSON.stringify(msg.args),
          timestamp: msg.timestamp,
        });
        break;
      }
      case 'network': {
        const msg = message as unknown as NetworkMessage;
        if (msg.event === 'request') {
          db.network.insertRequest({
            id: msg.id,
            device_id: deviceId,
            method: msg.method,
            url: msg.url,
            request_headers: msg.requestHeaders
              ? JSON.stringify(msg.requestHeaders)
              : null,
            request_body:
              msg.requestBody !== undefined
                ? JSON.stringify(msg.requestBody)
                : null,
            graphql_type: msg.graphql?.operationType ?? null,
            graphql_name: msg.graphql?.operationName ?? null,
            timestamp: msg.timestamp,
          });
        } else {
          db.network.updateResponse({
            id: msg.id,
            status: msg.status ?? null,
            status_text: msg.statusText ?? null,
            response_headers: msg.responseHeaders
              ? JSON.stringify(msg.responseHeaders)
              : null,
            response_body:
              msg.responseBody !== undefined
                ? JSON.stringify(msg.responseBody)
                : null,
            duration: msg.duration ?? null,
            response_timestamp: msg.timestamp ?? null,
          });
        }
        break;
      }
      case 'componentTree': {
        const msg = message as unknown as ComponentTreeMessage;
        db.componentTree.insert({
          device_id: deviceId,
          root_nodes: JSON.stringify(msg.rootNodes),
          timestamp: msg.timestamp,
        });
        break;
      }
      case 'inspectComponent': {
        const msg = message as unknown as InspectComponentResponse;
        if (msg.direction === 'response' && msg.data) {
          db.inspectedComponent.upsert({
            device_id: deviceId,
            component_id: msg.componentId,
            data: JSON.stringify(msg.data),
            timestamp: msg.timestamp,
          });
        }
        break;
      }
      case 'profilerSession': {
        const msg = message as unknown as ProfilerSessionMessage;
        const session = db.profiler.insertSession({
          device_id: deviceId,
          timestamp: msg.timestamp,
        });
        for (const commit of msg.commits) {
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
        const msg = message as unknown as PerformanceMetricMessage;
        db.performance.insert({
          device_id: deviceId,
          js_fps: msg.jsFps,
          ui_fps: msg.uiFps ?? null,
          js_heap: msg.jsHeap ?? null,
          native_ram: msg.nativeRam ?? null,
          cpu_usage: msg.cpuUsage ?? null,
          dropped_frames: msg.droppedFrames,
          gc_events: msg.gcEvents,
          timestamp: msg.timestamp,
        });
        break;
      }
      case 'storageCapabilities': {
        const msg = message as unknown as StorageCapabilitiesMessage;
        for (const backend of msg.backends) {
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
        const msg = message as unknown as StorageDataMessage;
        db.storage.replaceEntries(
          deviceId,
          msg.backend,
          msg.instanceId ?? null,
          msg.entries.map(e => ({
            device_id: deviceId,
            backend: msg.backend,
            instance_id: msg.instanceId ?? null,
            key: e.key,
            value: e.value,
            value_type: e.valueType,
            timestamp: msg.timestamp,
          })),
        );
        break;
      }
      case 'stateCapabilities': {
        const msg = message as unknown as StateCapabilitiesMessage;
        for (const store of msg.stores) {
          db.state.upsertCapability({
            device_id: deviceId,
            store_name: store.name,
            store_type: store.storeType,
          });
        }
        break;
      }
      case 'stateSnapshot': {
        const msg = message as unknown as StateSnapshotMessage;
        db.state.upsertSnapshot({
          device_id: deviceId,
          store_name: msg.storeName,
          state: msg.state,
          timestamp: msg.timestamp,
        });
        break;
      }
      case 'stateAction': {
        const msg = message as unknown as StateActionMessage;
        db.state.insertAction({
          device_id: deviceId,
          store_name: msg.storeName,
          action_type: msg.actionType,
          payload: msg.payload,
          state: msg.state,
          timestamp: msg.timestamp,
        });
        break;
      }
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

        if (deviceId) {
          persistMessage(db, deviceId, message);
          notifyRenderer(win, deviceId, message);
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
