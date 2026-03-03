import type { LogLevel, RadarMessage } from '@radar/types';
import { serialize } from './serialize';

type Send = (message: RadarMessage) => void;
type OriginalConsole = Record<LogLevel, (...args: unknown[]) => void>;

const ORIGINAL_KEY = '__radar_original_console__';
const g = globalThis as Record<string, unknown>;

export const patchConsole = (send: Send): OriginalConsole => {
  const levels: LogLevel[] = ['log', 'warn', 'error', 'debug'];

  // If already patched (e.g. HMR reload), restore the true originals first
  // to prevent stacking multiple intercept layers.
  const prev = g[ORIGINAL_KEY] as OriginalConsole | undefined;
  if (prev) {
    for (const level of levels) {
      console[level] = prev[level];
    }
  }

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

  g[ORIGINAL_KEY] = original;

  return original;
};
