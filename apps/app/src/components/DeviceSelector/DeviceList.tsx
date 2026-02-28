import { Check } from 'lucide-react';
import type {
  CliToolStatus,
  Device,
  DeviceConnectionStatus,
} from '../../types';
import { useClickOutside } from '../../hooks';
import { StatusDot } from '..';
import { PLATFORM_LABELS, STATUS_LABELS } from './constants';

type DeviceListProps = {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  cliToolStatuses: CliToolStatus[];
};

const STATUS_ORDER: DeviceConnectionStatus[] = [
  'connected',
  'device-only',
  'offline',
];

const TOOL_PLATFORM_MAP = {
  xcrun: 'iOS simulator',
  adb: 'Android emulator',
} as const;

export const DeviceList = ({
  devices,
  selectedDeviceId,
  onSelect,
  onClose,
  cliToolStatuses,
}: DeviceListProps) => {
  const ref = useClickOutside<HTMLDivElement>(onClose);

  const groupedDevices = STATUS_ORDER.map(status => ({
    status,
    label: STATUS_LABELS[status],
    items: devices.filter(d => d.connectionStatus === status),
  })).filter(group => group.items.length > 0);

  const unavailableTools = cliToolStatuses.filter(s => !s.available);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-1 left-0 bg-bg-elevated border border-border-default rounded-md shadow-lg py-1 min-w-[240px] z-50"
    >
      {groupedDevices.length === 0 && (
        <div className="px-3 py-3 text-[11px] text-text-disabled text-center">
          No devices found
        </div>
      )}

      {groupedDevices.map(group => (
        <div key={group.status}>
          <div className="px-3 py-1.5 text-[10px] uppercase text-text-tertiary font-semibold tracking-wider">
            {group.label}
          </div>
          {group.items.map(device => {
            const isSelectable = device.connectionStatus !== 'offline';
            const isSelected = device.id === selectedDeviceId;

            return (
              <button
                key={device.id}
                onClick={() => {
                  if (isSelectable) {
                    onSelect(device.id);
                    onClose();
                  }
                }}
                disabled={!isSelectable}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left ${
                  isSelectable
                    ? 'hover:bg-bg-surface cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <StatusDot status={device.connectionStatus} />
                <span className="flex flex-col min-w-0 flex-1">
                  <span
                    className={
                      isSelectable ? 'text-text-primary' : 'text-text-disabled'
                    }
                  >
                    {device.name}
                  </span>
                  <span
                    className={
                      isSelectable
                        ? 'text-text-tertiary text-[10px]'
                        : 'text-text-disabled text-[10px]'
                    }
                  >
                    {PLATFORM_LABELS[device.platform]} {device.osVersion}
                  </span>
                </span>
                <span className="w-3.5 shrink-0">
                  {isSelected && <Check size={12} className="text-accent" />}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      {unavailableTools.length > 0 && (
        <div className="border-t border-border-default mt-1 pt-1 px-3 py-1.5">
          {unavailableTools.map(tool => (
            <div
              key={tool.tool}
              className="text-[10px] text-amber-400 leading-relaxed"
            >
              ⚠ {tool.tool} not found &mdash; {TOOL_PLATFORM_MAP[tool.tool]}{' '}
              detection unavailable
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
