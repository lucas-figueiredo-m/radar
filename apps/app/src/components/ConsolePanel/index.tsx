import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { colorValues } from '@radar/design-system';
import { ValueRenderer } from '..';
import {
  groupConsecutiveLogs,
  formatArg,
  LEVEL_STYLES,
  formatTime,
} from '../../utils';
import type { LogEntry, LogLevel } from '../../types';
import { CopyButton } from './CopyButton';

export { CopyButton } from './CopyButton';
export type { CopyButtonProps } from './CopyButton';

export type ConsolePanelProps = {
  logs: LogEntry[];
  connected: boolean;
  filter: LogLevel | 'all';
  onFilterChange: (level: LogLevel | 'all') => void;
};

export const ConsolePanel = ({
  logs,
  connected,
  filter,
  onFilterChange,
}: ConsolePanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const filteredLogs =
    filter === 'all' ? logs : logs.filter(l => l.level === filter);
  const grouped = useMemo(
    () => groupConsecutiveLogs(filteredLogs),
    [filteredLogs],
  );

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredLogs.length]);

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
      <div className="flex-1 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            {connected
              ? 'No logs yet. Use console.log() in your app.'
              : 'Waiting for React Native app to connect on port 8347...'}
          </div>
        ) : (
          grouped.map((group, groupIndex) => {
            const s = LEVEL_STYLES[group.level];
            const plainText = group.args.map(formatArg).join(' ');
            const isExpanded = expandedGroups.has(groupIndex);

            return (
              <div key={group.entries[0].id}>
                {/* Main row */}
                <div
                  className="group flex gap-2.5 px-4 py-1.5 border-b border-border-subtle items-start"
                  style={{ background: s.bg }}
                >
                  <span className="text-text-disabled text-[11px] shrink-0 min-w-[85px] pt-px">
                    {formatTime(group.firstTimestamp)}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-[5px] py-[2px] rounded-sm shrink-0 min-w-[30px] text-center"
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
                      onClick={() => toggleGroup(groupIndex)}
                      className="shrink-0 text-[10px] font-bold px-1.5 py-[1px] rounded-full cursor-pointer select-none"
                      style={{
                        background: s.color + '30',
                        color: s.color,
                      }}
                    >
                      x{group.count}
                    </button>
                  )}
                  <CopyButton text={plainText} />
                </div>

                {/* Expanded individual entries */}
                {isExpanded &&
                  group.entries.slice(1).map(entry => (
                    <div
                      key={entry.id}
                      className="group flex gap-2.5 px-4 py-1.5 border-b border-border-subtle items-start pl-8 opacity-70"
                      style={{ background: s.bg }}
                    >
                      <span className="text-text-disabled text-[11px] shrink-0 min-w-[85px] pt-px">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {entry.args.map((arg, i) => (
                          <Fragment key={i}>
                            {i > 0 && ' '}
                            <ValueRenderer value={arg} inline={true} />
                          </Fragment>
                        ))}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </>
  );
};
