import type {
  ProfilerCommitData,
  ProfilerComponentData,
  ProfilerPhase,
} from '@radar/types';
import { getComponentName } from '../componentTree/getComponentName';
import { fiberIdMap } from '../componentTree/fiberIdMap';
import { detectRenderTriggers } from './detectRenderTriggers';
import type { CommitSnapshot, FiberSnapshot } from './snapshotCommit';

const buildComponentData = (
  snapshot: FiberSnapshot,
): ProfilerComponentData | null => {
  try {
    const name = getComponentName(snapshot.fiber) ?? 'Unknown';
    const id = fiberIdMap.getFiberId(snapshot.fiber);

    let phase: ProfilerPhase;
    let skipped = false;

    if (!snapshot.isFresh) {
      // Stale fiber: not cloned in this commit. Its flags, actualDuration,
      // and props/state are carried over from a previous commit and don't
      // reflect this commit's work. React skipped this entire subtree.
      phase = 'did-not-render';
      skipped = true;
    } else if (!snapshot.hasAlternate) {
      // Fresh fiber with no alternate = genuinely new (first-time mount).
      // createWorkInProgress always sets up alternates for existing fibers,
      // so !hasAlternate on a fresh fiber means createFiber was called.
      phase = 'mount';
    } else if (snapshot.didRender) {
      // Fresh fiber with alternate, props/state changed from alternate.
      // Same approach as React DevTools' didFiberRender check.
      phase = 'update';
    } else {
      // Fresh fiber with alternate, but props/state unchanged = bailed out.
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
      id,
      name,
      actualDuration: didNotRender ? 0 : snapshot.actualDuration,
      selfBaseDuration: didNotRender ? 0 : snapshot.selfBaseDuration,
      treeBaseDuration: snapshot.treeBaseDuration,
      phase,
      skipped,
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
