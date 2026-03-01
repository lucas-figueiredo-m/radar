import type { ProfilerCommitData, ProfilerComponentData, ProfilerPhase } from '@radar/types';
import { getComponentName } from '../componentTree/getComponentName';
import { fiberIdMap } from '../componentTree/fiberIdMap';
import { detectRenderTriggers } from './detectRenderTriggers';
import type { CommitSnapshot, FiberSnapshot } from './snapshotCommit';

const buildComponentData = (snapshot: FiberSnapshot): ProfilerComponentData | null => {
  try {
    const name = getComponentName(snapshot.fiber) ?? 'Unknown';
    const phase: ProfilerPhase = snapshot.hasAlternate ? 'update' : 'mount';

    let triggers: ProfilerComponentData['triggers'] = [];
    if (snapshot.hasAlternate) {
      try {
        triggers = detectRenderTriggers(snapshot.fiber);
      } catch {
        triggers = [{ type: 'unknown' }];
      }
    }

    const children = snapshot.children
      .map(buildComponentData)
      .filter((c): c is ProfilerComponentData => c !== null);

    return {
      id: fiberIdMap.getFiberId(snapshot.fiber),
      name,
      actualDuration: snapshot.actualDuration,
      selfBaseDuration: snapshot.selfBaseDuration,
      phase,
      triggers,
      children,
    };
  } catch {
    return null;
  }
};

const computeCommitDuration = (components: ProfilerComponentData[]): number => {
  let max = 0;
  for (const c of components) {
    if (c.actualDuration > max) max = c.actualDuration;
  }
  return max;
};

export const buildProfilingData = (
  snapshots: CommitSnapshot[],
): ProfilerCommitData[] =>
  snapshots.map((snapshot, index) => {
    const components = snapshot.rootSnapshots
      .map(buildComponentData)
      .filter((c): c is ProfilerComponentData => c !== null);
    return {
      index,
      timestamp: snapshot.timestamp,
      duration: computeCommitDuration(components),
      components,
    };
  });
