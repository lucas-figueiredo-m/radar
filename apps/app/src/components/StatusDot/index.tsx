import type { DeviceConnectionStatus } from '../../types';

export type StatusDotProps = {
  status: DeviceConnectionStatus;
};

const STATUS_COLORS: Record<DeviceConnectionStatus, string> = {
  connected: 'bg-status-success',
  'device-only': 'bg-status-warning',
  offline: 'bg-status-offline',
};

export const StatusDot = ({ status }: StatusDotProps) => (
  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[status]}`} />
);
