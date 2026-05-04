import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProfilerCommitData } from '@radar/types';
import type { ProfilerCommitRow } from '@radar/database';
import { databaseClient, sendCommand } from '../services';
import type { ComponentStatsEntry, ProfilerView } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

const rowToCommit = (row: ProfilerCommitRow): ProfilerCommitData => ({
  index: row.commit_index,
  timestamp: row.timestamp,
  duration: row.duration,
  components: JSON.parse(row.components) as ProfilerCommitData['components'],
});

export const useProfiler = (selectedDeviceId: string | null) => {
  const [isProfiling, setIsProfiling] = useState(false);
  const isProfilingRef = useRef(false);
  const [selectedCommitIndex, setSelectedCommitIndex] = useState(0);
  const [activeView, setActiveView] = useState<ProfilerView>('flamegraph');

  const queryFn = useCallback(
    async (deviceId: string): Promise<ProfilerCommitRow[]> => {
      const session = await databaseClient.profiler.getLatestSession(deviceId);
      if (!session) return [];
      return databaseClient.profiler.getCommitsBySession(session.id);
    },
    [],
  );

  const { data: commitRows, refetch } = useDatabaseSubscription(
    'radar:db:profiler:changed',
    selectedDeviceId,
    queryFn,
    [] as ProfilerCommitRow[],
  );

  // When new profiler data arrives from DB, stop profiling state
  const prevRowCountRef = useRef(0);
  useEffect(() => {
    if (commitRows.length > 0 && prevRowCountRef.current === 0) {
      setIsProfiling(false);
      isProfilingRef.current = false;
      setSelectedCommitIndex(0);
    }
    prevRowCountRef.current = commitRows.length;
  }, [commitRows.length]);

  const commits = useMemo(() => commitRows.map(rowToCommit), [commitRows]);

  const selectedCommit = useMemo(
    () => commits[selectedCommitIndex] ?? null,
    [commits, selectedCommitIndex],
  );

  const componentStats = useMemo((): ComponentStatsEntry[] => {
    const statsMap = new Map<string, ComponentStatsEntry>();

    for (const commit of commits) {
      const walkComponents = (components: ProfilerCommitData['components']) => {
        for (const c of components) {
          const isDidNotRender = c.phase === 'did-not-render';
          const existing = statsMap.get(c.id);
          if (existing) {
            if (isDidNotRender) {
              existing.didNotRenderCount += 1;
            } else {
              existing.renderCount += 1;
              existing.totalTime += c.actualDuration;
              existing.avgTime = existing.totalTime / existing.renderCount;
              if (c.actualDuration > existing.maxTime)
                existing.maxTime = c.actualDuration;
              if (c.phase === 'mount') existing.mountCount += 1;
              else existing.updateCount += 1;
            }
          } else {
            statsMap.set(c.id, {
              id: c.id,
              name: c.name,
              renderCount: isDidNotRender ? 0 : 1,
              totalTime: isDidNotRender ? 0 : c.actualDuration,
              avgTime: isDidNotRender ? 0 : c.actualDuration,
              maxTime: isDidNotRender ? 0 : c.actualDuration,
              mountCount: c.phase === 'mount' ? 1 : 0,
              updateCount: c.phase === 'update' ? 1 : 0,
              didNotRenderCount: isDidNotRender ? 1 : 0,
            });
          }
          walkComponents(c.children);
        }
      };
      walkComponents(commit.components);
    }

    return Array.from(statsMap.values()).sort(
      (a, b) => b.totalTime - a.totalTime,
    );
  }, [commits]);

  const startProfiling = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.profiler.clear(selectedDeviceId);
    refetch();
    setSelectedCommitIndex(0);
    setIsProfiling(true);
    isProfilingRef.current = true;
    sendCommand(selectedDeviceId, { type: 'startProfiling' });
  }, [selectedDeviceId, refetch]);

  const stopProfiling = useCallback(() => {
    if (!selectedDeviceId) return;
    sendCommand(selectedDeviceId, { type: 'stopProfiling' });
  }, [selectedDeviceId]);

  const reloadAndProfile = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.profiler.clear(selectedDeviceId);
    refetch();
    setSelectedCommitIndex(0);
    setIsProfiling(true);
    isProfilingRef.current = true;
    sendCommand(selectedDeviceId, { type: 'reloadAndProfile' });
  }, [selectedDeviceId, refetch]);

  const handleDeviceConnected = useCallback(
    (deviceId: string) => {
      if (deviceId !== selectedDeviceId) return;
      sendCommand(deviceId, {
        type: 'profilingStatus',
        isProfiling: isProfilingRef.current,
      });
    },
    [selectedDeviceId],
  );

  const clearProfilerData = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.profiler.clear(selectedDeviceId);
    setSelectedCommitIndex(0);
    refetch();
  }, [selectedDeviceId, refetch]);

  return {
    isProfiling,
    commits,
    selectedCommitIndex,
    selectedCommit,
    activeView,
    componentStats,
    setSelectedCommitIndex,
    setActiveView,
    startProfiling,
    stopProfiling,
    reloadAndProfile,
    clearProfilerData,
    handleDeviceConnected,
  };
};
