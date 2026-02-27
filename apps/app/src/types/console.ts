export type LogLevel = 'log' | 'warn' | 'error' | 'debug';

export type LogEntry = {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
};

export type GroupedLogEntry = {
  key: string;
  entries: LogEntry[];
  level: LogLevel;
  args: unknown[];
  firstTimestamp: number;
  lastTimestamp: number;
  count: number;
};
