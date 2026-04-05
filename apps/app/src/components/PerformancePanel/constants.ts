export const MAX_DATA_POINTS = 120;

export const FPS_THRESHOLDS = { good: 55, moderate: 40, bad: 25 };
export const JS_HEAP_THRESHOLDS_MB = { good: 150, moderate: 300, bad: 500 };
export const NATIVE_RAM_THRESHOLDS_MB = { good: 300, moderate: 600, bad: 1000 };
export const CPU_THRESHOLDS = { good: 30, moderate: 60, bad: 85 };

export const CHART_PADDING = { top: 30, right: 12, bottom: 12, left: 12 };

export const CHART_COLORS = {
  background: '#111827',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  text: 'rgba(255, 255, 255, 0.5)',
  titleText: 'rgba(255, 255, 255, 0.7)',
};
