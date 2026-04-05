import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworkRequests } from './useNetworkRequests';

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
    network: {
      query: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      getById: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(0),
    },
  },
}));

const { databaseClient } = await import('../services');
const mockQuery = databaseClient.network.query as ReturnType<typeof vi.fn>;
const mockClear = databaseClient.network.clear as ReturnType<typeof vi.fn>;

const DEVICE_ID = 'device-1';

const mkRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'req-1',
  device_id: DEVICE_ID,
  method: 'GET',
  url: 'https://example.com',
  request_headers: null,
  request_body: null,
  graphql_type: null,
  graphql_name: null,
  status: null,
  status_text: null,
  response_headers: null,
  response_body: null,
  duration: null,
  pending: 1,
  timestamp: 1000,
  response_timestamp: null,
  db_created_at: 1000,
  db_updated_at: 1000,
  ...overrides,
});

describe('useNetworkRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    mockQuery.mockResolvedValue([]);
  });

  it('queries DB on mount with deviceId', async () => {
    mockQuery.mockResolvedValue([mkRow()]);
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.requests).toHaveLength(1);
    });

    expect(result.current.requests[0].method).toBe('GET');
    expect(result.current.requests[0].pending).toBe(true);
  });

  it('converts completed request correctly', async () => {
    mockQuery.mockResolvedValue([
      mkRow({
        status: 200,
        status_text: 'OK',
        duration: 150,
        pending: 0,
        response_headers: JSON.stringify({
          'content-type': 'application/json',
        }),
        response_body: JSON.stringify({ ok: true }),
      }),
    ]);
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.requests).toHaveLength(1);
    });

    expect(result.current.requests[0].pending).toBe(false);
    expect(result.current.requests[0].status).toBe(200);
    expect(result.current.requests[0].duration).toBe(150);
    expect(result.current.requests[0].responseHeaders).toEqual({
      'content-type': 'application/json',
    });
  });

  it('re-queries when notification arrives', async () => {
    mockQuery.mockResolvedValue([]);
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    mockQuery.mockResolvedValue([mkRow()]);
    const handler = listeners.get('radar:db:network:changed');
    act(() => {
      handler?.({}, { deviceId: DEVICE_ID });
    });

    await waitFor(() => {
      expect(result.current.requests).toHaveLength(1);
    });
  });

  it('clearRequests calls databaseClient.network.clear', async () => {
    mockQuery.mockResolvedValue([mkRow()]);
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.requests).toHaveLength(1);
    });

    mockQuery.mockResolvedValue([]);
    await act(async () => {
      await result.current.clearRequests();
    });

    expect(mockClear).toHaveBeenCalledWith(DEVICE_ID);
    expect(result.current.selectedRequest).toBeNull();
  });
});
