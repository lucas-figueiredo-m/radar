import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ComponentTreeMessage,
  ConsoleMessage,
  InspectedComponentData,
  InspectComponentResponse,
  NetworkMessage,
  RadarMessage,
} from '@radar/types';
import { ipcRenderer, sendCommand } from '../services';
import type {
  ComponentTreeState,
  LogEntry,
  LogLevel,
  NetworkEntry,
} from '../types';
import { MAX_LOGS, MAX_REQUESTS } from './constants';

type StampedMessage = RadarMessage & { deviceId: string };

export const useDevTools = (selectedDeviceId: string | null) => {
  const nextLogIdRef = useRef(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [componentTrees, setComponentTrees] = useState<
    Map<string, ComponentTreeState>
  >(new Map());
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [inspectedComponent, setInspectedComponent] =
    useState<InspectedComponentData | null>(null);

  useEffect(() => {
    const onMessage = (_event: unknown, message: StampedMessage) => {
      if (message.type === 'console') {
        const msg = message as ConsoleMessage & { deviceId: string };
        setLogs(prev => {
          const next = [
            ...prev,
            {
              id: nextLogIdRef.current++,
              level: msg.level,
              args: msg.args,
              timestamp: msg.timestamp,
              deviceId: msg.deviceId,
            },
          ];
          return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });
      } else if (message.type === 'network') {
        const msg = message as NetworkMessage & { deviceId: string };

        if (msg.event === 'request') {
          setRequests(prev => {
            const next = [
              ...prev,
              {
                id: msg.id,
                method: msg.method,
                url: msg.url,
                requestHeaders: msg.requestHeaders,
                requestBody: msg.requestBody,
                timestamp: msg.timestamp,
                pending: true,
                deviceId: msg.deviceId,
              },
            ];
            return next.length > MAX_REQUESTS
              ? next.slice(-MAX_REQUESTS)
              : next;
          });
        } else if (msg.event === 'response') {
          setRequests(prev =>
            prev.map(r =>
              r.id === msg.id
                ? {
                    ...r,
                    status: msg.status,
                    statusText: msg.statusText,
                    duration: msg.duration,
                    responseHeaders: msg.responseHeaders,
                    responseBody: msg.responseBody,
                    pending: false,
                  }
                : r,
            ),
          );
        }
      } else if (message.type === 'componentTree') {
        const msg = message as ComponentTreeMessage & { deviceId: string };
        setComponentTrees(prev => {
          const next = new Map(prev);
          next.set(msg.deviceId, {
            rootNodes: msg.rootNodes,
            timestamp: msg.timestamp,
            deviceId: msg.deviceId,
          });
          return next;
        });
      } else if (message.type === 'inspectComponent') {
        const msg = message as InspectComponentResponse & {
          deviceId: string;
        };
        if (msg.componentId === selectedComponentId) {
          setInspectedComponent(msg.data);
        }
      }
    };

    ipcRenderer.on('radar:message', onMessage);

    return () => {
      ipcRenderer.removeListener('radar:message', onMessage);
    };
  }, [selectedComponentId]);

  const deviceLogs = useMemo(
    () =>
      selectedDeviceId ? logs.filter(l => l.deviceId === selectedDeviceId) : [],
    [logs, selectedDeviceId],
  );

  const filteredLogs = useMemo(
    () =>
      filter === 'all'
        ? deviceLogs
        : deviceLogs.filter(l => l.level === filter),
    [deviceLogs, filter],
  );

  const deviceRequests = useMemo(
    () =>
      selectedDeviceId
        ? requests.filter(r => r.deviceId === selectedDeviceId)
        : [],
    [requests, selectedDeviceId],
  );

  const deviceComponentTree = useMemo(
    () =>
      selectedDeviceId ? componentTrees.get(selectedDeviceId) ?? null : null,
    [componentTrees, selectedDeviceId],
  );

  const clearLogs = useCallback(() => {
    if (!selectedDeviceId) return;
    setLogs(prev => prev.filter(l => l.deviceId !== selectedDeviceId));
  }, [selectedDeviceId]);

  const clearRequests = useCallback(() => {
    if (!selectedDeviceId) return;
    setRequests(prev => prev.filter(r => r.deviceId !== selectedDeviceId));
    setSelectedRequest(null);
  }, [selectedDeviceId]);

  const clearComponentTree = useCallback(() => {
    if (!selectedDeviceId) return;
    setComponentTrees(prev => {
      const next = new Map(prev);
      next.delete(selectedDeviceId);
      return next;
    });
  }, [selectedDeviceId]);

  const inspectComponentById = useCallback(
    (componentId: string) => {
      if (!selectedDeviceId) return;
      setSelectedComponentId(componentId);
      sendCommand(selectedDeviceId, {
        type: 'inspectComponent',
        direction: 'request',
        componentId,
      });
    },
    [selectedDeviceId],
  );

  const clearInspection = useCallback(() => {
    setSelectedComponentId(null);
    setInspectedComponent(null);
  }, []);

  return {
    logs: deviceLogs,
    filteredLogs,
    requests: deviceRequests,
    filter,
    setFilter,
    selectedRequest,
    setSelectedRequest,
    componentTree: deviceComponentTree,
    selectedComponentId,
    inspectedComponent,
    clearLogs,
    clearRequests,
    clearComponentTree,
    inspectComponent: inspectComponentById,
    clearInspection,
  };
};
