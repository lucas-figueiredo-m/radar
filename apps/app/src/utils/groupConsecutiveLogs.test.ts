import { describe, it, expect } from 'vitest';
import { groupConsecutiveLogs } from './groupConsecutiveLogs';
import type { LogEntry, LogLevel } from '../types';

let nextId = 1;

const makeEntry = (
  overrides: Partial<LogEntry> & { level?: LogLevel } = {},
): LogEntry => ({
  id: nextId++,
  level: 'log',
  args: ['hello'],
  timestamp: Date.now(),
  deviceId: 'test-device',
  ...overrides,
});

describe('groupConsecutiveLogs', () => {
  beforeEach(() => {
    nextId = 1;
  });

  it('returns empty array for empty input', () => {
    expect(groupConsecutiveLogs([])).toEqual([]);
  });

  it('returns one group with count 1 for a single entry', () => {
    const entry = makeEntry();
    const result = groupConsecutiveLogs([entry]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
    expect(result[0].entries).toEqual([entry]);
  });

  it('merges consecutive identical entries', () => {
    const e1 = makeEntry({ timestamp: 100 });
    const e2 = makeEntry({ timestamp: 200 });
    const e3 = makeEntry({ timestamp: 300 });
    const result = groupConsecutiveLogs([e1, e2, e3]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    expect(result[0].firstTimestamp).toBe(100);
    expect(result[0].lastTimestamp).toBe(300);
  });

  it('separates different levels', () => {
    const e1 = makeEntry({ level: 'log' });
    const e2 = makeEntry({ level: 'warn' });
    const result = groupConsecutiveLogs([e1, e2]);
    expect(result).toHaveLength(2);
    expect(result[0].level).toBe('log');
    expect(result[1].level).toBe('warn');
  });

  it('separates different args', () => {
    const e1 = makeEntry({ args: ['a'] });
    const e2 = makeEntry({ args: ['b'] });
    const result = groupConsecutiveLogs([e1, e2]);
    expect(result).toHaveLength(2);
  });

  it('does not merge non-adjacent duplicates (A, B, A)', () => {
    const a1 = makeEntry({ args: ['a'] });
    const b = makeEntry({ args: ['b'] });
    const a2 = makeEntry({ args: ['a'] });
    const result = groupConsecutiveLogs([a1, b, a2]);
    expect(result).toHaveLength(3);
  });

  it('groups entries with complex object args', () => {
    const obj = { nested: { key: 'value' } };
    const e1 = makeEntry({ args: [obj] });
    const e2 = makeEntry({ args: [obj] });
    const result = groupConsecutiveLogs([e1, e2]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('separates multi-arg entries when one arg differs', () => {
    const e1 = makeEntry({ args: ['same', 'a'] });
    const e2 = makeEntry({ args: ['same', 'b'] });
    const result = groupConsecutiveLogs([e1, e2]);
    expect(result).toHaveLength(2);
  });

  it('uses "level:serialized_args" format for keys', () => {
    const entry = makeEntry({ level: 'warn', args: ['test', 42] });
    const result = groupConsecutiveLogs([entry]);
    expect(result[0].key).toBe('warn:"test"|42');
  });
});
