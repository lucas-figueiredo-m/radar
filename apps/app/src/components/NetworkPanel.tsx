import { useEffect, useRef } from 'react';
import { colorValues } from '@radar/design-system';
import { NetworkDetailPanel } from './NetworkDetailPanel';
import { METHOD_COLORS, statusColor, formatDuration, truncateUrl, urlHost } from '../utils';
import type { NetworkEntry } from '../types';

interface NetworkPanelProps {
  requests: NetworkEntry[];
  connected: boolean;
  selectedRequest: string | null;
  onSelectRequest: (id: string | null) => void;
}

export const NetworkPanel = ({
  requests,
  connected,
  selectedRequest,
  onSelectRequest,
}: NetworkPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const selected = requests.find((r) => r.id === selectedRequest);

  useEffect(() => {
    if (!selectedRequest) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests.length, selectedRequest]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Request list */}
      <div
        className={`flex-1 overflow-auto ${
          selectedRequest ? 'border-r border-border-default' : ''
        }`}
      >
        {/* Column headers */}
        <div className="flex px-4 py-2 border-b border-border-default text-[11px] text-text-disabled font-semibold sticky top-0 bg-bg-base z-[1]">
          <span className="w-[60px]">Method</span>
          <span className="flex-1">URL</span>
          <span className="w-[60px] text-right">Status</span>
          <span className="w-[80px] text-right">Time</span>
        </div>

        {requests.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100%-36px)] text-text-tertiary">
            {connected ? 'No network requests yet.' : 'Waiting for React Native app to connect...'}
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              onClick={() => onSelectRequest(selectedRequest === req.id ? null : req.id)}
              className={`flex px-4 py-[7px] border-b border-border-subtle cursor-pointer items-center transition-colors ${
                selectedRequest === req.id
                  ? 'bg-bg-elevated'
                  : 'bg-transparent hover:bg-bg-surface'
              }`}
            >
              <span
                className="w-[60px] text-[11px] font-bold"
                style={{ color: METHOD_COLORS[req.method] ?? colorValues['text-secondary'] }}
              >
                {req.method}
              </span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
                {truncateUrl(req.url)}
                <span className="ml-2 text-[11px] text-text-disabled">{urlHost(req.url)}</span>
              </span>
              <span
                className="w-[60px] text-right font-semibold"
                style={{
                  color: req.pending ? colorValues['text-disabled'] : statusColor(req.status),
                }}
              >
                {req.pending ? '...' : req.status || 'ERR'}
              </span>
              <span className="w-[80px] text-right text-text-disabled text-xs">
                {formatDuration(req.duration)}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Detail panel */}
      {selected && (
        <NetworkDetailPanel
          request={selected}
          onClose={() => onSelectRequest(null)}
        />
      )}
    </div>
  );
};
