import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CliToolStatus, Device } from '../../types';
import { PLATFORM_LABELS } from './constants';
import { DeviceList } from './DeviceList';

type DeviceSelectorProps = {
  devices: Device[];
  selectedDevice: Device | null;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  cliToolStatuses: CliToolStatus[];
};

export const DeviceSelector = ({
  devices,
  selectedDevice,
  selectedDeviceId,
  onSelectDevice,
  cliToolStatuses,
}: DeviceSelectorProps) => {
  const [open, setOpen] = useState(false);

  const displayText = selectedDevice
    ? `${selectedDevice.name} \u2014 ${
        PLATFORM_LABELS[selectedDevice.platform]
      } ${selectedDevice.osVersion}`
    : 'No device selected';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors"
      >
        <span>{displayText}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <DeviceList
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelect={onSelectDevice}
          onClose={() => setOpen(false)}
          cliToolStatuses={cliToolStatuses}
        />
      )}
    </div>
  );
};

export { DeviceList } from './DeviceList';
