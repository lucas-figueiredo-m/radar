import type { RadarMessage } from '@radar/types';
import { createJsFpsSampler } from './measureJsFps';
import { measureJsHeap } from './measureJsHeap';
import { getNativeMetrics } from './getNativeMetrics';

export const createPerformanceService = (
  send: (message: RadarMessage) => void,
) => {
  const sampler = createJsFpsSampler();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let lastTotalGCs: number | null = null;

  const tick = () => {
    const jsFps = sampler.sample();
    const droppedFrames = sampler.getDroppedFrames();
    const { bytes: jsHeap, totalGCs } = measureJsHeap();
    const { uiFps, nativeRam, cpuUsage } = getNativeMetrics();

    let gcEvents = 0;
    if (totalGCs !== null && lastTotalGCs !== null) {
      gcEvents = totalGCs - lastTotalGCs;
    }
    lastTotalGCs = totalGCs;

    send({
      type: 'performanceMetric',
      jsFps,
      uiFps,
      jsHeap,
      nativeRam,
      cpuUsage,
      droppedFrames,
      gcEvents,
      timestamp: Date.now(),
    });
  };

  return {
    start: () => {
      sampler.start();
      intervalId = setInterval(tick, 500);
    },
    stop: () => {
      sampler.stop();
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
};
