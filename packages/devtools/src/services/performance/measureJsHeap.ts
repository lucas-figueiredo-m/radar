type HermesInstrumentedStats = {
  js_allocatedBytes?: number;
  js_heapSize?: number;
  js_numGCs?: number;
  [key: string]: number | undefined;
};

type HermesInternal = {
  getInstrumentedStats?: () => HermesInstrumentedStats;
};

type PerformanceWithMemory = Performance & {
  memory?: { usedJSHeapSize: number };
};

export type JsHeapSnapshot = {
  bytes: number | null;
  totalGCs: number | null;
};

export const measureJsHeap = (): JsHeapSnapshot => {
  const hermes = (globalThis as { HermesInternal?: HermesInternal })
    .HermesInternal;
  if (hermes?.getInstrumentedStats) {
    const stats = hermes.getInstrumentedStats();
    return {
      bytes: stats.js_allocatedBytes ?? null,
      totalGCs: stats.js_numGCs ?? null,
    };
  }

  const perf = performance as PerformanceWithMemory;
  if (perf.memory?.usedJSHeapSize) {
    return { bytes: perf.memory.usedJSHeapSize, totalGCs: null };
  }

  return { bytes: null, totalGCs: null };
};
