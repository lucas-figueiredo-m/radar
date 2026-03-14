import { describe, it, expect, beforeEach } from 'vitest';
import { measureJsHeap } from './measureJsHeap';

describe('measureJsHeap', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).HermesInternal;
  });

  it('reads from HermesInternal when available', () => {
    (globalThis as Record<string, unknown>).HermesInternal = {
      getInstrumentedStats: () => ({
        js_allocatedBytes: 5242880,
        js_numGCs: 3,
      }),
    };

    const result = measureJsHeap();
    expect(result).toEqual({ bytes: 5242880, totalGCs: 3 });
  });

  it('reads from performance.memory when Hermes is unavailable', () => {
    Object.defineProperty(performance, 'memory', {
      value: { usedJSHeapSize: 10485760 },
      configurable: true,
    });

    const result = measureJsHeap();
    expect(result).toEqual({ bytes: 10485760, totalGCs: null });

    Object.defineProperty(performance, 'memory', {
      value: undefined,
      configurable: true,
    });
  });

  it('returns nulls when no API is available', () => {
    const result = measureJsHeap();
    expect(result).toEqual({ bytes: null, totalGCs: null });
  });
});
