import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDevTools } from './useDevTools';
import { ipcRenderer, sendCommand } from '../services';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  sendCommand: vi.fn(),
}));

const mockedIpc = ipcRenderer as {
  on: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
};
const mockedSendCommand = sendCommand as ReturnType<typeof vi.fn>;

const DEVICE_ID = 'device-1';

const simulateMessage = (message: Record<string, unknown>) => {
  const calls = mockedIpc.on.mock.calls.filter(
    (c: unknown[]) => c[0] === 'radar:message',
  );
  const listener = calls[calls.length - 1]?.[1] as (
    event: unknown,
    msg: Record<string, unknown>,
  ) => void;
  listener({}, message);
};

describe('useDevTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds console messages to logs via IPC', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['hello'],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].level).toBe('log');
    expect(result.current.logs[0].args).toEqual(['hello']);
    expect(result.current.logs[0].deviceId).toBe(DEVICE_ID);
  });

  it('auto-increments log id', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['first'],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
      simulateMessage({
        type: 'console',
        level: 'warn',
        args: ['second'],
        timestamp: 2000,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.logs[1].id).toBe(result.current.logs[0].id + 1);
  });

  it('filters logs by selectedDeviceId', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['mine'],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['other'],
        timestamp: 2000,
        deviceId: 'device-2',
      });
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].args).toEqual(['mine']);
  });

  it('filters logs by level with setFilter', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['info'],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
      simulateMessage({
        type: 'console',
        level: 'warn',
        args: ['warning'],
        timestamp: 2000,
        deviceId: DEVICE_ID,
      });
    });

    act(() => {
      result.current.setFilter('warn');
    });

    expect(result.current.filteredLogs).toHaveLength(1);
    expect(result.current.filteredLogs[0].level).toBe('warn');
  });

  it('adds pending network request on request event', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'network',
        event: 'request',
        id: 'req-1',
        method: 'GET',
        url: 'https://example.com',
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].pending).toBe(true);
    expect(result.current.requests[0].method).toBe('GET');
  });

  it('merges network response into existing request', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'network',
        event: 'request',
        id: 'req-1',
        method: 'GET',
        url: 'https://example.com',
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    act(() => {
      simulateMessage({
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
      });
    });

    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].pending).toBe(false);
    expect(result.current.requests[0].status).toBe(200);
    expect(result.current.requests[0].duration).toBe(150);
  });

  it('does not add a new entry for response with unknown id', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'network',
        event: 'response',
        id: 'unknown-id',
        status: 200,
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.requests).toHaveLength(0);
  });

  it('stores component tree by deviceId', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'componentTree',
        rootNodes: [{ id: 'node-1', name: 'App', children: [] }],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.componentTree).not.toBeNull();
    expect(result.current.componentTree!.rootNodes).toHaveLength(1);
    expect(result.current.componentTree!.deviceId).toBe(DEVICE_ID);
  });

  it('sets inspectedComponent when componentId matches selectedComponentId', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    const inspectData = { name: 'MyComponent', props: { title: 'Hello' } };

    act(() => {
      simulateMessage({
        type: 'inspectComponent',
        componentId: 'comp-1',
        data: inspectData,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.inspectedComponent).toEqual(inspectData);
  });

  it('does not set inspectedComponent when componentId does not match', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    act(() => {
      simulateMessage({
        type: 'inspectComponent',
        componentId: 'comp-other',
        data: { name: 'Other' },
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.inspectedComponent).toBeNull();
  });

  it('clearLogs removes only logs for selected device', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['mine'],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
      simulateMessage({
        type: 'console',
        level: 'log',
        args: ['other'],
        timestamp: 2000,
        deviceId: 'device-2',
      });
    });

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it('clearRequests removes requests for selected device', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'network',
        event: 'request',
        id: 'req-1',
        method: 'GET',
        url: 'https://example.com',
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    act(() => {
      result.current.clearRequests();
    });

    expect(result.current.requests).toHaveLength(0);
  });

  it('clearComponentTree removes tree for selected device', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      simulateMessage({
        type: 'componentTree',
        rootNodes: [{ id: 'node-1', name: 'App', children: [] }],
        timestamp: 1000,
        deviceId: DEVICE_ID,
      });
    });

    act(() => {
      result.current.clearComponentTree();
    });

    expect(result.current.componentTree).toBeNull();
  });

  it('inspectComponentById calls sendCommand', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    expect(mockedSendCommand).toHaveBeenCalledWith(DEVICE_ID, {
      type: 'inspectComponent',
      direction: 'request',
      componentId: 'comp-1',
    });
  });

  it('clearInspection resets selectedComponentId and inspectedComponent', () => {
    const { result } = renderHook(() => useDevTools(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    expect(result.current.selectedComponentId).toBe('comp-1');

    act(() => {
      result.current.clearInspection();
    });

    expect(result.current.selectedComponentId).toBeNull();
    expect(result.current.inspectedComponent).toBeNull();
  });

  it('removes IPC listener on unmount', () => {
    const { unmount } = renderHook(() => useDevTools(DEVICE_ID));

    unmount();

    expect(mockedIpc.removeListener).toHaveBeenCalledWith(
      'radar:message',
      expect.any(Function),
    );
  });
});
