import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime } from './formatTime';

// Pin toLocaleTimeString to UTC so tests pass in any timezone
beforeEach(() => {
  const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
  vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(function (
    this: Date,
    ...args: Parameters<Date['toLocaleTimeString']>
  ) {
    const [locale, options] = args;
    return originalToLocaleTimeString.call(this, locale, {
      ...options,
      timeZone: 'UTC',
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formatTime', () => {
  it('matches HH:MM:SS.mmm pattern', () => {
    expect(formatTime(Date.now())).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it('formats hours, minutes, seconds correctly in UTC', () => {
    // 2024-01-01T14:30:45.000Z
    const ts = Date.UTC(2024, 0, 1, 14, 30, 45, 0);
    expect(formatTime(ts)).toBe('14:30:45.000');
  });

  it('pads single-digit milliseconds: 5 → .005', () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0, 5);
    expect(formatTime(ts)).toMatch(/\.005$/);
  });

  it('formats exact milliseconds: 123 → .123', () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0, 123);
    expect(formatTime(ts)).toMatch(/\.123$/);
  });

  it('formats zero milliseconds: .000', () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0, 0);
    expect(formatTime(ts)).toMatch(/\.000$/);
  });

  it('formats max milliseconds: .999', () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0, 999);
    expect(formatTime(ts)).toMatch(/\.999$/);
  });

  it('is deterministic (same input → same output)', () => {
    const ts = 1706745600000;
    expect(formatTime(ts)).toBe(formatTime(ts));
  });

  it('uses 24-hour format (no AM/PM)', () => {
    const result = formatTime(Date.now());
    expect(result).not.toMatch(/AM|PM/i);
  });
});
