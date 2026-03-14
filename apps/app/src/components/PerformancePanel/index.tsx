import type { PerformanceDataPoint } from '../../types';
import { MetricChart } from './MetricChart';
import { DroppedFramesTimeline } from './DroppedFramesTimeline';
import { MemoryTrend } from './MemoryTrend';
import { StartupBreakdown } from './StartupBreakdown';
import { JS_HEAP_THRESHOLDS_MB, NATIVE_RAM_THRESHOLDS_MB } from './constants';

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
  JS_HEAP_THRESHOLDS_MB,
  NATIVE_RAM_THRESHOLDS_MB,
  CPU_THRESHOLDS,
  CHART_PADDING,
  CHART_COLORS,
} from './constants';

export type PerformancePanelProps = {
  metrics: PerformanceDataPoint[];
  totalDroppedFrames: number;
  totalGcEvents: number;
  connected: boolean;
};

export const PerformancePanel = ({
  metrics,
  totalDroppedFrames,
  totalGcEvents,
  connected,
}: PerformancePanelProps) => {
  const jsFpsValues = metrics.map(m => m.jsFps);
  const uiFpsValues = metrics.map(m => m.uiFps);
  const jsHeapValues = metrics.map(m => m.jsHeap);
  const nativeRamValues = metrics.map(m => m.nativeRam);
  const cpuValues = metrics.map(m => m.cpuUsage);
  const droppedFramesCounts = metrics.map(m => m.droppedFrames);
  const gcEventCounts = metrics.map(m => m.gcEvents);

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
      {/* Top row: JS FPS, UI FPS, JS Heap */}
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
          values={jsHeapValues}
          maxValue={JS_HEAP_THRESHOLDS_MB.bad * 1024 * 1024}
          minValue={0}
          title="JS Heap"
          unit="MB"
          invertColors
        />
      </div>

      {/* Second row: Native RAM, CPU */}
      <div className="grid grid-cols-2 gap-4">
        <MetricChart
          values={nativeRamValues}
          maxValue={NATIVE_RAM_THRESHOLDS_MB.bad * 1024 * 1024}
          minValue={0}
          title="Native RAM"
          unit="MB"
          invertColors
        />
        <MetricChart
          values={cpuValues}
          maxValue={100}
          minValue={0}
          title="CPU"
          unit="%"
          invertColors
        />
      </div>

      {/* Dropped Frames Timeline */}
      <DroppedFramesTimeline
        droppedFramesCounts={droppedFramesCounts}
        totalDroppedFrames={totalDroppedFrames}
      />

      {/* JS Heap Trend with GC Markers */}
      <MemoryTrend
        jsHeapValues={jsHeapValues}
        gcEventCounts={gcEventCounts}
        totalGcEvents={totalGcEvents}
      />

      {/* Startup Breakdown */}
      <StartupBreakdown />
    </div>
  );
};
