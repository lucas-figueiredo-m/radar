import type {
  DevicePlatform,
  LogLevel,
  MetadataMessage,
  RadarCommand,
  RadarMessage,
} from '@radar/types';
import { radarCommandSchema } from '@radar/types';
import { MAX_QUEUE_SIZE, RECONNECT_DELAY_MS } from './constants';

type Logger = Record<LogLevel, (...args: unknown[]) => void>;

type ConnectionDeviceInfo = {
  deviceId: string;
  deviceName: string;
  platform: DevicePlatform;
  osVersion: string;
};

export const createConnection = (
  onMessage?: (command: RadarCommand) => void,
  projectRoot?: string,
  deviceInfo?: ConnectionDeviceInfo,
) => {
  let ws: WebSocket | null = null;
  const messageQueue: RadarMessage[] = [];

  const send = (message: RadarMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else if (messageQueue.length < MAX_QUEUE_SIZE) {
      messageQueue.push(message);
    }
  };

  const flushQueue = () => {
    while (messageQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
      const msg = messageQueue.shift()!;
      ws.send(JSON.stringify(msg));
    }
  };

  const sendMetadata = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!deviceInfo) return;

    const metadata: MetadataMessage = {
      type: 'metadata',
      projectRoot: projectRoot ?? '',
      timestamp: Date.now(),
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      platform: deviceInfo.platform,
      osVersion: deviceInfo.osVersion,
    };
    ws.send(JSON.stringify(metadata));
  };

  const connect = (host: string, port: number, logger: Logger) => {
    const url = `ws://${host}:${port}`;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        logger.log('[radar] connected to', url);
        sendMetadata();
        flushQueue();
      };

      ws.onclose = () => {
        logger.log('[radar] disconnected, reconnecting in 3s...');
        ws = null;
        setTimeout(() => connect(host, port, logger), RECONNECT_DELAY_MS);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!onMessage) return;
        let raw: unknown;
        try {
          raw = JSON.parse(event.data as string);
        } catch (err) {
          logger.error('[radar] Failed to parse incoming command JSON:', err);
          return;
        }
        const result = radarCommandSchema.safeParse(raw);
        if (!result.success) {
          logger.error(
            '[radar] Rejected malformed command:',
            result.error.issues,
          );
          return;
        }
        onMessage(result.data);
      };

      ws.onerror = (event: Event) => {
        logger.error('[radar] WebSocket error:', event);
        // onclose will fire after this, triggering reconnect
      };
    } catch (err) {
      logger.error('[radar] Failed to create WebSocket:', err);
      setTimeout(() => connect(host, port, logger), RECONNECT_DELAY_MS);
    }
  };

  return { send, connect };
};
