import { useCallback, useMemo, useRef, useState } from 'react';
import type { ConsoleMessage } from '@radar/types';
import type { LogEntry, LogLevel } from '../types';
import { MAX_LOGS } from './constants';

type StampedMessage = Record<string, unknown> & { type: string; deviceId: string };
type StampedConsoleMessage = ConsoleMessage & { deviceId: string };

export const useConsoleLogs = (selectedDeviceId: string | null) => {
  const nextLogIdRef = useRef(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type !== 'console') return;

      const msg = message as StampedConsoleMessage;
      setLogs(prev => {
        const next = [
          ...prev,
          {
            id: nextLogIdRef.current++,
            level: msg.level,
            args: msg.args,
            timestamp: msg.timestamp,
            deviceId: msg.deviceId,
          },
        ];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    },
    [],
  );

  const deviceLogs = useMemo(
    () =>
      selectedDeviceId ? logs.filter(l => l.deviceId === selectedDeviceId) : [],
    [logs, selectedDeviceId],
  );

  const filteredLogs = useMemo(
    () =>
      filter === 'all'
        ? deviceLogs
        : deviceLogs.filter(l => l.level === filter),
    [deviceLogs, filter],
  );

  const clearLogs = useCallback(() => {
    if (!selectedDeviceId) return;
    setLogs(prev => prev.filter(l => l.deviceId !== selectedDeviceId));
  }, [selectedDeviceId]);

  return {
    logs: deviceLogs,
    filteredLogs,
    filter,
    setFilter,
    clearLogs,
    handleMessage,
  };
};
