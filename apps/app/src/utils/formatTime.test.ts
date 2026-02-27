import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('matches HH:MM:SS.mmm pattern', () => {
    expect(formatTime(Date.now())).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it('pads single-digit milliseconds: 5 → .005', () => {
    const ts = new Date(2024, 0, 1, 12, 0, 0, 5).getTime();
    expect(formatTime(ts)).toMatch(/\.005$/);
  });

  it('formats exact milliseconds: 123 → .123', () => {
    const ts = new Date(2024, 0, 1, 12, 0, 0, 123).getTime();
    expect(formatTime(ts)).toMatch(/\.123$/);
  });

  it('formats zero milliseconds: .000', () => {
    const ts = new Date(2024, 0, 1, 12, 0, 0, 0).getTime();
    expect(formatTime(ts)).toMatch(/\.000$/);
  });

  it('formats max milliseconds: .999', () => {
    const ts = new Date(2024, 0, 1, 12, 0, 0, 999).getTime();
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
