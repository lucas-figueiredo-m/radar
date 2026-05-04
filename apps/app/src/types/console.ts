export type { LogLevel } from '@radar/types';

import type { LogLevel } from '@radar/types';

export type LogEntry = {
  id: number;
  level: LogLevel;
  args: unknown[];
  timestamp: number;
  deviceId: string;
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
