import { useEffect, useRef } from 'react';
import { colorValues } from '@radar/design-system';

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface LogEntry {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
}

const LEVEL_STYLES: Record<LogLevel, { bg: string; color: string; label: string }> = {
  log:   { bg: colorValues['bg-surface'],      color: colorValues['text-primary'],   label: 'LOG' },
  warn:  { bg: colorValues['status-warning-bg'], color: colorValues['status-warning'], label: 'WRN' },
  error: { bg: colorValues['status-error-bg'],   color: colorValues['status-error'],   label: 'ERR' },
  debug: { bg: colorValues['bg-surface'],      color: colorValues['status-info'],    label: 'DBG' },
};

const formatArg = (arg: unknown): string => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (
    typeof arg === 'object' &&
    arg !== null &&
    '__type' in (arg as Record<string, unknown>) &&
    (arg as Record<string, unknown>).__type === 'Error'
  ) {
    const err = arg as { message: string; stack?: string };
    return `Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
};

interface ConsolePanelProps {
  logs: LogEntry[];
  connected: boolean;
  filter: LogLevel | 'all';
  onFilterChange: (level: LogLevel | 'all') => void;
}

export const ConsolePanel = ({ logs, connected, filter, onFilterChange }: ConsolePanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredLogs.length]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex gap-1 px-4 py-2 border-b border-border-subtle shrink-0">
        {(['all', 'log', 'warn', 'error', 'debug'] as const).map((level) => (
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
            {level} {level !== 'all' && `(${logs.filter((l) => l.level === level).length})`}
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
          filteredLogs.map((entry) => {
            const s = LEVEL_STYLES[entry.level];
            return (
              <div
                key={entry.id}
                className="flex gap-2.5 px-4 py-1.5 border-b border-border-subtle items-start"
                style={{ background: s.bg }}
              >
                <span className="text-text-disabled text-[11px] shrink-0 min-w-[85px] pt-px">
                  {formatTime(entry.timestamp)}
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
                <span
                  className="whitespace-pre-wrap break-all flex-1 font-mono"
                  style={{ color: s.color }}
                >
                  {entry.args.map(formatArg).join(' ')}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </>
  );
};

export type { LogEntry, LogLevel };
