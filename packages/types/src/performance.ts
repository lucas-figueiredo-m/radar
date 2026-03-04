export type PerformanceMetricMessage = {
  type: 'performanceMetric';
  jsFps: number;
  uiFps: number | null;
  ram: number | null;
  droppedFrames: number;
  gcEvents: number;
  timestamp: number;
};
