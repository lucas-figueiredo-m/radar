import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { colorValues } from '@radar/design-system';
import { ValueRenderer } from '../ValueRenderer';
import {
  groupConsecutiveLogs,
  formatArg,
  LEVEL_STYLES,
  formatTime,
} from '../../utils';
import type { LogEntry, LogLevel } from '../../types';
import { CopyButton } from './CopyButton';
import { TimeGapSeparator } from './TimeGapSeparator';
import { TIME_GAP_THRESHOLD_MS } from './constants';

export { TimeGapSeparator } from './TimeGapSeparator';
export type { TimeGapSeparatorProps } from './TimeGapSeparator';
export { TIME_GAP_THRESHOLD_MS } from './constants';

export type ConsolePanelProps = {
  logs: LogEntry[];
  connected: boolean;
  filter: LogLevel | 'all';
  onFilterChange: (level: LogLevel | 'all') => void;
};

const ESTIMATED_ROW_HEIGHT = 32;

export const ConsolePanel = ({
  logs,
  connected,
  filter,
  onFilterChange,
}: ConsolePanelProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const filteredLogs =
    filter === 'all' ? logs : logs.filter(l => l.level === filter);
  const grouped = useMemo(
    () => groupConsecutiveLogs(filteredLogs),
    [filteredLogs],
  );

  // Build flat list of virtual items: each group main row + expanded sub-entries + time gaps
  const virtualItems = useMemo(() => {
    const items: (
      | { type: 'gap'; gapMs: number }
      | { type: 'group'; groupIndex: number }
      | { type: 'entry'; groupIndex: number; entry: LogEntry }
    )[] = [];

    for (let gi = 0; gi < grouped.length; gi++) {
      const group = grouped[gi];
      const prevGroup = grouped[gi - 1];
      const gapMs = prevGroup
        ? group.firstTimestamp - prevGroup.lastTimestamp
        : 0;

      if (gapMs >= TIME_GAP_THRESHOLD_MS) {
        items.push({ type: 'gap', gapMs });
      }

      items.push({ type: 'group', groupIndex: gi });

      if (expandedGroups.has(gi)) {
        for (let ei = 1; ei < group.entries.length; ei++) {
          items.push({
            type: 'entry',
            groupIndex: gi,
            entry: group.entries[ei],
          });
        }
      }
    }

    return items;
  }, [grouped, expandedGroups]);

  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 20,
  });

  const toggleGroup = useCallback((index: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Track if user is near bottom for auto-scroll
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShouldAutoScroll(atBottom);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (shouldAutoScroll && virtualItems.length > 0) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end' });
    }
  }, [virtualItems.length, shouldAutoScroll, virtualizer]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex gap-1 px-4 py-2 border-b border-border-subtle shrink-0">
        {(['all', 'log', 'warn', 'error', 'debug'] as const).map(level => (
          <button
            key={level}
            onClick={() => onFilterChange(level)}
            className={`px-2.5 py-[3px] rounded-md cursor-pointer text-xs uppercase border ${
              filter === level
                ? 'bg-bg-elevated border-border-strong'
                : 'bg-transparent border-transparent hover:bg-bg-surface'
            }`}
            style={{
              color:
                level === 'all'
                  ? colorValues['text-primary']
                  : LEVEL_STYLES[level].color,
            }}
          >
            {level}{' '}
            {level !== 'all' &&
              `(${logs.filter(l => l.level === level).length})`}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            {connected
              ? 'No logs yet. Use console.log() in your app.'
              : 'Waiting for React Native app to connect on port 8347...'}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const item = virtualItems[virtualRow.index];

              if (item.type === 'gap') {
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    ref={virtualizer.measureElement}
                    data-index={virtualRow.index}
                  >
                    <TimeGapSeparator gapMs={item.gapMs} />
                  </div>
                );
              }

              if (item.type === 'entry') {
                const group = grouped[item.groupIndex];
                const s = LEVEL_STYLES[group.level];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    ref={virtualizer.measureElement}
                    data-index={virtualRow.index}
                  >
                    <div
                      className="group flex gap-2.5 px-4 py-1.5 border-b border-border-subtle items-start pl-8 opacity-70"
                      style={{ background: s.bg }}
                    >
                      <span className="text-text-disabled text-detail shrink-0 min-w-[85px] pt-px">
                        {formatTime(item.entry.timestamp)}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {item.entry.args.map((arg, i) => (
                          <Fragment key={i}>
                            {i > 0 && ' '}
                            <ValueRenderer value={arg} inline={true} />
                          </Fragment>
                        ))}
                      </span>
                    </div>
                  </div>
                );
              }

              // type === 'group'
              const group = grouped[item.groupIndex];
              const s = LEVEL_STYLES[group.level];
              const plainText = group.args.map(formatArg).join(' ');
              const isExpanded = expandedGroups.has(item.groupIndex);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                >
                  <div
                    className="group flex gap-2.5 px-4 py-1.5 border-b border-border-subtle items-start"
                    style={{ background: s.bg }}
                  >
                    <span className="text-text-disabled text-detail shrink-0 min-w-[85px] pt-px">
                      {formatTime(group.firstTimestamp)}
                    </span>
                    <span
                      className="text-caption font-semibold px-[5px] py-[2px] rounded-sm shrink-0 min-w-[30px] text-center"
                      style={{
                        color: s.color,
                        background: s.color + '20',
                      }}
                    >
                      {s.label}
                    </span>
                    <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                      {group.args.map((arg, i) => (
                        <Fragment key={i}>
                          {i > 0 && ' '}
                          <ValueRenderer value={arg} inline={true} />
                        </Fragment>
                      ))}
                    </span>
                    {group.count > 1 && (
                      <button
                        onClick={() => toggleGroup(item.groupIndex)}
                        className="shrink-0 text-caption font-bold px-1.5 py-[1px] rounded-full cursor-pointer select-none"
                        style={{
                          background: s.color + '30',
                          color: s.color,
                        }}
                      >
                        {isExpanded ? `–${group.count}` : `x${group.count}`}
                      </button>
                    )}
                    <CopyButton text={plainText} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
