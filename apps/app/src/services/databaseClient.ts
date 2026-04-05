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
} from '@radar/database';
import { ipcRenderer } from './ipc';

export const databaseClient = {
  console: {
    query: (filter: ConsoleQueryFilter): Promise<ConsoleLogRow[]> =>
      ipcRenderer.invoke('radar:db:console:query', filter),
    count: (filter: ConsoleQueryFilter): Promise<number> =>
      ipcRenderer.invoke('radar:db:console:count', filter),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:console:clear', deviceId),
  },

  network: {
    query: (filter: NetworkQueryFilter): Promise<NetworkRequestRow[]> =>
      ipcRenderer.invoke('radar:db:network:query', filter),
    count: (filter: NetworkQueryFilter): Promise<number> =>
      ipcRenderer.invoke('radar:db:network:count', filter),
    getById: (id: string): Promise<NetworkRequestRow | null> =>
      ipcRenderer.invoke('radar:db:network:getById', id),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:network:clear', deviceId),
  },

  componentTree: {
    getLatest: (deviceId: string): Promise<ComponentTreeRow | null> =>
      ipcRenderer.invoke('radar:db:componentTree:getLatest', deviceId),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:componentTree:clear', deviceId),
  },

  profiler: {
    getSessions: (filter: QueryFilter): Promise<ProfilerSessionRow[]> =>
      ipcRenderer.invoke('radar:db:profiler:getSessions', filter),
    getCommitsBySession: (
      profilerSessionId: number,
    ): Promise<ProfilerCommitRow[]> =>
      ipcRenderer.invoke(
        'radar:db:profiler:getCommitsBySession',
        profilerSessionId,
      ),
    getLatestSession: (deviceId: string): Promise<ProfilerSessionRow | null> =>
      ipcRenderer.invoke('radar:db:profiler:getLatestSession', deviceId),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:profiler:clear', deviceId),
  },

  performance: {
    query: (filter: PerformanceQueryFilter): Promise<PerformanceMetricRow[]> =>
      ipcRenderer.invoke('radar:db:performance:query', filter),
    count: (filter: PerformanceQueryFilter): Promise<number> =>
      ipcRenderer.invoke('radar:db:performance:count', filter),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:performance:clear', deviceId),
  },

  inspectedComponent: {
    getByComponentId: (
      deviceId: string,
      componentId: string,
    ): Promise<InspectedComponentRow | null> =>
      ipcRenderer.invoke(
        'radar:db:inspectedComponent:getByComponentId',
        deviceId,
        componentId,
      ),
    clear: (deviceId: string): Promise<number> =>
      ipcRenderer.invoke('radar:db:inspectedComponent:clear', deviceId),
  },
};
