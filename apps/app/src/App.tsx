import React, { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Sidebar,
  Header,
  CliToolAlert,
  ComponentTreePanel,
  ConsolePanel,
  NetworkPanel,
  ProfilerPanel,
  PerformancePanel,
  StatusBar,
  DevToolsPanel,
} from './components';
import { PerformanceIndicator } from './components/StatusBar/PerformanceIndicator';
import {
  useDeviceManager,
  useConsoleLogs,
  useNetworkRequests,
  useComponentTree,
  useProfiler,
  usePerformanceMetrics,
  useEditorPreference,
} from './hooks';
import { ipcRenderer } from './services';
import type { Tab } from './types';
import { countNodes } from './utils';

const App = () => {
  const [tab, setTab] = useState<Tab>('console');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [editorPickerOpen, setEditorPickerOpen] = useState(false);
  const { editors, preferredEditor, setPreferredEditor } = useEditorPreference(
    msg => toast.error(msg),
  );
  const editorName = editors.find(e => e.id === preferredEditor)?.name ?? null;

  const openEditorPicker = useCallback(() => setEditorPickerOpen(true), []);

  const { devices, selectedDeviceId, selectDevice, cliToolStatuses } =
    useDeviceManager();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) ?? null;
  const connected = selectedDevice?.connectionStatus === 'connected';

  const {
    logs,
    filteredLogs,
    filter,
    setFilter,
    clearLogs,
    handleMessage: handleConsoleMessage,
  } = useConsoleLogs(selectedDeviceId);

  const {
    requests,
    selectedRequest,
    setSelectedRequest,
    clearRequests,
    handleMessage: handleNetworkMessage,
  } = useNetworkRequests(selectedDeviceId);

  const {
    componentTree,
    selectedComponentId,
    inspectedComponent,
    clearComponentTree,
    inspectComponent,
    clearInspection,
    handleMessage: handleTreeMessage,
  } = useComponentTree(selectedDeviceId);

  const {
    isProfiling,
    commits: profilerCommits,
    selectedCommitIndex,
    selectedCommit,
    activeView,
    componentStats,
    setSelectedCommitIndex,
    setActiveView,
    startProfiling,
    stopProfiling,
    reloadAndProfile,
    clearProfilerData,
    handleMessage: handleProfilerMessage,
    handleDeviceConnected,
  } = useProfiler(selectedDeviceId);

  const {
    metrics: performanceMetrics,
    latestMetric,
    totalDroppedFrames,
    totalGcEvents,
    clearMetrics: clearPerformanceMetrics,
    handleMessage: handlePerformanceMessage,
  } = usePerformanceMetrics(selectedDeviceId);

  useEffect(() => {
    const onMessage = (
      event: unknown,
      message: Record<string, unknown> & { type: string; deviceId: string },
    ) => {
      handleConsoleMessage(event, message);
      handleNetworkMessage(event, message);
      handleTreeMessage(event, message);
      handleProfilerMessage(event, message);
      handlePerformanceMessage(event, message);
    };

    ipcRenderer.on('radar:message', onMessage);

    return () => {
      ipcRenderer.removeListener('radar:message', onMessage);
    };
  }, [
    handleConsoleMessage,
    handleNetworkMessage,
    handleTreeMessage,
    handleProfilerMessage,
    handlePerformanceMessage,
  ]);

  useEffect(() => {
    const onDeviceRegistered = (
      _event: unknown,
      payload: { deviceId: string },
    ) => {
      handleDeviceConnected(payload.deviceId);
    };

    ipcRenderer.on('radar:device-registered', onDeviceRegistered);

    return () => {
      ipcRenderer.removeListener('radar:device-registered', onDeviceRegistered);
    };
  }, [handleDeviceConnected]);

  const handleClear = () => {
    if (tab === 'console') {
      clearLogs();
    } else if (tab === 'tree') {
      clearComponentTree();
    } else if (tab === 'profiler') {
      clearProfilerData();
    } else if (tab === 'performance') {
      clearPerformanceMetrics();
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
    profiler: (
      <ProfilerPanel
        isProfiling={isProfiling}
        commits={profilerCommits}
        selectedCommitIndex={selectedCommitIndex}
        selectedCommit={selectedCommit}
        activeView={activeView}
        componentStats={componentStats}
        connected={connected}
        onSelectCommit={setSelectedCommitIndex}
        onChangeView={setActiveView}
        onStartProfiling={startProfiling}
        onStopProfiling={stopProfiling}
        onReload={reloadAndProfile}
        onClear={clearProfilerData}
      />
    ),
    performance: (
      <PerformancePanel
        metrics={performanceMetrics}
        latestMetric={latestMetric}
        totalDroppedFrames={totalDroppedFrames}
        totalGcEvents={totalGcEvents}
        connected={connected}
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
    profiler: isProfiling
      ? 'Recording...'
      : `${profilerCommits.length} commits`,
    performance: `${performanceMetrics.length} samples`,
    devtools: 'Dev Tools',
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-primary font-mono text-body">
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
          performanceIndicator={
            tab === 'performance' ? (
              <PerformanceIndicator latestMetric={latestMetric} />
            ) : undefined
          }
        />
      </div>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-detail)',
          },
        }}
      />
    </div>
  );
};

export default App;
