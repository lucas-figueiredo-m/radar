import type { LogLevel, RadarCommand, RadarMessage } from '@radar/types';
import { RECONNECT_DELAY_MS } from './constants';

type Logger = Record<LogLevel, (...args: unknown[]) => void>;

export const createConnection = (
  onMessage?: (command: RadarCommand) => void,
) => {
  let ws: WebSocket | null = null;
  const messageQueue: RadarMessage[] = [];

  const send = (message: RadarMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      messageQueue.push(message);
    }
  };

  const flushQueue = () => {
    while (messageQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
      const msg = messageQueue.shift()!;
      ws.send(JSON.stringify(msg));
    }
  };

  const connect = (host: string, port: number, logger: Logger) => {
    const url = `ws://${host}:${port}`;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        logger.log('[radar] connected to', url);
        flushQueue();
      };

      ws.onclose = () => {
        logger.log('[radar] disconnected, reconnecting in 3s...');
        ws = null;
        setTimeout(() => connect(host, port, logger), RECONNECT_DELAY_MS);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!onMessage) return;
        try {
          const command = JSON.parse(event.data as string) as RadarCommand;
          onMessage(command);
        } catch (err) {
          logger.error('[radar] Failed to parse incoming command:', err);
        }
      };

      ws.onerror = () => {
        // onclose will fire after this, triggering reconnect
      };
    } catch {
      setTimeout(() => connect(host, port, logger), RECONNECT_DELAY_MS);
    }
  };

  return { send, connect };
};
