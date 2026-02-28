import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './index';
import type { Device } from '../../types';

vi.mock('..', () => ({
  DeviceSelector: () => <div data-testid="device-selector" />,
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

const defaultProps = {
  devices: [] as Device[],
  selectedDeviceId: null as string | null,
  onSelectDevice: vi.fn(),
  onClear: vi.fn(),
  cliToolStatuses: [],
};

describe('Header', () => {
  it('renders Radar branding', () => {
    render(<Header {...defaultProps} selectedDevice={null} />);

    expect(screen.getByText('Radar')).toBeInTheDocument();
  });

  it('shows "Connected" label for connected device', () => {
    const device = makeDevice({ connectionStatus: 'connected' });

    render(<Header {...defaultProps} selectedDevice={device} />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Device running" label for device-only status', () => {
    const device = makeDevice({ connectionStatus: 'device-only' });

    render(<Header {...defaultProps} selectedDevice={device} />);

    expect(screen.getByText('Device running')).toBeInTheDocument();
  });

  it('shows "No device selected" when device is null', () => {
    render(<Header {...defaultProps} selectedDevice={null} />);

    expect(screen.getByText('No device selected')).toBeInTheDocument();
  });

  it('calls onClear when Clear button is clicked', () => {
    const onClear = vi.fn();

    render(
      <Header {...defaultProps} selectedDevice={null} onClear={onClear} />,
    );

    fireEvent.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('renders StatusDot with correct status', () => {
    const device = makeDevice({ connectionStatus: 'connected' });

    render(<Header {...defaultProps} selectedDevice={device} />);

    const dot = screen.getByTestId('status-dot');
    expect(dot).toHaveAttribute('data-status', 'connected');
  });

  it('renders StatusDot with offline status when no device', () => {
    render(<Header {...defaultProps} selectedDevice={null} />);

    const dot = screen.getByTestId('status-dot');
    expect(dot).toHaveAttribute('data-status', 'offline');
  });

  it('renders DeviceSelector', () => {
    render(<Header {...defaultProps} selectedDevice={null} />);

    expect(screen.getByTestId('device-selector')).toBeInTheDocument();
  });
});
