import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsoleLogs } from './useConsoleLogs';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  sendCommand: vi.fn(),
}));

const DEVICE_ID = 'device-1';

describe('useConsoleLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds console messages to logs via handleMessage', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['hello'],
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].level).toBe('log');
    expect(result.current.logs[0].args).toEqual(['hello']);
    expect(result.current.logs[0].deviceId).toBe(DEVICE_ID);
  });

  it('auto-increments log id', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['first'],
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'warn',
          args: ['second'],
          timestamp: 2000,
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.logs[1].id).toBe(result.current.logs[0].id + 1);
  });

  it('filters logs by selectedDeviceId', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['mine'],
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['other'],
          timestamp: 2000,
          deviceId: 'device-2',
        },
      );
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].args).toEqual(['mine']);
  });

  it('filters logs by level with setFilter', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['info'],
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'warn',
          args: ['warning'],
          timestamp: 2000,
          deviceId: DEVICE_ID,
        },
      );
    });

    act(() => {
      result.current.setFilter('warn');
    });

    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].level).toBe('warn');
  });

  it('ignores non-console messages', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'network',
          deviceId: DEVICE_ID,
        },
      );
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it('clearLogs removes only logs for selected device', () => {
    const { result } = renderHook(() => useConsoleLogs(DEVICE_ID));

    act(() => {
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['mine'],
          timestamp: 1000,
          deviceId: DEVICE_ID,
        },
      );
      result.current.handleMessage(
        {},
        {
          type: 'console',
          level: 'log',
          args: ['other'],
          timestamp: 2000,
          deviceId: 'device-2',
        },
      );
    });

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });
});
