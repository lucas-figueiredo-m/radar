import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { LogEntry } from '../../types';

Element.prototype.scrollIntoView = vi.fn();

vi.mock('@radar/design-system', () => ({
  colorValues: new Proxy(
    {},
    {
      get: (_: unknown, prop: string | symbol) =>
        typeof prop === 'string' ? '#000000' : undefined,
    },
  ),
}));

vi.mock('..', async () => {
  const actual = await import('../ValueRenderer/index');
  return {
    ValueRenderer: actual.ValueRenderer,
    CopyButton: () => <button aria-label="Copy" />,
  };
});

vi.mock('./CopyButton', () => ({
  CopyButton: () => <button aria-label="Copy" />,
}));

const { ConsolePanel } = await import('./index');

const mkLog = (
  overrides: Partial<LogEntry> & { id: number },
): LogEntry => ({
  level: 'log',
  args: ['hello'],
  timestamp: 1000000,
  deviceId: 'device-1',
  ...overrides,
});

describe('ConsolePanel', () => {
  const defaultProps = {
    logs: [] as LogEntry[],
    connected: false,
    filter: 'all' as const,
    onFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Waiting for React Native" when not connected and no logs', () => {
    render(<ConsolePanel {...defaultProps} connected={false} />);
    expect(
      screen.getByText(
        'Waiting for React Native app to connect on port 8347...',
      ),
    ).toBeInTheDocument();
  });

  it('renders "No logs yet" when connected but no logs', () => {
    render(<ConsolePanel {...defaultProps} connected={true} />);
    expect(
      screen.getByText('No logs yet. Use console.log() in your app.'),
    ).toBeInTheDocument();
  });

  it('renders log entries with ValueRenderer for each arg', () => {
    const logs = [
      mkLog({ id: 1, args: ['hello', 42], timestamp: 1000000 }),
    ];
    render(<ConsolePanel {...defaultProps} logs={logs} connected={true} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders filter buttons for all levels', () => {
    render(<ConsolePanel {...defaultProps} connected={true} />);
    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText(/^log/)).toBeInTheDocument();
    expect(screen.getByText(/^warn/)).toBeInTheDocument();
    expect(screen.getByText(/^error/)).toBeInTheDocument();
    expect(screen.getByText(/^debug/)).toBeInTheDocument();
  });

  it('calls onFilterChange when clicking a filter button', () => {
    const onFilterChange = vi.fn();
    render(
      <ConsolePanel
        {...defaultProps}
        connected={true}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText(/^error/));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });

  it('filters logs by level when filter is set', () => {
    const logs = [
      mkLog({ id: 1, level: 'log', args: ['info msg'], timestamp: 1000 }),
      mkLog({ id: 2, level: 'error', args: ['err msg'], timestamp: 2000 }),
      mkLog({ id: 3, level: 'warn', args: ['warn msg'], timestamp: 3000 }),
    ];
    render(
      <ConsolePanel
        {...defaultProps}
        logs={logs}
        connected={true}
        filter="error"
      />,
    );
    expect(screen.getByText('err msg')).toBeInTheDocument();
    expect(screen.queryByText('info msg')).not.toBeInTheDocument();
    expect(screen.queryByText('warn msg')).not.toBeInTheDocument();
  });

  it('shows level counts in filter bar', () => {
    const logs = [
      mkLog({ id: 1, level: 'log' }),
      mkLog({ id: 2, level: 'log' }),
      mkLog({ id: 3, level: 'error' }),
      mkLog({ id: 4, level: 'warn' }),
      mkLog({ id: 5, level: 'warn' }),
      mkLog({ id: 6, level: 'warn' }),
    ];
    render(
      <ConsolePanel {...defaultProps} logs={logs} connected={true} />,
    );
    expect(screen.getByText(/^log\s*\(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/^error\s*\(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/^warn\s*\(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/^debug\s*\(0\)/)).toBeInTheDocument();
  });

  it('shows count badge for consecutive duplicate logs', () => {
    const logs = [
      mkLog({ id: 1, args: ['dup'], timestamp: 1000 }),
      mkLog({ id: 2, args: ['dup'], timestamp: 2000 }),
      mkLog({ id: 3, args: ['dup'], timestamp: 3000 }),
    ];
    render(
      <ConsolePanel {...defaultProps} logs={logs} connected={true} />,
    );
    expect(screen.getByText('x3')).toBeInTheDocument();
  });

  it('expands group when clicking count badge', () => {
    const logs = [
      mkLog({ id: 1, args: ['dup'], timestamp: 1000 }),
      mkLog({ id: 2, args: ['dup'], timestamp: 2000 }),
    ];
    render(
      <ConsolePanel {...defaultProps} logs={logs} connected={true} />,
    );
    const countBefore = screen.getAllByText('dup').length;

    fireEvent.click(screen.getByText('x2'));

    const countAfter = screen.getAllByText('dup').length;
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  it('collapses group when clicking count badge again', () => {
    const logs = [
      mkLog({ id: 1, args: ['dup'], timestamp: 1000 }),
      mkLog({ id: 2, args: ['dup'], timestamp: 2000 }),
    ];
    render(
      <ConsolePanel {...defaultProps} logs={logs} connected={true} />,
    );
    const badge = screen.getByText('x2');
    fireEvent.click(badge);
    const expandedCount = screen.getAllByText('dup').length;

    fireEvent.click(badge);
    const collapsedCount = screen.getAllByText('dup').length;
    expect(collapsedCount).toBeLessThan(expandedCount);
  });
});
