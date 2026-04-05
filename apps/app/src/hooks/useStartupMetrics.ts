import { useCallback, useState } from 'react';
import type { StartupMetricsMessage } from '@radar/types';
import type { StartupData } from '../types';

type StampedMessage = Record<string, unknown> & {
  type: string;
  deviceId: string;
};

type StampedStartupMessage = StartupMetricsMessage & {
  deviceId: string;
};

export const useStartupMetrics = (selectedDeviceId: string | null) => {
  const [startupMap, setStartupMap] = useState<Map<string, StartupData>>(
    new Map(),
  );

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type !== 'startupMetrics') return;

      const msg = message as StampedStartupMessage;

      setStartupMap(prev => {
        const next = new Map(prev);
        next.set(msg.deviceId, {
          jsBundleEval: msg.jsBundleEval,
          nativeLaunch: msg.nativeLaunch,
          tti: msg.tti,
          deviceId: msg.deviceId,
        });
        return next;
      });
    },
    [],
  );

  const startupData = selectedDeviceId
    ? startupMap.get(selectedDeviceId) ?? null
    : null;

  const clearStartup = useCallback(() => {
    setStartupMap(new Map());
  }, []);

  return { startupData, handleMessage, clearStartup };
};
