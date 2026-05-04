import type { RadarMessage } from '@radar/types';
import type { FiberRoot } from '../componentTree/fiberTypes';
import { snapshotCommit } from './snapshotCommit';
import { buildProfilingData } from './buildProfilingData';
import type { CommitSnapshot } from './snapshotCommit';

type Send = (message: RadarMessage) => void;

export const createProfilerService = (send: Send) => {
  let isProfiling = false;
  let snapshots: CommitSnapshot[] = [];

  const handleCommit = (root: FiberRoot) => {
    if (!isProfiling) return;
    try {
      snapshots.push(snapshotCommit(root));
    } catch {
      // Don't let snapshot errors propagate to the component tree hook
    }
  };

  const startProfiling = () => {
    isProfiling = true;
    snapshots = [];
  };

  const stopProfiling = () => {
    isProfiling = false;
    try {
      const commits = buildProfilingData(snapshots);
      send({
        type: 'profilerSession',
        commits,
        timestamp: Date.now(),
      });
    } catch {
      send({
        type: 'profilerSession',
        commits: [],
        timestamp: Date.now(),
      });
    }
    snapshots = [];
  };

  const discardProfiling = () => {
    isProfiling = false;
    snapshots = [];
  };

  return { handleCommit, startProfiling, stopProfiling, discardProfiling };
};
