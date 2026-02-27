import { useEffect, useState } from 'react';
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

let nextLogId = 0;

export const useDevTools = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [componentTree, setComponentTree] = useState<ComponentTreeState | null>(
    null,
  );
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [inspectedComponent, setInspectedComponent] =
    useState<InspectedComponentData | null>(null);

  useEffect(() => {
    const onMessage = (_event: unknown, message: RadarMessage) => {
      if (message.type === 'console') {
        const msg: ConsoleMessage = message;
        setLogs(prev => [
          ...prev,
          {
            id: nextLogId++,
            level: msg.level,
            args: msg.args,
            timestamp: msg.timestamp,
          },
        ]);
      } else if (message.type === 'network') {
        const msg: NetworkMessage = message;

        if (msg.event === 'request') {
          setRequests(prev => [
            ...prev,
            {
              id: msg.id,
              method: msg.method,
              url: msg.url,
              requestHeaders: msg.requestHeaders,
              requestBody: msg.requestBody,
              timestamp: msg.timestamp,
              pending: true,
            },
          ]);
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
        const msg: ComponentTreeMessage = message;
        setComponentTree({
          rootNodes: msg.rootNodes,
          timestamp: msg.timestamp,
        });
      } else if (message.type === 'inspectComponent') {
        const msg: InspectComponentResponse = message;
        if (msg.componentId === selectedComponentId) {
          setInspectedComponent(msg.data);
        }
      }
    };

    const onConnection = (_event: unknown, data: { connected: boolean }) => {
      setConnected(data.connected);
    };

    ipcRenderer.on('radar:message', onMessage);
    ipcRenderer.on('radar:connection', onConnection);

    return () => {
      ipcRenderer.removeListener('radar:message', onMessage);
      ipcRenderer.removeListener('radar:connection', onConnection);
    };
  }, [selectedComponentId]);

  const filteredLogs =
    filter === 'all' ? logs : logs.filter(l => l.level === filter);

  const clearLogs = () => setLogs([]);

  const clearRequests = () => {
    setRequests([]);
    setSelectedRequest(null);
  };

  const clearComponentTree = () => setComponentTree(null);

  const inspectComponentById = (componentId: string) => {
    setSelectedComponentId(componentId);
    sendCommand({
      type: 'inspectComponent',
      direction: 'request',
      componentId,
    });
  };

  const clearInspection = () => {
    setSelectedComponentId(null);
    setInspectedComponent(null);
  };

  return {
    logs,
    filteredLogs,
    requests,
    connected,
    filter,
    setFilter,
    selectedRequest,
    setSelectedRequest,
    componentTree,
    selectedComponentId,
    inspectedComponent,
    clearLogs,
    clearRequests,
    clearComponentTree,
    inspectComponent: inspectComponentById,
    clearInspection,
  };
};
