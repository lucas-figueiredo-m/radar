import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RadarCommand } from '@radar/types';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const { createConnection } = await import('./connection');

type FakeWebSocketInstance = {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onclose: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send: ReturnType<typeof vi.fn>;
};

let lastSocket: FakeWebSocketInstance | null = null;

class FakeWebSocket {
  static OPEN = 1;
  readyState = 1;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  send = vi.fn();
  constructor() {
    lastSocket = this as FakeWebSocketInstance;
  }
}

const noopLogger = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('createConnection (command validation)', () => {
  beforeEach(() => {
    lastSocket = null;
    noopLogger.log.mockClear();
    noopLogger.warn.mockClear();
    noopLogger.error.mockClear();
    noopLogger.debug.mockClear();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards a valid RadarCommand to onMessage', () => {
    const onMessage = vi.fn();
    const { connect } = createConnection(onMessage);
    connect('127.0.0.1', 8347, noopLogger);
    expect(lastSocket).not.toBeNull();
    const command: RadarCommand = { type: 'startProfiling' };
    lastSocket!.onmessage?.({
      data: JSON.stringify(command),
    } as MessageEvent);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(command);
  });

  it('drops commands with unknown discriminator without invoking onMessage', () => {
    const onMessage = vi.fn();
    const { connect } = createConnection(onMessage);
    connect('127.0.0.1', 8347, noopLogger);
    lastSocket!.onmessage?.({
      data: JSON.stringify({ type: 'evilCommand', payload: 'rm -rf /' }),
    } as MessageEvent);
    expect(onMessage).not.toHaveBeenCalled();
    expect(noopLogger.error).toHaveBeenCalledWith(
      '[radar] Rejected malformed command:',
      expect.any(Array),
    );
  });

  it('drops commands missing required fields without invoking onMessage', () => {
    const onMessage = vi.fn();
    const { connect } = createConnection(onMessage);
    connect('127.0.0.1', 8347, noopLogger);
    lastSocket!.onmessage?.({
      data: JSON.stringify({ type: 'storageSet', requestId: 'r1' }),
    } as MessageEvent);
    expect(onMessage).not.toHaveBeenCalled();
    expect(noopLogger.error).toHaveBeenCalledWith(
      '[radar] Rejected malformed command:',
      expect.any(Array),
    );
  });

  it('drops non-JSON payloads without invoking onMessage', () => {
    const onMessage = vi.fn();
    const { connect } = createConnection(onMessage);
    connect('127.0.0.1', 8347, noopLogger);
    lastSocket!.onmessage?.({ data: 'not-json' } as MessageEvent);
    expect(onMessage).not.toHaveBeenCalled();
    expect(noopLogger.error).toHaveBeenCalledWith(
      '[radar] Failed to parse incoming command JSON:',
      expect.any(Error),
    );
  });
});
