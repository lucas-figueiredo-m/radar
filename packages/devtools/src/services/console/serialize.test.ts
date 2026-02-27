import { describe, it, expect } from 'vitest';
import { serialize } from './serialize';

describe('serialize', () => {
  it('returns null for null', () => {
    expect(serialize(null)).toBeNull();
  });

  it('returns undefined for undefined', () => {
    expect(serialize(undefined)).toBeUndefined();
  });

  it('returns strings as-is', () => {
    expect(serialize('hello')).toBe('hello');
  });

  it('returns numbers as-is', () => {
    expect(serialize(42)).toBe(42);
  });

  it('returns booleans as-is', () => {
    expect(serialize(true)).toBe(true);
    expect(serialize(false)).toBe(false);
  });

  it('serializes Error instances with __type, message, and stack', () => {
    const error = new Error('test error');
    const result = serialize(error) as {
      __type: string;
      message: string;
      stack: string | undefined;
    };

    expect(result.__type).toBe('Error');
    expect(result.message).toBe('test error');
    expect(result.stack).toBeDefined();
  });

  it('deep-clones plain objects via JSON round-trip', () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = serialize(obj);

    expect(result).toEqual({ a: 1, b: { c: 2 } });
    expect(result).not.toBe(obj);
  });

  it('deep-clones arrays via JSON round-trip', () => {
    const arr = [1, 'two', { three: 3 }];
    const result = serialize(arr);

    expect(result).toEqual([1, 'two', { three: 3 }]);
    expect(result).not.toBe(arr);
  });

  it('falls back to String() for non-serializable values', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(serialize(circular)).toBe('[object Object]');
  });

  it('falls back to String() for BigInt values', () => {
    expect(serialize(BigInt(123))).toBe('123');
  });

  it('falls back to String() for functions', () => {
    const fn = () => 'hello';
    expect(serialize(fn)).toBe(String(fn));
  });
});
