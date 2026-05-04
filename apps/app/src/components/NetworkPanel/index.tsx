import { useEffect, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { colorValues } from '@radar/design-system';
import { NetworkDetailPanel } from '../NetworkDetailPanel';
import {
  METHOD_COLORS,
  statusColor,
  formatDuration,
  truncateUrl,
  urlHost,
} from '../../utils';
import type { NetworkEntry } from '../../types';

type NetworkPanelProps = {
  requests: NetworkEntry[];
  connected: boolean;
  selectedRequest: string | null;
  onSelectRequest: (id: string | null) => void;
};

const ROW_HEIGHT = 35;

export const NetworkPanel = ({
  requests,
  connected,
  selectedRequest,
  onSelectRequest,
}: NetworkPanelProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const selected = requests.find(r => r.id === selectedRequest);

  const virtualizer = useVirtualizer({
    count: requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShouldAutoScroll(atBottom);
  }, []);

  useEffect(() => {
    if (!selectedRequest && shouldAutoScroll && requests.length > 0) {
      virtualizer.scrollToIndex(requests.length - 1, { align: 'end' });
    }
  }, [requests.length, selectedRequest, shouldAutoScroll, virtualizer]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Request list */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          selectedRequest ? 'border-r border-border-default' : ''
        }`}
      >
        {/* Column headers */}
        <div className="flex px-4 py-2 border-b border-border-default text-detail text-text-disabled font-semibold shrink-0 bg-bg-base z-sticky">
          <span className="w-[108px]">Method</span>
          <span className="flex-1">URL</span>
          <span className="w-[60px] text-right">Status</span>
          <span className="w-[80px] text-right">Time</span>
        </div>

        {requests.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-text-tertiary">
            {connected
              ? 'No network requests yet.'
              : 'Waiting for React Native app to connect...'}
          </div>
        ) : (
          <div
            ref={parentRef}
            className="flex-1 overflow-auto"
            onScroll={handleScroll}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualRow => {
                const req = requests[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      onClick={() =>
                        onSelectRequest(
                          selectedRequest === req.id ? null : req.id,
                        )
                      }
                      className={`flex px-4 py-[7px] border-b border-border-subtle cursor-pointer items-center transition-colors ${
                        selectedRequest === req.id
                          ? 'bg-bg-elevated'
                          : 'bg-transparent hover:bg-bg-surface'
                      }`}
                    >
                      <span className="w-[108px] flex items-center gap-1.5 text-detail font-bold">
                        <span
                          style={{
                            color: req.graphql
                              ? METHOD_COLORS[
                                  req.graphql.operationType.toUpperCase()
                                ] ?? colorValues['text-secondary']
                              : METHOD_COLORS[req.method] ??
                                colorValues['text-secondary'],
                          }}
                        >
                          {req.graphql
                            ? req.graphql.operationType.toUpperCase()
                            : req.method}
                        </span>
                        {req.graphql && (
                          <span
                            className="text-[9px] font-semibold px-1 py-px rounded"
                            style={{
                              color: colorValues['method-mutation'],
                              backgroundColor: `${colorValues['method-mutation']}1A`,
                            }}
                          >
                            GQL
                          </span>
                        )}
                      </span>
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
                        {req.graphql?.operationName
                          ? req.graphql.operationName
                          : truncateUrl(req.url)}
                        <span className="ml-2 text-detail text-text-disabled">
                          {urlHost(req.url)}
                        </span>
                      </span>
                      <span
                        className="w-[60px] text-right font-semibold"
                        style={{
                          color: req.pending
                            ? colorValues['text-disabled']
                            : statusColor(req.status),
                        }}
                      >
                        {req.pending ? '...' : req.status || 'ERR'}
                      </span>
                      <span className="w-[80px] text-right text-text-disabled text-xs">
                        {formatDuration(req.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
