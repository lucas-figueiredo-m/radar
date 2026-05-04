import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConsoleLogs } from './useConsoleLogs';

type IpcHandler = (...args: unknown[]) => void;

const listeners = new Map<string, IpcHandler>();

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn((channel: string, handler: IpcHandler) => {
      listeners.set(channel, handler);
    }),
    removeListener: vi.fn((channel: string) => {
      listeners.delete(channel);
    }),
    invoke: vi.fn(),
  },
  sendCommand: vi.fn(),
  databaseClient: {
    console: {
      query: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      clear: vi.fn().mockResolvedValue(0),
    },
  },
}));

const { databaseClient } = await import('../services');
const mockQuery = databaseClient.console.query as ReturnType<typeof vi.fn>;
const mockClear = databaseClient.console.clear as ReturnType<typeof vi.fn>;

const DEVICE_ID = 'device-1';

const mkRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  device_id: DEVICE_ID,
  level: 'log',
  args: JSON.stringify(['hello']),
  timestamp: 1000,
  db_created_at: 1000,
  ...overrides,
});

describe('useConsoleLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    mockQuery.mockResolvedValue([]);
  });

  it('queries DB on mount with deviceId', async () => {
    mockQuery.mockResolvedValue([mkRow()]);
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    expect(result.current.logs[0].level).toBe('log');
    expect(result.current.logs[0].args).toEqual(['hello']);
    expect(result.current.logs[0].deviceId).toBe(DEVICE_ID);
  });

  it('returns empty logs when deviceId is null', async () => {
    const { result } = renderHook(() => useConsoleLogs(null));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(0);
    });

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('re-queries when notification arrives', async () => {
    mockQuery.mockResolvedValue([]);
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    mockQuery.mockResolvedValue([
      mkRow(),
      mkRow({ id: 2, args: JSON.stringify(['world']) }),
    ]);
    const handler = listeners.get('radar:db:console:changed');
    act(() => {
      handler?.({}, { deviceId: DEVICE_ID });
    });

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(2);
    });
  });

  it('ignores notifications for other devices', async () => {
    mockQuery.mockResolvedValue([mkRow()]);
    renderHook(() => useConsoleLogs(DEVICE_ID));

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    const handler = listeners.get('radar:db:console:changed');
    act(() => {
      handler?.({}, { deviceId: 'device-other' });
    });

    // Should not re-query
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('filters logs by level with setFilter', async () => {
    mockQuery.mockResolvedValue([
      mkRow({ id: 1, level: 'log', args: JSON.stringify(['info']) }),
      mkRow({ id: 2, level: 'warn', args: JSON.stringify(['warning']) }),
    ]);
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(2);
    });

    act(() => {
      result.current.setFilter('warn');
    });

    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].level).toBe('warn');
  });

  it('clearLogs calls databaseClient.console.clear', async () => {
    mockQuery.mockResolvedValue([mkRow()]);
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    mockQuery.mockResolvedValue([]);
    await act(async () => {
      await result.current.clearLogs();
    });

    expect(mockClear).toHaveBeenCalledWith(DEVICE_ID);
  });
});
