import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentTree } from './useComponentTree';
import { sendCommand } from '../services';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  sendCommand: vi.fn(),
}));

const mockedSendCommand = sendCommand as ReturnType<typeof vi.fn>;

const DEVICE_ID = 'device-1';

describe('useComponentTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores component tree by deviceId', () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.handleMessage({}, {
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
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    const inspectData = { name: 'MyComponent', props: { title: 'Hello' } };

    act(() => {
      result.current.handleMessage({}, {
        type: 'inspectComponent',
        componentId: 'comp-1',
        data: inspectData,
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.inspectedComponent).toEqual(inspectData);
  });

  it('does not set inspectedComponent when componentId does not match', () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    act(() => {
      result.current.handleMessage({}, {
        type: 'inspectComponent',
        componentId: 'comp-other',
        data: { name: 'Other' },
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.inspectedComponent).toBeNull();
  });

  it('ignores unrelated message types', () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.handleMessage({}, {
        type: 'console',
        deviceId: DEVICE_ID,
      });
    });

    expect(result.current.componentTree).toBeNull();
  });

  it('clearComponentTree removes tree for selected device', () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.handleMessage({}, {
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
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

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
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

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
});
