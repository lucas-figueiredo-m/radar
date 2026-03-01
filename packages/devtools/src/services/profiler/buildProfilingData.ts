import type { ProfilerCommitData, ProfilerComponentData, ProfilerPhase } from '@radar/types';
import { getComponentName } from '../componentTree/getComponentName';
import { fiberIdMap } from '../componentTree/fiberIdMap';
import type { FiberNode } from '../componentTree/fiberTypes';
import { detectRenderTriggers } from './detectRenderTriggers';
import type { CommitSnapshot, FiberSnapshot } from './snapshotCommit';

const PERFORMED_WORK = 0b1;

const buildComponentData = (
  snapshot: FiberSnapshot,
  seenFibers: WeakSet<FiberNode>,
  parentRendered: boolean,
): ProfilerComponentData | null => {
  try {
    const name = getComponentName(snapshot.fiber) ?? 'Unknown';
    const id = fiberIdMap.getFiberId(snapshot.fiber);

    let phase: ProfilerPhase;
    let skipped = false;

    if (!snapshot.hasAlternate) {
      // No alternate means React never created a work-in-progress for this fiber
      // in this commit. It's either a genuine first mount or a reused fiber from
      // a previous commit where the parent bailed out entirely.
      //
      // Key insight: when a parent renders, reconcileChildFibers gives ALL
      // existing children alternates via useFiber/createWorkInProgress. So a
      // child with !hasAlternate under a rendered parent is genuinely new.
      // Under a non-rendered parent, it's a reused/skipped fiber.
      if (seenFibers.has(snapshot.fiber) || !parentRendered) {
        phase = 'did-not-render';
        skipped = true;
      } else {
        phase = 'mount';
      }
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

    const thisRendered = phase === 'mount' || phase === 'update';

    const children = snapshot.children
      .map((child) => buildComponentData(child, seenFibers, thisRendered))
      .filter((c): c is ProfilerComponentData => c !== null);

    const didNotRender = phase === 'did-not-render';

    return {
      id,
      name,
      actualDuration: didNotRender ? 0 : snapshot.actualDuration,
      selfBaseDuration: didNotRender ? 0 : snapshot.selfBaseDuration,
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

const collectSnapshotFibers = (
  snapshots: FiberSnapshot[],
  target: WeakSet<FiberNode>,
): void => {
  for (const s of snapshots) {
    target.add(s.fiber);
    collectSnapshotFibers(s.children, target);
  }
};

export const buildProfilingData = (
  snapshots: CommitSnapshot[],
): ProfilerCommitData[] => {
  const seenFibers = new WeakSet<FiberNode>();

  return snapshots.map((snapshot, index) => {
    const components = snapshot.rootSnapshots
      .map((s) => buildComponentData(s, seenFibers, true))
      .filter((c): c is ProfilerComponentData => c !== null);

    collectSnapshotFibers(snapshot.rootSnapshots, seenFibers);

    return {
      index,
      timestamp: snapshot.timestamp,
      duration: computeCommitDuration(components),
      components,
    };
  });
};
