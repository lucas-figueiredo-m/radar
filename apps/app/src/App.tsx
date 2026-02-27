import React, { useState } from 'react';
import {
  Sidebar,
  Header,
  ComponentTreePanel,
  ConsolePanel,
  NetworkPanel,
  StatusBar,
  DevToolsPanel,
} from './components';
import { useDevTools } from './hooks';
import type { Tab } from './types';
import { countNodes } from './utils';

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
    componentTree,
    clearLogs,
    clearRequests,
    clearComponentTree,
  } = useDevTools();

  const handleClear = () => {
    if (tab === 'console') {
      clearLogs();
    } else if (tab === 'tree') {
      clearComponentTree();
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
    tree: <ComponentTreePanel tree={componentTree} connected={connected} />,
    devtools: <DevToolsPanel />,
  };

  const statusLabels: Record<Tab, string> = {
    console: `${filteredLogs.length} entries`,
    network: `${requests.length} requests`,
    tree: componentTree
      ? `${countNodes(componentTree.rootNodes)} components`
      : '0 components',
    devtools: 'Dev Tools',
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-primary font-mono text-[13px]">
      <Sidebar
        tab={tab}
        expanded={sidebarExpanded}
        onTabChange={handleTabChange}
        onToggle={() => setSidebarExpanded(prev => !prev)}
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
