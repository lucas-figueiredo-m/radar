import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceManager } from './useDeviceManager';
import { ipcRenderer } from '../services';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
    invoke: vi.fn().mockResolvedValue({ connectedDeviceIds: [] }),
  },
  sendCommand: vi.fn(),
}));

const mockedIpc = ipcRenderer as unknown as {
  on: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
};

const OFFLINE_REMOVAL_DELAY_MS = 5000;

type IpcListener = (event: unknown, data: unknown) => void;

const getListener = (channel: string): IpcListener => {
  const call = mockedIpc.on.mock.calls.find((c: unknown[]) => c[0] === channel);
  return call?.[1] as IpcListener;
};

describe('useDeviceManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates device list from detected devices IPC event', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    expect(result.current.devices).toHaveLength(1);
    expect(result.current.devices[0].id).toBe('dev-1');
    expect(result.current.devices[0].connectionStatus).toBe('device-only');
  });

  it('marks detected device as connected when it appears in connected IPC event', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    act(() => {
      getListener('radar:connected-devices')({}, ['dev-1']);
    });

    expect(result.current.devices).toHaveLength(1);
    expect(result.current.devices[0].connectionStatus).toBe('connected');
  });

  it('creates minimal entry for connected-only device', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:connected-devices')({}, ['conn-only']);
    });

    expect(result.current.devices).toHaveLength(1);
    expect(result.current.devices[0].id).toBe('conn-only');
    expect(result.current.devices[0].name).toBe('conn-only');
    expect(result.current.devices[0].connectionStatus).toBe('connected');
  });

  it('marks device offline then removes after grace period', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    act(() => {
      getListener('radar:detected-devices')({}, []);
    });

    expect(
      result.current.devices.find(d => d.id === 'dev-1')?.connectionStatus,
    ).toBe('offline');

    act(() => {
      vi.advanceTimersByTime(OFFLINE_REMOVAL_DELAY_MS);
    });

    expect(result.current.devices.find(d => d.id === 'dev-1')).toBeUndefined();
  });

  it('cancels offline removal when device reappears within grace period', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    act(() => {
      getListener('radar:detected-devices')({}, []);
    });

    expect(
      result.current.devices.find(d => d.id === 'dev-1')?.connectionStatus,
    ).toBe('offline');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    expect(
      result.current.devices.find(d => d.id === 'dev-1')?.connectionStatus,
    ).toBe('device-only');

    act(() => {
      vi.advanceTimersByTime(OFFLINE_REMOVAL_DELAY_MS);
    });

    expect(result.current.devices.find(d => d.id === 'dev-1')).toBeDefined();
  });

  it('auto-selects single connected device', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
      ]);
    });

    act(() => {
      getListener('radar:connected-devices')({}, ['dev-1']);
    });

    expect(result.current.selectedDeviceId).toBe('dev-1');
  });

  it('does not change selection when already selected', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
        { id: 'dev-2', name: 'Pixel', platform: 'android', osVersion: '14' },
      ]);
    });

    act(() => {
      getListener('radar:connected-devices')({}, ['dev-1', 'dev-2']);
    });

    act(() => {
      result.current.selectDevice('dev-2');
    });

    expect(result.current.selectedDeviceId).toBe('dev-2');

    act(() => {
      getListener('radar:connected-devices')({}, ['dev-1']);
    });

    expect(result.current.selectedDeviceId).toBe('dev-2');
  });

  it('does not auto-select when multiple devices are connected', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      getListener('radar:detected-devices')({}, [
        { id: 'dev-1', name: 'iPhone', platform: 'ios', osVersion: '17.0' },
        { id: 'dev-2', name: 'Pixel', platform: 'android', osVersion: '14' },
      ]);
    });

    act(() => {
      getListener('radar:connected-devices')({}, ['dev-1', 'dev-2']);
    });

    expect(result.current.selectedDeviceId).toBeNull();
  });

  it('selectDevice manually sets selectedDeviceId', () => {
    const { result } = renderHook(() => useDeviceManager());

    act(() => {
      result.current.selectDevice('dev-1');
    });

    expect(result.current.selectedDeviceId).toBe('dev-1');
  });

  it('updates cliToolStatuses from IPC event', () => {
    const { result } = renderHook(() => useDeviceManager());

    const statuses = [
      { name: 'adb', installed: true },
      { name: 'xcrun', installed: false },
    ];

    act(() => {
      getListener('radar:cli-status')({}, statuses);
    });

    expect(result.current.cliToolStatuses).toEqual(statuses);
  });

  it('removes IPC listeners on unmount', () => {
    const { unmount } = renderHook(() => useDeviceManager());

    unmount();

    expect(mockedIpc.removeListener).toHaveBeenCalledWith(
      'radar:detected-devices',
      expect.any(Function),
    );
    expect(mockedIpc.removeListener).toHaveBeenCalledWith(
      'radar:connected-devices',
      expect.any(Function),
    );
    expect(mockedIpc.removeListener).toHaveBeenCalledWith(
      'radar:cli-status',
      expect.any(Function),
    );
  });
});
