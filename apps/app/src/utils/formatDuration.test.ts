import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('returns "..." when undefined', () => {
    expect(formatDuration(undefined)).toBe('...');
  });

  it('returns ms suffix when under 1000', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(1)).toBe('1ms');
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('returns seconds with 2 decimals when >= 1000', () => {
    expect(formatDuration(1000)).toBe('1.00s');
    expect(formatDuration(1500)).toBe('1.50s');
    expect(formatDuration(12345)).toBe('12.35s');
    expect(formatDuration(60000)).toBe('60.00s');
  });

  it('boundary: 999 → ms, 1000 → seconds', () => {
    expect(formatDuration(999)).toBe('999ms');
    expect(formatDuration(1000)).toBe('1.00s');
  });
});
