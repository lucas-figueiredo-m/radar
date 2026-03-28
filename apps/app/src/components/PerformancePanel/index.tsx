import type { PerformanceDataPoint, StartupData } from '../../types';
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
  startupData: StartupData | null;
  paused: boolean;
  onTogglePause: () => void;
};

export const PerformancePanel = ({
  metrics,
  totalDroppedFrames,
  totalGcEvents,
  connected,
  startupData,
  paused,
  onTogglePause,
}: PerformancePanelProps) => {
  const jsFpsValues = metrics.map(m => m.jsFps);
  const uiFpsValues = metrics.map(m => m.uiFps);
  const jsHeapValues = metrics.map(m => m.jsHeap);
  const nativeRamValues = metrics.map(m => m.nativeRam);
  const cpuValues = metrics.map(m => m.cpuUsage);
  const timestamps = metrics.map(m => m.timestamp);
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
      {/* Pause/Resume toggle */}
      <div className="flex items-center justify-end">
        <button
          onClick={onTogglePause}
          className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
            paused
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
          }`}
        >
          {paused ? 'Paused — Resume' : 'Pause'}
        </button>
      </div>

      {/* Top row: JS FPS, UI FPS, JS Heap */}
      <div className="grid grid-cols-3 gap-4">
        <MetricChart
          values={jsFpsValues}
          timestamps={timestamps}
          maxValue={65}
          minValue={0}
          title="JS FPS"
          unit="fps"
        />
        <MetricChart
          values={uiFpsValues}
          timestamps={timestamps}
          maxValue={65}
          minValue={0}
          title="UI FPS"
          unit="fps"
        />
        <MetricChart
          values={jsHeapValues}
          timestamps={timestamps}
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
          timestamps={timestamps}
          maxValue={Math.max(
            NATIVE_RAM_THRESHOLDS_MB.good * 1024 * 1024,
            ...nativeRamValues.map(v => (v ?? 0) * 1.3),
          )}
          minValue={0}
          title="Native RAM"
          unit="MB"
          invertColors
          aspectRatio="2 / 1"
        />
        <MetricChart
          values={cpuValues}
          timestamps={timestamps}
          maxValue={Math.max(100, ...cpuValues.map(v => (v ?? 0) * 1.2))}
          minValue={0}
          title="CPU"
          unit="%"
          invertColors
          aspectRatio="2 / 1"
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
      <StartupBreakdown startupData={startupData} connected={connected} />
    </div>
  );
};
