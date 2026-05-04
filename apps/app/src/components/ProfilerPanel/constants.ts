export const DURATION_THRESHOLDS = {
  FAST: 1,
  MODERATE: 5,
  SLOW: 16,
} as const;

export const DURATION_COLORS = {
  FAST: '#4ade80',
  MODERATE: '#facc15',
  SLOW: '#fb923c',
  VERY_SLOW: '#f87171',
} as const;

export const FLAMEGRAPH_ROW_HEIGHT = 20;
export const FLAMEGRAPH_ROW_GAP = 1;
export const FLAMEGRAPH_PADDING = 8;
export const FLAMEGRAPH_MIN_WIDTH = 2;
export const TIMELINE_BAR_WIDTH = 8;
export const TIMELINE_BAR_GAP = 2;
export const TIMELINE_HEIGHT = 80;
export const DID_NOT_RENDER_COLOR = '#6b7280';
export const ZOOM_ANIMATION_DURATION = 200;
