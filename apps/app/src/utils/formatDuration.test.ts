import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('returns "..." when undefined', () => {
    expect(formatDuration(undefined)).toBe('...');
  });

  it('returns ms suffix with 3 decimals when under 1000', () => {
    expect(formatDuration(0)).toBe('0.000ms');
    expect(formatDuration(1)).toBe('1.000ms');
    expect(formatDuration(500)).toBe('500.000ms');
    expect(formatDuration(999)).toBe('999.000ms');
    expect(formatDuration(0.234)).toBe('0.234ms');
    expect(formatDuration(1.5)).toBe('1.500ms');
  });

  it('returns seconds with 3 decimals when >= 1000', () => {
    expect(formatDuration(1000)).toBe('1.000s');
    expect(formatDuration(1500)).toBe('1.500s');
    expect(formatDuration(12345)).toBe('12.345s');
    expect(formatDuration(60000)).toBe('60.000s');
  });

  it('boundary: 999 → ms, 1000 → seconds', () => {
    expect(formatDuration(999)).toBe('999.000ms');
    expect(formatDuration(1000)).toBe('1.000s');
  });
});
