export type StartupMetricsMessage = {
  type: 'startupMetrics';
  jsBundleEval: number;
  nativeLaunch: number | null;
  tti: number | null;
  timestamp: number;
};
