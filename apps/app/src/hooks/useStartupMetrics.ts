import { useCallback } from 'react';
import type { StartupMetricRow } from '@radar/database';
import { databaseClient } from '../services';
import type { StartupData } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

const rowToStartup = (row: StartupMetricRow): StartupData => ({
  jsBundleEval: row.js_bundle_eval,
  nativeLaunch: row.native_launch,
  tti: row.tti,
  deviceId: row.device_id,
});

export const useStartupMetrics = (selectedDeviceId: string | null) => {
  const queryFn = useCallback(
    async (deviceId: string): Promise<StartupData | null> => {
      const row = await databaseClient.startup.get(deviceId);
      return row ? rowToStartup(row) : null;
    },
    [],
  );

  const { data: startupData, refetch } = useDatabaseSubscription(
    'radar:db:startup:changed',
    selectedDeviceId,
    queryFn,
    null as StartupData | null,
  );

  const clearStartup = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.startup.clear(selectedDeviceId);
    refetch();
  }, [selectedDeviceId, refetch]);

  return { startupData, clearStartup };
};
