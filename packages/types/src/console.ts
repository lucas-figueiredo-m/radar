import type { LogLevel } from './logLevel';

export type ConsoleMessage = {
  type: 'console';
  level: LogLevel;
  args: unknown[];
  timestamp: number;
};
