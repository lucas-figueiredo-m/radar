import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NetworkPanel } from './index';
import type { NetworkEntry } from '../../types';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@radar/design-system', () => ({
  colorValues: new Proxy(
    {},
    {
      get: (_: unknown, prop: string | symbol) =>
        typeof prop === 'string' ? '#000000' : undefined,
    },
  ),
}));

vi.mock('..', () => ({
  NetworkDetailPanel: ({
    request,
    onClose,
  }: {
    request: { id: string };
    onClose: () => void;
  }) => (
    <div data-testid="network-detail-panel">
      <span>{request.id}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const makeRequest = (overrides: Partial<NetworkEntry> = {}): NetworkEntry => ({
  id: 'req-1',
  method: 'GET',
  url: 'https://api.example.com/users',
  timestamp: 1000,
  pending: false,
  status: 200,
  duration: 150,
  deviceId: 'device-1',
  ...overrides,
});

describe('NetworkPanel', () => {
  it('renders empty state when connected with no requests', () => {
    render(
      <NetworkPanel
        requests={[]}
        connected={true}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    expect(screen.getByText('No network requests yet.')).toBeInTheDocument();
  });

  it('renders waiting message when not connected', () => {
    render(
      <NetworkPanel
        requests={[]}
        connected={false}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Waiting for React Native app to connect...'),
    ).toBeInTheDocument();
  });

  it('renders request list with method and URL', () => {
    const requests = [
      makeRequest({
        id: 'req-1',
        method: 'GET',
        url: 'https://api.example.com/users',
      }),
      makeRequest({
        id: 'req-2',
        method: 'POST',
        url: 'https://api.example.com/data',
      }),
    ];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('shows "..." for pending request status', () => {
    const requests = [
      makeRequest({ pending: true, status: undefined, duration: undefined }),
    ];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    const dots = screen.getAllByText('...');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('shows status code for completed request', () => {
    const requests = [makeRequest({ status: 404, pending: false })];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('calls onSelectRequest with id when clicking a row', () => {
    const onSelectRequest = vi.fn();
    const requests = [makeRequest({ id: 'req-1', method: 'GET' })];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest={null}
        onSelectRequest={onSelectRequest}
      />,
    );

    fireEvent.click(
      screen.getByText('GET').closest('div[class*="cursor-pointer"]')!,
    );
    expect(onSelectRequest).toHaveBeenCalledWith('req-1');
  });

  it('calls onSelectRequest with null when clicking already selected row', () => {
    const onSelectRequest = vi.fn();
    const requests = [makeRequest({ id: 'req-1', method: 'GET' })];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest="req-1"
        onSelectRequest={onSelectRequest}
      />,
    );

    fireEvent.click(
      screen.getByText('GET').closest('div[class*="cursor-pointer"]')!,
    );
    expect(onSelectRequest).toHaveBeenCalledWith(null);
  });

  it('shows NetworkDetailPanel when a request is selected', () => {
    const requests = [makeRequest({ id: 'req-1' })];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest="req-1"
        onSelectRequest={vi.fn()}
      />,
    );

    expect(screen.getByTestId('network-detail-panel')).toBeInTheDocument();
  });

  it('does not show NetworkDetailPanel when no request is selected', () => {
    const requests = [makeRequest({ id: 'req-1' })];

    render(
      <NetworkPanel
        requests={requests}
        connected={true}
        selectedRequest={null}
        onSelectRequest={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId('network-detail-panel'),
    ).not.toBeInTheDocument();
  });
});
