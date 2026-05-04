import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentTree } from './useComponentTree';

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
    componentTree: {
      getLatest: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(0),
    },
    inspectedComponent: {
      getByComponentId: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(0),
    },
  },
}));

const { databaseClient, sendCommand } = await import('../services');
const mockGetLatest = databaseClient.componentTree.getLatest as ReturnType<
  typeof vi.fn
>;
const mockGetByComponentId = databaseClient.inspectedComponent
  .getByComponentId as ReturnType<typeof vi.fn>;
const mockedSendCommand = sendCommand as ReturnType<typeof vi.fn>;

const DEVICE_ID = 'device-1';

describe('useComponentTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    mockGetLatest.mockResolvedValue(null);
  });

  it('queries latest component tree on mount', async () => {
    mockGetLatest.mockResolvedValue({
      id: 1,
      device_id: DEVICE_ID,
      session_id: 1,
      root_nodes: JSON.stringify([{ id: 'node-1', name: 'App', children: [] }]),
      timestamp: 1000,
      db_created_at: 1000,
    });

    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.componentTree).not.toBeNull();
    });

    expect(result.current.componentTree!.rootNodes).toHaveLength(1);
    expect(result.current.componentTree!.deviceId).toBe(DEVICE_ID);
  });

  it('returns null when no tree exists', async () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    await waitFor(() => {
      expect(mockGetLatest).toHaveBeenCalled();
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

  it('sets inspectedComponent when notification matches selectedComponentId', async () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    const inspectData = { name: 'MyComponent', props: { title: 'Hello' } };
    mockGetByComponentId.mockResolvedValue({
      id: 1,
      device_id: DEVICE_ID,
      session_id: 1,
      component_id: 'comp-1',
      data: JSON.stringify(inspectData),
      timestamp: 1000,
      db_created_at: 1000,
    });

    const handler = listeners.get('radar:db:inspectedComponent:changed');
    act(() => {
      handler?.({}, { deviceId: DEVICE_ID, componentId: 'comp-1' });
    });

    await waitFor(() => {
      expect(result.current.inspectedComponent).toEqual(inspectData);
    });
  });

  it('ignores inspected component notification when componentId does not match', async () => {
    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    act(() => {
      result.current.inspectComponent('comp-1');
    });

    const handler = listeners.get('radar:db:inspectedComponent:changed');
    act(() => {
      handler?.({}, { deviceId: DEVICE_ID, componentId: 'comp-other' });
    });

    // Should not have queried
    expect(mockGetByComponentId).not.toHaveBeenCalled();
    expect(result.current.inspectedComponent).toBeNull();
  });

  it('clearComponentTree calls databaseClient.componentTree.clear', async () => {
    mockGetLatest.mockResolvedValue({
      id: 1,
      device_id: DEVICE_ID,
      session_id: 1,
      root_nodes: JSON.stringify([{ id: 'node-1', name: 'App', children: [] }]),
      timestamp: 1000,
      db_created_at: 1000,
    });

    const { result } = renderHook(() => useComponentTree(DEVICE_ID));

    await waitFor(() => {
      expect(result.current.componentTree).not.toBeNull();
    });

    mockGetLatest.mockResolvedValue(null);
    await act(async () => {
      await result.current.clearComponentTree();
    });

    expect(databaseClient.componentTree.clear).toHaveBeenCalledWith(DEVICE_ID);
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
