import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { EventEmitter } from 'node:events';
import type { BrowserWindow } from 'electron';
import type { RadarDatabase } from '@radar/database';

type MockSocket = EventEmitter & {
  ping: Mock;
  close: Mock;
  terminate: Mock;
  send: Mock;
};

type MockServer = EventEmitter & {
  clients: Set<MockSocket>;
  close: Mock;
};

const createMockSocket = (): MockSocket => {
  const socket = new EventEmitter() as MockSocket;
  socket.ping = vi.fn();
  socket.close = vi.fn();
  socket.terminate = vi.fn();
  socket.send = vi.fn();
  return socket;
};

const serverHolder = vi.hoisted(() => ({
  current: null as MockServer | null,
}));

vi.mock('ws', () => ({
  WebSocketServer: function MockWebSocketServer() {
    return serverHolder.current;
  },
}));

vi.mock('electron', () => ({
  default: {},
}));

import { startWebSocketServer } from './websocketServer';

const createMockServer = (): MockServer => {
  const s = new EventEmitter() as MockServer;
  s.clients = new Set();
  s.close = vi.fn();
  return s;
};

const createMockWin = (): BrowserWindow =>
  ({ webContents: { send: vi.fn() } } as unknown as BrowserWindow);

const createMockDb = (): RadarDatabase =>
  ({
    console: { insert: vi.fn() },
    network: {
      insertRequest: vi.fn(),
      updateResponse: vi.fn(),
    },
    componentTree: { insert: vi.fn() },
    inspectedComponent: { upsert: vi.fn() },
    profiler: {
      insertSession: vi.fn(() => ({ id: 1 })),
      insertCommit: vi.fn(),
    },
    performance: { insert: vi.fn() },
    storage: {
      upsertCapability: vi.fn(),
      replaceEntries: vi.fn(),
    },
    state: {
      upsertCapability: vi.fn(),
      upsertSnapshot: vi.fn(),
      insertAction: vi.fn(),
    },
    startup: { upsert: vi.fn() },
  } as unknown as RadarDatabase);

const buildMetadata = (deviceId = 'device-1') => ({
  type: 'metadata',
  deviceId,
  deviceName: deviceId,
  platform: 'ios',
  osVersion: '17.0',
  projectRoot: '/tmp/proj',
  timestamp: 1,
});

const sendMessage = (socket: MockSocket, payload: object) => {
  socket.emit('message', Buffer.from(JSON.stringify(payload)));
};

const connect = (server: MockServer): MockSocket => {
  const socket = createMockSocket();
  server.clients.add(socket);
  server.emit('connection', socket);
  return socket;
};

describe('websocketServer', () => {
  let currentServer: MockServer;

  beforeEach(() => {
    vi.useFakeTimers();
    currentServer = createMockServer();
    serverHolder.current = currentServer;
  });

  afterEach(() => {
    vi.useRealTimers();
    serverHolder.current = null;
  });

  describe('connection cap', () => {
    it('rejects new connections beyond the 16-client cap with code 1013', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      for (let i = 0; i < 16; i++) connect(currentServer);
      const overflow = connect(currentServer);

      expect(overflow.close).toHaveBeenCalledWith(1013, 'try again later');
      handle.close();
    });

    it('accepts connections up to the cap', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const accepted: MockSocket[] = [];
      for (let i = 0; i < 16; i++) accepted.push(connect(currentServer));

      for (const sock of accepted) expect(sock.close).not.toHaveBeenCalled();
      handle.close();
    });
  });

  describe('metadata deadline', () => {
    it('closes a socket that does not send metadata within 5s', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const socket = connect(currentServer);

      vi.advanceTimersByTime(4_999);
      expect(socket.close).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2);
      expect(socket.close).toHaveBeenCalledWith(1013, 'metadata deadline');
      handle.close();
    });

    it('does not close a socket that sends metadata in time', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const socket = connect(currentServer);
      vi.advanceTimersByTime(1_000);
      sendMessage(socket, buildMetadata('device-a'));
      vi.advanceTimersByTime(10_000);

      expect(socket.close).not.toHaveBeenCalled();
      handle.close();
    });
  });

  describe('liveness check', () => {
    it('does not ping (RN pong unreliable; data flow is the liveness signal)', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      // Run several check intervals; verify ping is never called.
      vi.advanceTimersByTime(30_000 * 4);
      expect(socket.ping).not.toHaveBeenCalled();
      handle.close();
    });

    it('terminates a socket that has sent no frames within the 5-min timeout', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      // Just under the 5-minute timeout — still alive.
      vi.advanceTimersByTime(4 * 60_000 + 30_000);
      expect(socket.terminate).not.toHaveBeenCalled();

      // Cross the timeout — next check tick terminates.
      vi.advanceTimersByTime(60_000);
      expect(socket.terminate).toHaveBeenCalledTimes(1);
      handle.close();
    });

    it('keeps the socket alive when ANY data frame arrives within the timeout', () => {
      const handle = startWebSocketServer(
        createMockWin(),
        () => [],
        createMockDb(),
      );

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      // Active RN client streams a performanceMetric every couple minutes —
      // each one refreshes liveness, so the socket should never terminate.
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(2 * 60_000);
        sendMessage(socket, {
          type: 'performanceMetric',
          jsFps: 60,
          uiFps: 60,
          jsHeap: null,
          nativeRam: null,
          cpuUsage: null,
          droppedFrames: 0,
          gcEvents: 0,
          timestamp: i,
        });
      }
      vi.advanceTimersByTime(2 * 60_000);

      expect(socket.terminate).not.toHaveBeenCalled();
      handle.close();
    });
  });

  describe('per-message size guard', () => {
    it('drops oversized messages without persisting', () => {
      const db = createMockDb();
      const handle = startWebSocketServer(createMockWin(), () => [], db);

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      const huge = 'x'.repeat(300_000);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      sendMessage(socket, {
        type: 'console',
        level: 'log',
        args: [huge],
        timestamp: 1,
      });

      expect(db.console.insert).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dropping oversized'),
      );

      warnSpy.mockRestore();
      handle.close();
    });

    it('persists messages within the size limit', () => {
      const db = createMockDb();
      const handle = startWebSocketServer(createMockWin(), () => [], db);

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      sendMessage(socket, {
        type: 'console',
        level: 'log',
        args: ['hello'],
        timestamp: 1,
      });

      expect(db.console.insert).toHaveBeenCalledTimes(1);
      handle.close();
    });

    it('persists profilerSession messages above the streaming-type cap (up to 8 MB)', () => {
      const db = createMockDb();
      const handle = startWebSocketServer(createMockWin(), () => [], db);

      const socket = connect(currentServer);
      sendMessage(socket, buildMetadata('device-a'));

      // Build a profilerSession ~1 MB — well above the 256 KB streaming cap
      // but well under the 8 MB profilerSession cap.
      const padName = 'x'.repeat(200); // pads each component to fatten the payload
      const commits = Array.from({ length: 200 }, (_, i) => ({
        index: i,
        timestamp: i,
        duration: 1,
        components: Array.from({ length: 50 }, (_, j) => ({
          id: `c-${i}-${j}`,
          name: `Component-${padName}`,
          actualDuration: 1,
          selfBaseDuration: 1,
          treeBaseDuration: 1,
          phase: 'update' as const,
          skipped: false,
          triggers: [],
          children: [],
        })),
      }));

      sendMessage(socket, {
        type: 'profilerSession',
        commits,
        timestamp: 1,
      });

      expect(db.profiler.insertSession).toHaveBeenCalledTimes(1);
      handle.close();
    });
  });
});
