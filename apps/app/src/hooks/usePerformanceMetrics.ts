import { useCallback, useMemo, useState, useRef } from 'react';
import type { PerformanceMetricRow } from '@radar/database';
import { databaseClient } from '../services';
import type { PerformanceDataPoint } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

const rowToDataPoint = (row: PerformanceMetricRow): PerformanceDataPoint => ({
  jsFps: row.js_fps,
  uiFps: row.ui_fps,
  jsHeap: row.js_heap,
  nativeRam: row.native_ram,
  cpuUsage: row.cpu_usage,
  droppedFrames: row.dropped_frames,
  gcEvents: row.gc_events,
  timestamp: row.timestamp,
  deviceId: row.device_id,
});

export const usePerformanceMetrics = (selectedDeviceId: string | null) => {
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const togglePause = useCallback(() => {
    setPaused(prev => {
      pausedRef.current = !prev;
      return !prev;
    });
  }, []);

  const queryFn = useCallback(
    (deviceId: string) =>
      databaseClient.performance.query({ device_id: deviceId }),
    [],
  );

  const { data: rows, refetch } = useDatabaseSubscription(
    'radar:db:performance:changed',
    selectedDeviceId,
    queryFn,
    [] as PerformanceMetricRow[],
  );

  const metrics = useMemo(() => rows.map(rowToDataPoint), [rows]);

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const totalDroppedFrames = useMemo(
    () => metrics.reduce((sum, m) => sum + m.droppedFrames, 0),
    [metrics],
  );

  const totalGcEvents = useMemo(
    () => metrics.reduce((sum, m) => sum + m.gcEvents, 0),
    [metrics],
  );

  const clearMetrics = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.performance.clear(selectedDeviceId);
    refetch();
  }, [selectedDeviceId, refetch]);

  return {
    metrics,
    latestMetric,
    totalDroppedFrames,
    totalGcEvents,
    paused,
    togglePause,
    clearMetrics,
  };
};
