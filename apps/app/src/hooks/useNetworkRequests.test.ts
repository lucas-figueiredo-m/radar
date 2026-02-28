import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkRequests } from './useNetworkRequests';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  sendCommand: vi.fn(),
}));

const DEVICE_ID = 'device-1';

describe('useNetworkRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds pending network request on request event', () => {
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          event: 'request',
          id: 'req-1',
          method: 'GET',
          url: 'https://example.com',
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].pending).toBe(true);
    expect(result.current.requests[0].method).toBe('GET');
  });

  it('merges network response into existing request', () => {
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          event: 'request',
          id: 'req-1',
          method: 'GET',
          url: 'https://example.com',
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
    });

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          event: 'response',
          id: 'req-1',
          status: 200,
          statusText: 'OK',
          duration: 150,
          responseHeaders: { 'content-type': 'application/json' },
          responseBody: { ok: true },
          timestamp: 1150,
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].pending).toBe(false);
    expect(result.current.requests[0].status).toBe(200);
    expect(result.current.requests[0].duration).toBe(150);
  });

  it('does not add a new entry for response with unknown id', () => {
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          event: 'response',
          id: 'unknown-id',
          status: 200,
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.requests).toHaveLength(0);
  });

  it('ignores non-network messages', () => {
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.requests).toHaveLength(0);
  });

  it('clearRequests removes requests for selected device', () => {
    const { result } = renderHook(() => useNetworkRequests(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          event: 'request',
          id: 'req-1',
          method: 'GET',
          url: 'https://example.com',
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
    });

    act(() => {
      result.current.clearRequests();
    });

    expect(result.current.requests).toHaveLength(0);
  });
});
