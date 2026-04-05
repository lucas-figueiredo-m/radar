import { useCallback, useMemo, useState } from 'react';
import type { ConsoleLogRow } from '@radar/database';
import { databaseClient } from '../services';
import type { LogEntry, LogLevel } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

const rowToLogEntry = (row: ConsoleLogRow): LogEntry => ({
  id: row.id,
  level: row.level,
  args: JSON.parse(row.args) as unknown[],
  timestamp: row.timestamp,
  deviceId: row.device_id,
});

export const useConsoleLogs = (selectedDeviceId: string | null) => {
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');

  const queryFn = useCallback(
    (deviceId: string) => databaseClient.console.query({ device_id: deviceId }),
    [],
  );

  const { data: rows, refetch } = useDatabaseSubscription(
    'radar:db:console:changed',
    selectedDeviceId,
    queryFn,
    [] as ConsoleLogRow[],
  );

  const logs = useMemo(() => rows.map(rowToLogEntry), [rows]);

  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter(l => l.level === filter)),
    [logs, filter],
  );

  const clearLogs = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.console.clear(selectedDeviceId);
    refetch();
  }, [selectedDeviceId, refetch]);

  return {
    logs,
    filteredLogs,
    filter,
    setFilter,
    clearLogs,
  };
};
