export type PerformanceDataPoint = {
  jsFps: number;
  uiFps: number | null;
  ram: number | null;
  droppedFrames: number;
  gcEvents: number;
  timestamp: number;
  deviceId: string;
};

export type MetricThresholds = {
  good: number;
  moderate: number;
  bad: number;
};
