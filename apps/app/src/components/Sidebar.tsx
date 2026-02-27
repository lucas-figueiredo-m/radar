import {
  Smartphone,
  GitBranch,
  Activity,
  Wifi,
  Database,
  Terminal,
  Gauge,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';

type Tab = 'console' | 'network' | 'devtools';

interface NavItem {
  id: Tab | string;
  icon: LucideIcon;
  label: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'device',   icon: Smartphone, label: 'Device View',     enabled: false },
  { id: 'tree',     icon: GitBranch,  label: 'Components Tree', enabled: false },
  { id: 'profiler', icon: Activity,   label: 'Profiler',        enabled: false },
  { id: 'network',  icon: Wifi,       label: 'Network',         enabled: true },
  { id: 'storage',  icon: Database,   label: 'Storage',         enabled: false },
  { id: 'console',  icon: Terminal,   label: 'Console',         enabled: true },
  { id: 'metrics',  icon: Gauge,      label: 'Native Metrics',  enabled: false },
];

interface SidebarProps {
  tab: Tab;
  expanded: boolean;
  onTabChange: (tab: Tab) => void;
  onToggle: () => void;
}

export const Sidebar = ({ tab, expanded, onTabChange, onToggle }: SidebarProps) => (
  <div
    className="shrink-0 flex flex-col gap-1 py-3 bg-bg-secondary border-r border-border-default transition-[width] duration-150 ease-in-out overflow-hidden"
    style={{ width: expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-width)', alignItems: expanded ? 'stretch' : 'center' }}
  >
    {/* Logo */}
    <div
      className="flex items-center gap-2.5 mb-3"
      style={{
        padding: expanded ? '0 12px' : '0',
        justifyContent: expanded ? 'flex-start' : 'center',
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-mono text-base font-bold text-text-inverse shrink-0">
        R
      </div>
      {expanded && (
        <span className="text-sm font-bold text-text-primary whitespace-nowrap">Radar</span>
      )}
    </div>

    {/* Nav Items */}
    {NAV_ITEMS.map((item) => {
      const isActive = item.enabled && tab === item.id;
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          title={expanded ? undefined : item.label}
          onClick={() => {
            if (item.enabled) onTabChange(item.id as Tab);
          }}
          className={`h-[var(--toolbar-height)] rounded-md border-none flex items-center gap-2.5 ${
            isActive ? 'bg-bg-surface-hover' : 'bg-transparent hover:bg-bg-surface'
          } ${item.enabled ? 'cursor-pointer opacity-100' : 'cursor-default opacity-40'}`}
          style={{
            padding: expanded ? '0 12px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            width: expanded ? 'auto' : 'var(--toolbar-height)',
            margin: expanded ? '0 8px' : '0 auto',
          }}
        >
          <Icon
            size={20}
            className={isActive ? 'text-accent' : 'text-text-secondary'}
            strokeWidth={1.5}
            style={{ flexShrink: 0 }}
          />
          {expanded && (
            <span
              className={`text-[13px] whitespace-nowrap font-ui ${
                isActive ? 'text-text-primary font-semibold' : 'text-text-secondary font-normal'
              }`}
            >
              {item.label}
            </span>
          )}
        </button>
      );
    })}

    {/* Spacer */}
    <div className="flex-1" />

    {/* Dev Tools (dev only) */}
    {import.meta.env.DEV && (() => {
      const isActive = tab === 'devtools';
      return (
        <button
          title={expanded ? undefined : 'Dev Tools'}
          onClick={() => onTabChange('devtools')}
          className={`h-[var(--toolbar-height)] rounded-md border-none flex items-center gap-2.5 cursor-pointer ${
            isActive ? 'bg-bg-surface-hover' : 'bg-transparent hover:bg-bg-surface'
          }`}
          style={{
            padding: expanded ? '0 12px' : '0',
            justifyContent: expanded ? 'flex-start' : 'center',
            width: expanded ? 'auto' : 'var(--toolbar-height)',
            margin: expanded ? '0 8px' : '0 auto',
          }}
        >
          <Wrench
            size={20}
            className={isActive ? 'text-accent' : 'text-text-secondary'}
            strokeWidth={1.5}
            style={{ flexShrink: 0 }}
          />
          {expanded && (
            <span
              className={`text-[13px] whitespace-nowrap font-ui ${
                isActive ? 'text-text-primary font-semibold' : 'text-text-secondary font-normal'
              }`}
            >
              Dev Tools
            </span>
          )}
        </button>
      );
    })()}

    {/* Toggle Button */}
    <button
      onClick={onToggle}
      title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      className="h-[var(--toolbar-height)] rounded-md border-none bg-transparent flex items-center gap-2.5 cursor-pointer hover:bg-bg-surface"
      style={{
        padding: expanded ? '0 12px' : '0',
        justifyContent: expanded ? 'flex-start' : 'center',
        width: expanded ? 'auto' : 'var(--toolbar-height)',
        margin: expanded ? '0 8px' : '0 auto',
      }}
    >
      {expanded ? (
        <PanelLeftClose size={20} className="text-text-secondary" strokeWidth={1.5} />
      ) : (
        <PanelLeftOpen size={20} className="text-text-secondary" strokeWidth={1.5} />
      )}
      {expanded && (
        <span className="text-[13px] text-text-secondary whitespace-nowrap font-ui">
          Collapse
        </span>
      )}
    </button>
  </div>
);
