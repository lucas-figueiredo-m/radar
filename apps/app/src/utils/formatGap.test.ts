import { describe, it, expect } from 'vitest';
import { formatGap } from './formatGap';

describe('formatGap', () => {
  it('returns ms suffix when under 1000', () => {
    expect(formatGap(0)).toBe('0ms');
    expect(formatGap(1)).toBe('1ms');
    expect(formatGap(500)).toBe('500ms');
    expect(formatGap(850)).toBe('850ms');
    expect(formatGap(999)).toBe('999ms');
  });

  it('returns seconds with 1 decimal when >= 1000 and < 60000', () => {
    expect(formatGap(1000)).toBe('1.0s');
    expect(formatGap(2300)).toBe('2.3s');
    expect(formatGap(1500)).toBe('1.5s');
    expect(formatGap(12345)).toBe('12.3s');
    expect(formatGap(59999)).toBe('60.0s');
  });

  it('returns minutes with 1 decimal when >= 60000', () => {
    expect(formatGap(60000)).toBe('1.0m');
    expect(formatGap(90000)).toBe('1.5m');
    expect(formatGap(150000)).toBe('2.5m');
  });

  it('boundary: 999 → ms, 1000 → seconds', () => {
    expect(formatGap(999)).toBe('999ms');
    expect(formatGap(1000)).toBe('1.0s');
  });

  it('boundary: 59999 → seconds, 60000 → minutes', () => {
    expect(formatGap(59999)).toBe('60.0s');
    expect(formatGap(60000)).toBe('1.0m');
  });
});
