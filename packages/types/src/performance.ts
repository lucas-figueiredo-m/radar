export type PerformanceMetricMessage = {
  type: 'performanceMetric';
  jsFps: number;
  uiFps: number | null;
  jsHeap: number | null;
  nativeRam: number | null;
  cpuUsage: number | null;
  droppedFrames: number;
  gcEvents: number;
  timestamp: number;
};
