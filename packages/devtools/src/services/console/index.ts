import type { LogLevel, RadarMessage } from '@radar/types';
import { serialize } from './serialize';

type Send = (message: RadarMessage) => void;
type OriginalConsole = Record<LogLevel, (...args: unknown[]) => void>;

export const patchConsole = (send: Send): OriginalConsole => {
  const levels: LogLevel[] = ['log', 'warn', 'error', 'debug'];
  const original = {} as OriginalConsole;

  for (const level of levels) {
    original[level] = console[level].bind(console);

    console[level] = (...args: unknown[]) => {
      original[level](...args);

      send({
        type: 'console',
        level,
        args: args.map(serialize),
        timestamp: Date.now(),
      });
    };
  }

  return original;
};
