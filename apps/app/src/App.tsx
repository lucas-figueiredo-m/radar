import { useEffect, useRef, useState } from 'react';
import {
  Smartphone,
  GitBranch,
  Activity,
  Wifi,
  Database,
  Terminal,
  Gauge,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const electron = (window as any).require?.('electron');
const ipcRenderer = electron?.ipcRenderer;

// ─── Types ───────────────────────────────────────────────

type Tab = 'console' | 'network';
type LogLevel = 'log' | 'warn' | 'error' | 'debug';

// ─── Sidebar Config ──────────────────────────────────────

interface NavItem {
  id: Tab | string;
  icon: LucideIcon;
  label: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'device',    icon: Smartphone, label: 'Device View',     enabled: false },
  { id: 'tree',      icon: GitBranch,  label: 'Components Tree', enabled: false },
  { id: 'profiler',  icon: Activity,   label: 'Profiler',        enabled: false },
  { id: 'network',   icon: Wifi,       label: 'Network',         enabled: true },
  { id: 'storage',   icon: Database,   label: 'Storage',         enabled: false },
  { id: 'console',   icon: Terminal,   label: 'Console',         enabled: true },
  { id: 'metrics',   icon: Gauge,      label: 'Native Metrics',  enabled: false },
];

interface LogEntry {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
}

interface NetworkEntry {
  id: string;
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
  pending: boolean;
}

// ─── Constants ───────────────────────────────────────────

const LEVEL_STYLES: Record<LogLevel, { bg: string; color: string; label: string }> = {
  log: { bg: '#1e1e2e', color: '#cdd6f4', label: 'LOG' },
  warn: { bg: '#3d3200', color: '#f9e2af', label: 'WRN' },
  error: { bg: '#3d0000', color: '#f38ba8', label: 'ERR' },
  debug: { bg: '#1e1e2e', color: '#89b4fa', label: 'DBG' },
};

let nextLogId = 0;

// ─── Helpers ─────────────────────────────────────────────

function formatArg(arg: unknown): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (typeof arg === 'object' && arg !== null && '__type' in (arg as Record<string, unknown>) && (arg as Record<string, unknown>).__type === 'Error') {
    const err = arg as { message: string; stack?: string };
    return `Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function statusColor(status?: number): string {
  if (!status || status === 0) return '#f38ba8';
  if (status < 300) return '#a6e3a1';
  if (status < 400) return '#f9e2af';
  return '#f38ba8';
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return '...';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > 60 ? path.slice(0, 60) + '...' : path;
  } catch {
    return url.length > 60 ? url.slice(0, 60) + '...' : url;
  }
}

function urlHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

// ─── App ─────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<Tab>('console');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const logBottomRef = useRef<HTMLDivElement>(null);
  const netBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (_event: unknown, message: Record<string, unknown>) => {
      if (message.type === 'console') {
        setLogs(prev => [...prev, {
          id: nextLogId++,
          level: message.level as LogLevel,
          args: message.args as unknown[],
          timestamp: message.timestamp as number,
        }]);
      } else if (message.type === 'network') {
        const msg = message as unknown as {
          id: string; event: string; method: string; url: string;
          status?: number; statusText?: string; duration?: number;
          requestHeaders?: Record<string, string>; requestBody?: unknown;
          responseHeaders?: Record<string, string>; responseBody?: unknown;
          timestamp: number;
        };

        if (msg.event === 'request') {
          setRequests(prev => [...prev, {
            id: msg.id,
            method: msg.method,
            url: msg.url,
            requestHeaders: msg.requestHeaders,
            requestBody: msg.requestBody,
            timestamp: msg.timestamp,
            pending: true,
          }]);
        } else if (msg.event === 'response') {
          setRequests(prev => prev.map(r => r.id === msg.id ? {
            ...r,
            status: msg.status,
            statusText: msg.statusText,
            duration: msg.duration,
            responseHeaders: msg.responseHeaders,
            responseBody: msg.responseBody,
            pending: false,
          } : r));
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

  useEffect(() => {
    if (tab === 'console') logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, tab]);

  useEffect(() => {
    if (tab === 'network' && !selectedRequest) netBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests, tab, selectedRequest]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter);
  const selected = requests.find(r => r.id === selectedRequest);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'SF Mono, Menlo, Monaco, monospace', fontSize: 13 }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarExpanded ? 220 : 56,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: sidebarExpanded ? 'stretch' : 'center',
        gap: 4,
        padding: '12px 0',
        background: '#16162a',
        borderRight: '1px solid #2e2e50',
        transition: 'width 150ms ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          padding: sidebarExpanded ? '0 12px' : 0,
          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#6c6cff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            R
          </div>
          {sidebarExpanded && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#cdd6f4', whiteSpace: 'nowrap' }}>Radar</span>
          )}
        </div>

        {/* Nav Items */}
        {NAV_ITEMS.map(item => {
          const isActive = item.enabled && tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              title={sidebarExpanded ? undefined : item.label}
              onClick={() => {
                if (item.enabled) {
                  setTab(item.id as Tab);
                  setSelectedRequest(null);
                }
              }}
              style={{
                height: 40,
                borderRadius: 4,
                border: 'none',
                background: isActive ? '#222240' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: item.enabled ? 'pointer' : 'default',
                opacity: item.enabled ? 1 : 0.4,
                padding: sidebarExpanded ? '0 12px' : 0,
                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                width: sidebarExpanded ? 'auto' : 40,
                margin: sidebarExpanded ? '0 8px' : '0 auto',
              }}
            >
              <Icon size={20} color={isActive ? '#6c6cff' : '#9898b0'} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              {sidebarExpanded && (
                <span style={{
                  fontSize: 13,
                  color: isActive ? '#cdd6f4' : '#9898b0',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarExpanded(prev => !prev)}
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            height: 40,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: sidebarExpanded ? '0 12px' : 0,
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            width: sidebarExpanded ? 'auto' : 40,
            margin: sidebarExpanded ? '0 8px' : '0 auto',
          }}
        >
          {sidebarExpanded
            ? <PanelLeftClose size={20} color="#9898b0" strokeWidth={1.5} />
            : <PanelLeftOpen size={20} color="#9898b0" strokeWidth={1.5} />
          }
          {sidebarExpanded && (
            <span style={{ fontSize: 13, color: '#9898b0', whiteSpace: 'nowrap', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Collapse
            </span>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 40, borderBottom: '1px solid #2e2e50', flexShrink: 0, background: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'SF Pro Display, -apple-system, sans-serif', color: '#cdd6f4' }}>Radar</span>
            <span style={{ fontSize: 12, color: '#6c7086' }}>v0.1.0</span>
            <span style={{ fontSize: 12, color: '#585b70' }}>—</span>
            <span style={{ fontSize: 12, color: '#6c7086' }}>iPhone 15 Pro — iOS 17.2 /</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#a6e3a1' : '#f38ba8' }} />
              <span style={{ fontSize: 12, color: '#6c7086' }}>{connected ? 'Connected' : 'Waiting for app...'}</span>
            </div>
            <button
              onClick={() => { tab === 'console' ? setLogs([]) : setRequests([]); setSelectedRequest(null); }}
              style={{ padding: '4px 10px', background: '#313244', border: 'none', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer', fontSize: 12 }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Console tab */}
        {tab === 'console' && (
        <>
          <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid #313244', flexShrink: 0 }}>
            {(['all', 'log', 'warn', 'error', 'debug'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                style={{
                  padding: '3px 10px',
                  background: filter === level ? '#45475a' : 'transparent',
                  border: '1px solid',
                  borderColor: filter === level ? '#585b70' : 'transparent',
                  borderRadius: 4,
                  color: level === 'all' ? '#cdd6f4' : LEVEL_STYLES[level].color,
                  cursor: 'pointer',
                  fontSize: 12,
                  textTransform: 'uppercase',
                }}
              >
                {level} {level !== 'all' && `(${logs.filter(l => l.level === level).length})`}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086' }}>
                {connected ? 'No logs yet. Use console.log() in your app.' : 'Waiting for React Native app to connect on port 8347...'}
              </div>
            ) : (
              filteredLogs.map(entry => {
                const s = LEVEL_STYLES[entry.level];
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 10, padding: '6px 16px', background: s.bg, borderBottom: '1px solid #181825', alignItems: 'flex-start' }}>
                    <span style={{ color: '#585b70', fontSize: 11, flexShrink: 0, minWidth: 85, paddingTop: 1 }}>{formatTime(entry.timestamp)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.color, background: s.color + '20', padding: '2px 5px', borderRadius: 3, flexShrink: 0, minWidth: 30, textAlign: 'center' }}>{s.label}</span>
                    <span style={{ color: s.color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', flex: 1 }}>{entry.args.map(formatArg).join(' ')}</span>
                  </div>
                );
              })
            )}
            <div ref={logBottomRef} />
          </div>
        </>
      )}

        {/* Network tab */}
        {tab === 'network' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Request list */}
          <div style={{ flex: selectedRequest ? 1 : 1, overflow: 'auto', borderRight: selectedRequest ? '1px solid #313244' : 'none' }}>
            {/* Column headers */}
            <div style={{ display: 'flex', padding: '8px 16px', borderBottom: '1px solid #313244', fontSize: 11, color: '#585b70', fontWeight: 600, position: 'sticky', top: 0, background: '#1e1e2e', zIndex: 1 }}>
              <span style={{ width: 60 }}>Method</span>
              <span style={{ flex: 1 }}>URL</span>
              <span style={{ width: 60, textAlign: 'right' }}>Status</span>
              <span style={{ width: 80, textAlign: 'right' }}>Time</span>
            </div>
            {requests.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 36px)', color: '#6c7086' }}>
                {connected ? 'No network requests yet.' : 'Waiting for React Native app to connect...'}
              </div>
            ) : (
              requests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                  style={{
                    display: 'flex',
                    padding: '7px 16px',
                    borderBottom: '1px solid #181825',
                    cursor: 'pointer',
                    background: selectedRequest === req.id ? '#313244' : 'transparent',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (selectedRequest !== req.id) e.currentTarget.style.background = '#252536'; }}
                  onMouseLeave={e => { if (selectedRequest !== req.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 60,
                    fontSize: 11,
                    fontWeight: 700,
                    color: req.method === 'GET' ? '#89b4fa' : req.method === 'POST' ? '#a6e3a1' : req.method === 'DELETE' ? '#f38ba8' : '#f9e2af',
                  }}>
                    {req.method}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#cdd6f4' }}>
                    {truncateUrl(req.url)}
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#585b70' }}>{urlHost(req.url)}</span>
                  </span>
                  <span style={{ width: 60, textAlign: 'right', fontWeight: 600, color: req.pending ? '#585b70' : statusColor(req.status) }}>
                    {req.pending ? '...' : req.status || 'ERR'}
                  </span>
                  <span style={{ width: 80, textAlign: 'right', color: '#585b70', fontSize: 12 }}>
                    {formatDuration(req.duration)}
                  </span>
                </div>
              ))
            )}
            <div ref={netBottomRef} />
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 420, overflow: 'auto', padding: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Request Detail</span>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              {/* General */}
              <DetailSection title="General">
                <DetailRow label="URL" value={selected.url} />
                <DetailRow label="Method" value={selected.method} />
                <DetailRow label="Status" value={selected.status ? `${selected.status} ${selected.statusText ?? ''}` : (selected.pending ? 'Pending...' : 'Failed')} />
                <DetailRow label="Duration" value={formatDuration(selected.duration)} />
                <DetailRow label="Time" value={formatTime(selected.timestamp)} />
              </DetailSection>

              {/* Request Headers */}
              {selected.requestHeaders && Object.keys(selected.requestHeaders).length > 0 && (
                <DetailSection title="Request Headers">
                  {Object.entries(selected.requestHeaders).map(([k, v]) => (
                    <DetailRow key={k} label={k} value={v} />
                  ))}
                </DetailSection>
              )}

              {/* Request Body */}
              {selected.requestBody !== undefined && (
                <DetailSection title="Request Body">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#cdd6f4', fontSize: 12, lineHeight: 1.5 }}>
                    {typeof selected.requestBody === 'string' ? selected.requestBody : JSON.stringify(selected.requestBody, null, 2)}
                  </pre>
                </DetailSection>
              )}

              {/* Response Headers */}
              {selected.responseHeaders && Object.keys(selected.responseHeaders).length > 0 && (
                <DetailSection title="Response Headers">
                  {Object.entries(selected.responseHeaders).map(([k, v]) => (
                    <DetailRow key={k} label={k} value={v} />
                  ))}
                </DetailSection>
              )}

              {/* Response Body */}
              {selected.responseBody !== undefined && (
                <DetailSection title="Response Body">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#cdd6f4', fontSize: 12, lineHeight: 1.5 }}>
                    {typeof selected.responseBody === 'string' ? selected.responseBody : JSON.stringify(selected.responseBody, null, 2)}
                  </pre>
                </DetailSection>
              )}
            </div>
          )}
        </div>
      )}

        {/* Status bar */}
        <div style={{ padding: '6px 16px', borderTop: '1px solid #313244', fontSize: 11, color: '#585b70', flexShrink: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>{tab === 'console' ? `${filteredLogs.length} entries` : `${requests.length} requests`}</span>
          <span>ws://localhost:8347</span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Components ───────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
      <div style={{ background: '#181825', borderRadius: 6, padding: 10 }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: '#6c7086', minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#cdd6f4', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export default App;
