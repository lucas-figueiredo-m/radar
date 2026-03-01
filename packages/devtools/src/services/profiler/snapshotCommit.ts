import type { FiberNode, FiberRoot } from '../componentTree/fiberTypes';
import { USER_COMPONENT_TAGS } from '../componentTree/constants';

export type FiberSnapshot = {
  fiber: FiberNode;
  actualDuration: number;
  selfBaseDuration: number;
  hasAlternate: boolean;
  children: FiberSnapshot[];
};

export type CommitSnapshot = {
  timestamp: number;
  rootSnapshots: FiberSnapshot[];
};

const getChildren = (fiber: FiberNode): FiberNode[] => {
  const children: FiberNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(child);
    child = child.sibling;
  }
  return children;
};

const snapshotFiber = (fiber: FiberNode): FiberSnapshot[] => {
  try {
    const children = getChildren(fiber);
    const isUserComponent = USER_COMPONENT_TAGS.includes(fiber.tag);

    if (isUserComponent) {
      const childSnapshots = children.flatMap(snapshotFiber);
      return [
        {
          fiber,
          actualDuration: fiber.actualDuration ?? 0,
          selfBaseDuration: fiber.selfBaseDuration ?? 0,
          hasAlternate: !!fiber.alternate,
          children: childSnapshots,
        },
      ];
    }

    return children.flatMap(snapshotFiber);
  } catch {
    return [];
  }
};

export const snapshotCommit = (root: FiberRoot): CommitSnapshot => ({
  timestamp: Date.now(),
  rootSnapshots: getChildren(root.current).flatMap(snapshotFiber),
});
