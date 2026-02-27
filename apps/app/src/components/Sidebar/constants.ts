import {
  Smartphone,
  GitBranch,
  Activity,
  Wifi,
  Database,
  Terminal,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import type { Tab } from '../../types';

export type NavItem = {
  id: Tab | string;
  icon: LucideIcon;
  label: string;
  enabled: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'device', icon: Smartphone, label: 'Device View', enabled: false },
  { id: 'tree', icon: GitBranch, label: 'Components Tree', enabled: false },
  { id: 'profiler', icon: Activity, label: 'Profiler', enabled: false },
  { id: 'network', icon: Wifi, label: 'Network', enabled: true },
  { id: 'storage', icon: Database, label: 'Storage', enabled: false },
  { id: 'console', icon: Terminal, label: 'Console', enabled: true },
  { id: 'metrics', icon: Gauge, label: 'Native Metrics', enabled: false },
];
