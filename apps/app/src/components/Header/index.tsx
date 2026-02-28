import type { CliToolStatus, Device } from '../../types';
import { DeviceSelector } from '..';

type HeaderProps = {
  selectedDevice: Device | null;
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  onClear: () => void;
  cliToolStatuses: CliToolStatus[];
};

const getStatusDot = (device: Device | null) => {
  if (device?.connectionStatus === 'connected') {
    return { color: 'bg-status-success', label: 'Connected' };
  }
  if (device?.connectionStatus === 'device-only') {
    return { color: 'bg-amber-400', label: 'Device running' };
  }
  return { color: 'bg-neutral-500', label: 'No device selected' };
};

export const Header = ({
  selectedDevice,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onClear,
  cliToolStatuses,
}: HeaderProps) => {
  const status = getStatusDot(selectedDevice);

  return (
    <div className="flex items-center justify-between px-4 h-[var(--toolbar-height)] border-b border-border-default shrink-0 bg-bg-header">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold font-display text-text-primary">
          Radar
        </span>
        <span className="text-xs text-text-tertiary">v0.1.0</span>
        <span className="text-xs text-text-disabled">&mdash;</span>
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
          cliToolStatuses={cliToolStatuses}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="text-xs text-text-tertiary">{status.label}</span>
        </div>
        <button
          onClick={onClear}
          className="px-2.5 py-1 bg-bg-elevated border-none rounded-md text-text-primary cursor-pointer text-xs hover:bg-bg-overlay transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
