import { useEffect, useState } from 'react';
import { ipcRenderer } from '../services';
import type { LogEntry, LogLevel, NetworkEntry } from '../types';

let nextLogId = 0;

export const useDevTools = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (_event: unknown, message: Record<string, unknown>) => {
      if (message.type === 'console') {
        setLogs((prev) => [
          ...prev,
          {
            id: nextLogId++,
            level: message.level as LogLevel,
            args: message.args as unknown[],
            timestamp: message.timestamp as number,
          },
        ]);
      } else if (message.type === 'network') {
        const msg = message as unknown as {
          id: string;
          event: string;
          method: string;
          url: string;
          status?: number;
          statusText?: string;
          duration?: number;
          requestHeaders?: Record<string, string>;
          requestBody?: unknown;
          responseHeaders?: Record<string, string>;
          responseBody?: unknown;
          timestamp: number;
        };

        if (msg.event === 'request') {
          setRequests((prev) => [
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
          setRequests((prev) =>
            prev.map((r) =>
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
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  const clearLogs = () => setLogs([]);

  const clearRequests = () => {
    setRequests([]);
    setSelectedRequest(null);
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
    clearLogs,
    clearRequests,
  };
};
