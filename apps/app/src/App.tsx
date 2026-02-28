import React, { useState, useCallback } from 'react';
import {
  Sidebar,
  Header,
  CliToolAlert,
  ComponentTreePanel,
  ConsolePanel,
  NetworkPanel,
  StatusBar,
  DevToolsPanel,
} from './components';
import { useDeviceManager, useDevTools, useEditorPreference } from './hooks';
import type { Tab } from './types';
import { countNodes } from './utils';

const App = () => {
  const [tab, setTab] = useState<Tab>('console');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [editorPickerOpen, setEditorPickerOpen] = useState(false);
  const { editors, preferredEditor, setPreferredEditor } =
    useEditorPreference();
  const editorName = editors.find(e => e.id === preferredEditor)?.name ?? null;

  const openEditorPicker = useCallback(() => setEditorPickerOpen(true), []);

  const { devices, selectedDeviceId, selectDevice, cliToolStatuses } =
    useDeviceManager();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) ?? null;
  const connected = selectedDevice?.connectionStatus === 'connected';

  const {
    logs,
    filteredLogs,
    requests,
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
    inspectComponent,
    clearInspection,
  } = useDevTools(selectedDeviceId);

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
    tree: (
      <ComponentTreePanel
        tree={componentTree}
        connected={connected}
        selectedComponentId={selectedComponentId}
        inspectedComponent={inspectedComponent}
        onInspectComponent={inspectComponent}
        onClearInspection={clearInspection}
        editorName={editorName}
        onRequestEditorPicker={openEditorPicker}
      />
    ),
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
        <Header
          selectedDevice={selectedDevice}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={selectDevice}
          onClear={handleClear}
          cliToolStatuses={cliToolStatuses}
        />

        <CliToolAlert cliToolStatuses={cliToolStatuses} />

        {panels[tab]}

        <StatusBar
          label={statusLabels[tab]}
          selectedDeviceName={selectedDevice?.name ?? null}
          editors={editors}
          preferredEditor={preferredEditor}
          onEditorChange={setPreferredEditor}
          pickerOpen={editorPickerOpen}
          onTogglePicker={() => setEditorPickerOpen(prev => !prev)}
          onClosePicker={() => setEditorPickerOpen(false)}
        />
      </div>
    </div>
  );
};

export default App;
