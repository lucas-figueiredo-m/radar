import type { PerformanceDataPoint } from '../../types';
import { MetricChart } from './MetricChart';
import { DroppedFramesTimeline } from './DroppedFramesTimeline';
import { MemoryTrend } from './MemoryTrend';
import { StartupBreakdown } from './StartupBreakdown';
import { RAM_THRESHOLDS_MB } from './constants';

export { MetricChart } from './MetricChart';
export type { MetricChartProps } from './MetricChart';
export { DroppedFramesTimeline } from './DroppedFramesTimeline';
export type { DroppedFramesTimelineProps } from './DroppedFramesTimeline';
export { MemoryTrend } from './MemoryTrend';
export type { MemoryTrendProps } from './MemoryTrend';
export { StartupBreakdown } from './StartupBreakdown';
export { renderMetricChart } from './MetricChartCanvas';
export {
  MAX_DATA_POINTS,
  FPS_THRESHOLDS,
  RAM_THRESHOLDS_MB,
  CHART_PADDING,
  CHART_COLORS,
} from './constants';

export type PerformancePanelProps = {
  metrics: PerformanceDataPoint[];
  latestMetric: PerformanceDataPoint | null;
  totalDroppedFrames: number;
  totalGcEvents: number;
  connected: boolean;
};

export const PerformancePanel = ({
  metrics,
  latestMetric: _latestMetric,
  totalDroppedFrames,
  totalGcEvents,
  connected,
}: PerformancePanelProps) => {
  const jsFpsValues = metrics.map((m) => m.jsFps);
  const uiFpsValues = metrics.map((m) => m.uiFps);
  const ramValues = metrics.map((m) => m.ram);
  const droppedFramesCounts = metrics.map((m) => m.droppedFrames);
  const gcEventCounts = metrics.map((m) => m.gcEvents);

  if (metrics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        {connected
          ? 'Waiting for performance data...'
          : 'Connect a device to see performance metrics'}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Top row: 3 metric charts */}
      <div className="grid grid-cols-3 gap-4">
        <MetricChart
          values={jsFpsValues}
          maxValue={65}
          minValue={0}
          title="JS FPS"
          unit="fps"
        />
        <MetricChart
          values={uiFpsValues}
          maxValue={65}
          minValue={0}
          title="UI FPS"
          unit="fps"
        />
        <MetricChart
          values={ramValues}
          maxValue={RAM_THRESHOLDS_MB.bad * 1024 * 1024}
          minValue={0}
          title="RAM"
          unit="MB"
          invertColors
        />
      </div>

      {/* Dropped Frames Timeline */}
      <DroppedFramesTimeline
        droppedFramesCounts={droppedFramesCounts}
        totalDroppedFrames={totalDroppedFrames}
      />

      {/* Memory Trend with GC Markers */}
      <MemoryTrend
        ramValues={ramValues}
        gcEventCounts={gcEventCounts}
        totalGcEvents={totalGcEvents}
      />

      {/* Startup Breakdown */}
      <StartupBreakdown />
    </div>
  );
};
