export const createJsFpsSampler = () => {
  const timestamps: number[] = [];
  let rafId: number | null = null;
  let droppedFrames = 0;
  const FRAME_BUDGET = 1000 / 60; // ~16.67ms

  const tick = (now: number) => {
    if (timestamps.length > 0) {
      const gap = now - timestamps[timestamps.length - 1];
      if (gap > FRAME_BUDGET * 1.5) {
        droppedFrames += Math.floor(gap / FRAME_BUDGET) - 1;
      }
    }
    timestamps.push(now);
    // Keep only last 1s of timestamps
    const cutoff = now - 1000;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
    rafId = requestAnimationFrame(tick);
  };

  return {
    start: () => {
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
    sample: () => {
      if (timestamps.length < 2) return 0;
      const duration =
        (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
      return duration > 0 ? Math.round((timestamps.length - 1) / duration) : 0;
    },
    getDroppedFrames: () => {
      const count = droppedFrames;
      droppedFrames = 0;
      return count;
    },
  };
};
