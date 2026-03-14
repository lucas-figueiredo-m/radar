import { describe, it, expect } from 'vitest';
import { getNativeMetrics } from './getNativeMetrics';

describe('getNativeMetrics', () => {
  it('returns all nulls when native module is not available', () => {
    // In test environment, react-native is not available
    // so getNativeMetrics should gracefully return nulls
    const result = getNativeMetrics();
    expect(result).toEqual({
      uiFps: null,
      nativeRam: null,
      cpuUsage: null,
    });
  });

  it('caches the result and returns consistent values', () => {
    const result1 = getNativeMetrics();
    const result2 = getNativeMetrics();
    expect(result1).toEqual(result2);
  });

  it('returns the correct shape', () => {
    const result = getNativeMetrics();
    expect(result).toHaveProperty('uiFps');
    expect(result).toHaveProperty('nativeRam');
    expect(result).toHaveProperty('cpuUsage');
  });
});
