import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ConsolePanel } from './components/ConsolePanel';
import { NetworkPanel } from './components/NetworkPanel';
import { StatusBar } from './components/StatusBar';
import { DevToolsPanel } from './components/DevToolsPanel';
import { ipcRenderer } from './services';
import type { LogEntry, LogLevel, NetworkEntry, Tab } from './types';

let nextLogId = 0;

const App = () => {
  const [tab, setTab] = useState<Tab>('console');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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

  const handleClear = () => {
    if (tab === 'console') {
      setLogs([]);
    } else {
      setRequests([]);
      setSelectedRequest(null);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSelectedRequest(null);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  const panels: Record<Tab, React.ReactNode> = {
    console: (
      <ConsolePanel
        logs={logs}
        connected={connected}
        filter={filter}
        onFilterChange={setFilter}
      />
    ),
    network: (
      <NetworkPanel
        requests={requests}
        connected={connected}
        selectedRequest={selectedRequest}
        onSelectRequest={setSelectedRequest}
      />
    ),
    devtools: <DevToolsPanel />,
  };

  const statusLabels: Record<Tab, string> = {
    console: `${filteredLogs.length} entries`,
    network: `${requests.length} requests`,
    devtools: 'Dev Tools',
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-primary font-mono text-[13px]">
      <Sidebar
        tab={tab}
        expanded={sidebarExpanded}
        onTabChange={handleTabChange}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header connected={connected} onClear={handleClear} />

        {panels[tab]}

        <StatusBar label={statusLabels[tab]} />
      </div>
    </div>
  );
};

export default App;
