import {
  Smartphone,
  GitBranch,
  Activity,
  Wifi,
  Database,
  Layers,
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
  { id: 'tree', icon: GitBranch, label: 'Components Tree', enabled: true },
  { id: 'profiler', icon: Activity, label: 'Profiler', enabled: true },
  { id: 'network', icon: Wifi, label: 'Network', enabled: true },
  { id: 'storage', icon: Database, label: 'Storage', enabled: true },
  { id: 'state', icon: Layers, label: 'State', enabled: true },
  { id: 'console', icon: Terminal, label: 'Console', enabled: true },
  { id: 'performance', icon: Gauge, label: 'Performance', enabled: true },
];
