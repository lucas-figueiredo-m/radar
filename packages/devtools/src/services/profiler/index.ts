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
      const snapshot = snapshotCommit(root);
      snapshots.push(snapshot);
      console.log(
        `[radar:profiler] commit captured — ${snapshot.rootSnapshots.length} root components, total snapshots: ${snapshots.length}`,
      );
    } catch (err) {
      console.warn('[radar:profiler] snapshot error:', err);
    }
  };

  const startProfiling = () => {
    console.log('[radar:profiler] startProfiling command received');
    isProfiling = true;
    snapshots = [];
  };

  const stopProfiling = () => {
    console.log(
      `[radar:profiler] stopProfiling command received — ${snapshots.length} snapshots captured`,
    );
    isProfiling = false;
    try {
      const commits = buildProfilingData(snapshots);
      console.log(
        `[radar:profiler] built ${commits.length} commits, components per commit: [${commits.map(c => c.components.length).join(', ')}]`,
      );
      send({
        type: 'profilerSession',
        commits,
        timestamp: Date.now(),
      });
      console.log('[radar:profiler] profilerSession message sent');
    } catch (err) {
      console.error('[radar:profiler] buildProfilingData error:', err);
      send({
        type: 'profilerSession',
        commits: [],
        timestamp: Date.now(),
      });
    }
    snapshots = [];
  };

  return { handleCommit, startProfiling, stopProfiling };
};
