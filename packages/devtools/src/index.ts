type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface ConsoleMessage {
  type: 'console';
  level: LogLevel;
  args: unknown[];
  timestamp: number;
}

interface NetworkMessage {
  type: 'network';
  id: string;
  event: 'request' | 'response';
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  duration?: number;
  timestamp: number;
}

type RadarMessage = ConsoleMessage | NetworkMessage;

interface RadarConfig {
  host?: string;
  port?: number;
}

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8347;

let ws: WebSocket | null = null;
let originalConsole: Record<LogLevel, (...args: unknown[]) => void> | null = null;
let originalFetch: typeof globalThis.fetch | null = null;
let messageQueue: RadarMessage[] = [];
let requestIdCounter = 0;

function serialize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) return { __type: 'Error', message: value.message, stack: value.stack };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function send(message: RadarMessage) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    messageQueue.push(message);
  }
}

function flushQueue() {
  while (messageQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    const msg = messageQueue.shift()!;
    ws.send(JSON.stringify(msg));
  }
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function patchConsole() {
  if (originalConsole) return;

  const levels: LogLevel[] = ['log', 'warn', 'error', 'debug'];
  originalConsole = {} as Record<LogLevel, (...args: unknown[]) => void>;

  for (const level of levels) {
    originalConsole[level] = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      originalConsole![level](...args);

      send({
        type: 'console',
        level,
        args: args.map(serialize),
        timestamp: Date.now(),
      });
    };
  }
}

function patchFetch() {
  if (originalFetch) return;

  originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const id = `req_${requestIdCounter++}`;
    const startTime = Date.now();

    const method = init?.method ?? 'GET';
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as { url: string }).url;

    let requestHeaders: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        requestHeaders = headersToRecord(init.headers);
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          requestHeaders[key] = value;
        }
      } else {
        requestHeaders = { ...init.headers } as Record<string, string>;
      }
    }

    let requestBody: unknown = undefined;
    if (init?.body) {
      if (typeof init.body === 'string') {
        try {
          requestBody = JSON.parse(init.body);
        } catch {
          requestBody = init.body;
        }
      } else {
        requestBody = '[Binary/FormData]';
      }
    }

    send({
      type: 'network',
      id,
      event: 'request',
      method: method.toUpperCase(),
      url,
      requestHeaders,
      requestBody,
      timestamp: startTime,
    });

    try {
      const response = await originalFetch!(input, init);
      const duration = Date.now() - startTime;

      // Clone so the app can still read the body
      const clone = response.clone();
      let responseBody: unknown;
      try {
        const text = await clone.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text.length > 5000 ? text.slice(0, 5000) + '...' : text;
        }
      } catch {
        responseBody = '[Could not read body]';
      }

      send({
        type: 'network',
        id,
        event: 'response',
        method: method.toUpperCase(),
        url,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: headersToRecord(response.headers),
        responseBody,
        duration,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      send({
        type: 'network',
        id,
        event: 'response',
        method: method.toUpperCase(),
        url,
        status: 0,
        statusText: error instanceof Error ? error.message : 'Network Error',
        duration,
        timestamp: Date.now(),
      });

      throw error;
    }
  };
}

function connect(host: string, port: number) {
  const url = `ws://${host}:${port}`;

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      originalConsole?.log?.('[radar] connected to', url);
      flushQueue();
    };

    ws.onclose = () => {
      originalConsole?.log?.('[radar] disconnected, reconnecting in 3s...');
      ws = null;
      setTimeout(() => connect(host, port), 3000);
    };

    ws.onerror = () => {
      // onclose will fire after this, triggering reconnect
    };
  } catch {
    setTimeout(() => connect(host, port), 3000);
  }
}

export function init(config: RadarConfig = {}) {
  const host = config.host ?? DEFAULT_HOST;
  const port = config.port ?? DEFAULT_PORT;

  patchConsole();
  patchFetch();
  connect(host, port);

  originalConsole?.log?.('[radar] devtools initialized');
}
