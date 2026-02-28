import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceSelector } from './index';
import type { Device } from '../../types';

vi.mock('@radar/design-system', () => ({
  colorValues: new Proxy(
    {},
    {
      get: (_: unknown, prop: string | symbol) =>
        typeof prop === 'string' ? '#000000' : undefined,
    },
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronDown: (props: Record<string, unknown>) => (
    <span data-testid="chevron-icon" {...props} />
  ),
  Check: (props: Record<string, unknown>) => (
    <span data-testid="check-icon" {...props} />
  ),
}));

vi.mock('../../hooks', () => ({
  useClickOutside: vi.fn(() => ({ current: null })),
}));

vi.mock('..', () => ({
  StatusDot: ({ status }: { status: string }) => (
    <span data-testid="status-dot" data-status={status} />
  ),
}));

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  id: 'device-1',
  name: 'iPhone 15',
  platform: 'ios',
  osVersion: '17.4',
  connectionStatus: 'connected',
  projectRoot: null,
  ...overrides,
});

describe('DeviceSelector', () => {
  it('shows "No device selected" when no device is selected', () => {
    render(
      <DeviceSelector
        devices={[]}
        selectedDevice={null}
        selectedDeviceId={null}
        onSelectDevice={vi.fn()}
        cliToolStatuses={[]}
      />,
    );

    expect(screen.getByText('No device selected')).toBeInTheDocument();
  });

  it('shows selected device name with platform info', () => {
    const device = makeDevice({ name: 'iPhone 15', platform: 'ios', osVersion: '17.4' });

    render(
      <DeviceSelector
        devices={[device]}
        selectedDevice={device}
        selectedDeviceId="device-1"
        onSelectDevice={vi.fn()}
        cliToolStatuses={[]}
      />,
    );

    expect(screen.getByText(/iPhone 15/)).toBeInTheDocument();
    expect(screen.getByText(/iOS/)).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    const device = makeDevice();

    render(
      <DeviceSelector
        devices={[device]}
        selectedDevice={device}
        selectedDeviceId="device-1"
        onSelectDevice={vi.fn()}
        cliToolStatuses={[]}
      />,
    );

    const button = screen.getByText(/iPhone 15/).closest('button')!;
    fireEvent.click(button);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('closes dropdown when clicking toggle again', () => {
    const device = makeDevice();

    render(
      <DeviceSelector
        devices={[device]}
        selectedDevice={device}
        selectedDeviceId="device-1"
        onSelectDevice={vi.fn()}
        cliToolStatuses={[]}
      />,
    );

    const button = screen.getByText(/iPhone 15/).closest('button')!;
    fireEvent.click(button);
    expect(screen.getByText('Connected')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });

  it('calls onSelectDevice when a device in the list is clicked', () => {
    const onSelectDevice = vi.fn();
    const devices = [
      makeDevice({ id: 'dev-1', name: 'iPhone 15' }),
      makeDevice({ id: 'dev-2', name: 'Pixel 6', platform: 'android' }),
    ];

    render(
      <DeviceSelector
        devices={devices}
        selectedDevice={devices[0]}
        selectedDeviceId="dev-1"
        onSelectDevice={onSelectDevice}
        cliToolStatuses={[]}
      />,
    );

    fireEvent.click(screen.getByText(/iPhone 15/).closest('button')!);

    const deviceButtons = screen.getAllByRole('button');
    const pixel6Button = deviceButtons.find(b => b.textContent?.includes('Pixel 6'));
    fireEvent.click(pixel6Button!);

    expect(onSelectDevice).toHaveBeenCalledWith('dev-2');
  });

  it('groups devices by connection status in the dropdown', () => {
    const devices = [
      makeDevice({ id: 'dev-1', name: 'iPhone 15', connectionStatus: 'connected' }),
      makeDevice({
        id: 'dev-2',
        name: 'iPad',
        connectionStatus: 'device-only',
      }),
    ];

    render(
      <DeviceSelector
        devices={devices}
        selectedDevice={devices[0]}
        selectedDeviceId="dev-1"
        onSelectDevice={vi.fn()}
        cliToolStatuses={[]}
      />,
    );

    fireEvent.click(screen.getByText(/iPhone 15/).closest('button')!);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Device running')).toBeInTheDocument();
  });
});
