import { colorValues } from '@radar/design-system';
import type { LogLevel } from '../types';

export const LEVEL_STYLES: Record<LogLevel, { bg: string; color: string; label: string }> = {
  log:   { bg: colorValues['bg-surface'],        color: colorValues['text-primary'],   label: 'LOG' },
  warn:  { bg: colorValues['status-warning-bg'], color: colorValues['status-warning'], label: 'WRN' },
  error: { bg: colorValues['status-error-bg'],   color: colorValues['status-error'],   label: 'ERR' },
  debug: { bg: colorValues['bg-surface'],        color: colorValues['status-info'],    label: 'DBG' },
};
