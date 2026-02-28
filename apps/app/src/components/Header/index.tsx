import type { CliToolStatus, Device } from '../../types';
import { DeviceSelector } from '../DeviceSelector';
import { StatusDot } from '../StatusDot';

type HeaderProps = {
  selectedDevice: Device | null;
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  onClear: () => void;
  cliToolStatuses: CliToolStatus[];
};

const getStatusLabel = (device: Device | null) => {
  if (device?.connectionStatus === 'connected') return 'Connected';
  if (device?.connectionStatus === 'device-only') return 'Device running';
  return 'No device selected';
};

export const Header = ({
  selectedDevice,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onClear,
  cliToolStatuses,
}: HeaderProps) => {
  const statusLabel = getStatusLabel(selectedDevice);

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
          <StatusDot status={selectedDevice?.connectionStatus ?? 'offline'} />
          <span className="text-xs text-text-tertiary">{statusLabel}</span>
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
