import type { ProfilerCommitData, ProfilerComponentData, ProfilerPhase } from '@radar/types';
import { getComponentName } from '../componentTree/getComponentName';
import { fiberIdMap } from '../componentTree/fiberIdMap';
import { detectRenderTriggers } from './detectRenderTriggers';
import type { CommitSnapshot, FiberSnapshot } from './snapshotCommit';

const PERFORMED_WORK = 0b1;

const buildComponentData = (snapshot: FiberSnapshot): ProfilerComponentData | null => {
  try {
    const name = getComponentName(snapshot.fiber) ?? 'Unknown';

    let phase: ProfilerPhase;
    if (!snapshot.hasAlternate) {
      phase = 'mount';
    } else if (snapshot.flags & PERFORMED_WORK) {
      phase = 'update';
    } else {
      phase = 'did-not-render';
    }

    let triggers: ProfilerComponentData['triggers'] = [];
    if (phase === 'update') {
      try {
        triggers = detectRenderTriggers(snapshot.fiber);
      } catch {
        triggers = [{ type: 'unknown' }];
      }
    }

    const children = snapshot.children
      .map(buildComponentData)
      .filter((c): c is ProfilerComponentData => c !== null);

    const didNotRender = phase === 'did-not-render';

    return {
      id: fiberIdMap.getFiberId(snapshot.fiber),
      name,
      actualDuration: didNotRender ? 0 : snapshot.actualDuration,
      selfBaseDuration: didNotRender ? 0 : snapshot.selfBaseDuration,
      phase,
      triggers: didNotRender ? [] : triggers,
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
