import { useCallback, useMemo, useRef, useState } from 'react';
import type { ProfilerCommitData, ProfilerSessionMessage } from '@radar/types';
import type { ComponentStatsEntry, ProfilerView } from '../types';
import { sendCommand } from '../services';

type StampedMessage = Record<string, unknown> & {
  type: string;
  deviceId: string;
};

export const useProfiler = (selectedDeviceId: string | null) => {
  const [isProfiling, setIsProfiling] = useState(false);
  const isProfilingRef = useRef(false);
  const [sessions, setSessions] = useState<Map<string, ProfilerCommitData[]>>(
    new Map(),
  );
  const [selectedCommitIndex, setSelectedCommitIndex] = useState(0);
  const [activeView, setActiveView] = useState<ProfilerView>('flamegraph');

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type !== 'profilerSession') return;

      const msg = message as ProfilerSessionMessage & { deviceId: string };
      setSessions(prev => {
        const next = new Map(prev);
        next.set(msg.deviceId, msg.commits);
        return next;
      });
      setSelectedCommitIndex(0);
      setIsProfiling(false);
      isProfilingRef.current = false;
    },
    [],
  );

  const commits = useMemo(
    () => (selectedDeviceId ? sessions.get(selectedDeviceId) ?? [] : []),
    [sessions, selectedDeviceId],
  );

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

  const startProfiling = useCallback(() => {
    if (!selectedDeviceId) return;
    setIsProfiling(true);
    isProfilingRef.current = true;
    sendCommand(selectedDeviceId, { type: 'startProfiling' });
  }, [selectedDeviceId]);

  const stopProfiling = useCallback(() => {
    if (!selectedDeviceId) return;
    sendCommand(selectedDeviceId, { type: 'stopProfiling' });
  }, [selectedDeviceId]);

  const reloadAndProfile = useCallback(() => {
    if (!selectedDeviceId) return;
    setIsProfiling(true);
    isProfilingRef.current = true;
    sendCommand(selectedDeviceId, { type: 'reloadAndProfile' });
  }, [selectedDeviceId]);

  const handleDeviceConnected = useCallback(
    (deviceId: string) => {
      if (!isProfilingRef.current) return;
      if (deviceId !== selectedDeviceId) return;
      sendCommand(deviceId, { type: 'startProfiling' });
    },
    [selectedDeviceId],
  );

  const clearProfilerData = useCallback(() => {
    if (!selectedDeviceId) return;
    setSessions(prev => {
      const next = new Map(prev);
      next.delete(selectedDeviceId);
      return next;
    });
    setSelectedCommitIndex(0);
  }, [selectedDeviceId]);

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
    handleMessage,
    handleDeviceConnected,
  };
};
