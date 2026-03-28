import { useCallback, useMemo, useRef, useState } from 'react';
import type { PerformanceMetricMessage } from '@radar/types';
import type { PerformanceDataPoint } from '../types';
import { MAX_METRICS } from './constants';

type StampedMessage = Record<string, unknown> & {
  type: string;
  deviceId: string;
};

type StampedPerformanceMessage = PerformanceMetricMessage & {
  deviceId: string;
};

export const usePerformanceMetrics = (selectedDeviceId: string | null) => {
  const [metrics, setMetrics] = useState<PerformanceDataPoint[]>([]);
  const totalDroppedFramesRef = useRef(0);
  const totalGcEventsRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const togglePause = useCallback(() => {
    setPaused(prev => {
      pausedRef.current = !prev;
      return !prev;
    });
  }, []);

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type !== 'performanceMetric') return;
      if (pausedRef.current) return;

      const msg = message as StampedPerformanceMessage;

      totalDroppedFramesRef.current += msg.droppedFrames;
      totalGcEventsRef.current += msg.gcEvents;

      setMetrics(prev => {
        const next = [
          ...prev,
          {
            jsFps: msg.jsFps,
            uiFps: msg.uiFps,
            jsHeap: msg.jsHeap,
            nativeRam: msg.nativeRam,
            cpuUsage: msg.cpuUsage,
            droppedFrames: msg.droppedFrames,
            gcEvents: msg.gcEvents,
            timestamp: msg.timestamp,
            deviceId: msg.deviceId,
          },
        ];
        return next.length > MAX_METRICS ? next.slice(-MAX_METRICS) : next;
      });
    },
    [],
  );

  const deviceMetrics = useMemo(
    () =>
      selectedDeviceId
        ? metrics.filter(m => m.deviceId === selectedDeviceId)
        : [],
    [metrics, selectedDeviceId],
  );

  const latestMetric =
    deviceMetrics.length > 0 ? deviceMetrics[deviceMetrics.length - 1] : null;

  const totalDroppedFrames = useMemo(
    () => deviceMetrics.reduce((sum, m) => sum + m.droppedFrames, 0),
    [deviceMetrics],
  );

  const totalGcEvents = useMemo(
    () => deviceMetrics.reduce((sum, m) => sum + m.gcEvents, 0),
    [deviceMetrics],
  );

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    totalDroppedFramesRef.current = 0;
    totalGcEventsRef.current = 0;
  }, []);

  return {
    metrics: deviceMetrics,
    latestMetric,
    totalDroppedFrames,
    totalGcEvents,
    paused,
    togglePause,
    clearMetrics,
    handleMessage,
  };
};
