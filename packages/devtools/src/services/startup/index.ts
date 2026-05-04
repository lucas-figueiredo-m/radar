import type { RadarMessage } from '@radar/types';
import { getNativeLaunchTime } from './getNativeLaunchTime';

// Captured at module evaluation time (when the bundle is parsed/executed)
const moduleLoadMs = Date.now();

export const createStartupService = (send: (message: RadarMessage) => void) => {
  const initMs = Date.now();
  const processUptimeMs = getNativeLaunchTime();

  // JS Bundle Eval = time spent evaluating JS modules before init() is called
  const jsBundleEval = initMs - moduleLoadMs;

  // Native Launch = time from process creation to JS context creation
  // processUptimeMs = total ms since process start (from native sysctl)
  // performance.now() = ms since JS context was created
  // So: nativeLaunch = processUptime - jsBundleTime - performanceNow
  // Simplified: processUptime at init time - performance.now() at init time
  // This gives the gap before JS even started
  const nativeLaunch =
    processUptimeMs !== null
      ? Math.max(0, processUptimeMs - performance.now())
      : null;

  let sent = false;

  const markInteractive = () => {
    if (sent) return;
    sent = true;

    // TTI = time from module load to interactive
    const tti = Date.now() - moduleLoadMs;

    send({
      type: 'startupMetrics',
      jsBundleEval,
      nativeLaunch,
      tti,
      timestamp: Date.now(),
    });
  };

  const sendWithoutTti = () => {
    if (sent) return;
    sent = true;

    send({
      type: 'startupMetrics',
      jsBundleEval,
      nativeLaunch,
      tti: null,
      timestamp: Date.now(),
    });
  };

  return { markInteractive, sendWithoutTti };
};
