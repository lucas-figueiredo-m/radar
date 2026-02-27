export type LogLevel = 'log' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
}

export interface GroupedLogEntry {
  key: string;
  entries: LogEntry[];
  level: LogLevel;
  args: unknown[];
  firstTimestamp: number;
  lastTimestamp: number;
  count: number;
}
