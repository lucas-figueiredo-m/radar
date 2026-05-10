import type {
  ConsoleLogRow,
  ConsoleQueryFilter,
  NetworkRequestRow,
  NetworkQueryFilter,
  ComponentTreeRow,
  PerformanceMetricRow,
  PerformanceQueryFilter,
  ProfilerSessionRow,
  ProfilerCommitRow,
  InspectedComponentRow,
  QueryFilter,
  StorageCapabilityRow,
  StorageEntryRow,
  StorageEntryFilter,
  StateCapabilityRow,
  StateSnapshotRow,
  StateActionRow,
  StartupMetricRow,
} from '@radar/database';
import { ipcRenderer } from './ipc';

export const databaseClient = {
  console: {
    query: (filter: ConsoleQueryFilter): Promise<ConsoleLogRow[]> =>
      ipcRenderer.invoke<ConsoleLogRow[]>('radar:db:console:query', filter),
    count: (filter: ConsoleQueryFilter): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:console:count', filter),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:console:clear', deviceId),
  },

  network: {
    query: (filter: NetworkQueryFilter): Promise<NetworkRequestRow[]> =>
      ipcRenderer.invoke<NetworkRequestRow[]>('radar:db:network:query', filter),
    count: (filter: NetworkQueryFilter): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:network:count', filter),
    getById: (id: string): Promise<NetworkRequestRow | null> =>
      ipcRenderer.invoke<NetworkRequestRow | null>(
        'radar:db:network:getById',
        id,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:network:clear', deviceId),
  },

  componentTree: {
    getLatest: (deviceId: string): Promise<ComponentTreeRow | null> =>
      ipcRenderer.invoke<ComponentTreeRow | null>(
        'radar:db:componentTree:getLatest',
        deviceId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:componentTree:clear', deviceId),
  },

  profiler: {
    getSessions: (filter: QueryFilter): Promise<ProfilerSessionRow[]> =>
      ipcRenderer.invoke<ProfilerSessionRow[]>(
        'radar:db:profiler:getSessions',
        filter,
      ),
    getCommitsBySession: (
      profilerSessionId: number,
    ): Promise<ProfilerCommitRow[]> =>
      ipcRenderer.invoke<ProfilerCommitRow[]>(
        'radar:db:profiler:getCommitsBySession',
        profilerSessionId,
      ),
    getLatestSession: (deviceId: string): Promise<ProfilerSessionRow | null> =>
      ipcRenderer.invoke<ProfilerSessionRow | null>(
        'radar:db:profiler:getLatestSession',
        deviceId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:profiler:clear', deviceId),
  },

  performance: {
    query: (filter: PerformanceQueryFilter): Promise<PerformanceMetricRow[]> =>
      ipcRenderer.invoke<PerformanceMetricRow[]>(
        'radar:db:performance:query',
        filter,
      ),
    count: (filter: PerformanceQueryFilter): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:performance:count', filter),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:performance:clear', deviceId),
  },

  inspectedComponent: {
    getByComponentId: (
      deviceId: string,
      componentId: string,
    ): Promise<InspectedComponentRow | null> =>
      ipcRenderer.invoke<InspectedComponentRow | null>(
        'radar:db:inspectedComponent:getByComponentId',
        deviceId,
        componentId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:inspectedComponent:clear', deviceId),
  },

  storage: {
    getCapabilities: (deviceId: string): Promise<StorageCapabilityRow[]> =>
      ipcRenderer.invoke<StorageCapabilityRow[]>(
        'radar:db:storage:getCapabilities',
        deviceId,
      ),
    getEntries: (filter: StorageEntryFilter): Promise<StorageEntryRow[]> =>
      ipcRenderer.invoke<StorageEntryRow[]>(
        'radar:db:storage:getEntries',
        filter,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:storage:clear', deviceId),
  },

  state: {
    getCapabilities: (deviceId: string): Promise<StateCapabilityRow[]> =>
      ipcRenderer.invoke<StateCapabilityRow[]>(
        'radar:db:state:getCapabilities',
        deviceId,
      ),
    getSnapshot: (
      deviceId: string,
      storeName: string,
    ): Promise<StateSnapshotRow | null> =>
      ipcRenderer.invoke<StateSnapshotRow | null>(
        'radar:db:state:getSnapshot',
        deviceId,
        storeName,
      ),
    getSnapshots: (deviceId: string): Promise<StateSnapshotRow[]> =>
      ipcRenderer.invoke<StateSnapshotRow[]>(
        'radar:db:state:getSnapshots',
        deviceId,
      ),
    getActions: (
      storeName: string,
      deviceId: string,
    ): Promise<StateActionRow[]> =>
      ipcRenderer.invoke<StateActionRow[]>(
        'radar:db:state:getActions',
        storeName,
        deviceId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:state:clear', deviceId),
  },

  startup: {
    get: (deviceId: string): Promise<StartupMetricRow | null> =>
      ipcRenderer.invoke<StartupMetricRow | null>(
        'radar:db:startup:get',
        deviceId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke<number>('radar:db:startup:clear', deviceId),
  },
};
