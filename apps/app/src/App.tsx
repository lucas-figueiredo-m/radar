import React, { useState } from 'react';
import {
  Sidebar,
  Header,
  ConsolePanel,
  NetworkPanel,
  StatusBar,
  DevToolsPanel,
} from './components';
import { useDevTools } from './hooks';
import type { Tab } from './types';

const App = () => {
  const [tab, setTab] = useState<Tab>('console');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const {
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
  } = useDevTools();

  const handleClear = () => {
    if (tab === 'console') {
      clearLogs();
    } else {
      clearRequests();
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSelectedRequest(null);
  };

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
