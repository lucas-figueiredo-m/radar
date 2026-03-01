import type { FiberNode, FiberRoot } from '../componentTree/fiberTypes';
import { USER_COMPONENT_TAGS } from '../componentTree/constants';

export type FiberSnapshot = {
  fiber: FiberNode;
  actualDuration: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
  hasAlternate: boolean;
  isFresh: boolean;
  didRender: boolean;
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

const snapshotFiber = (
  fiber: FiberNode,
  parentChildrenFresh: boolean,
): FiberSnapshot[] => {
  try {
    const children = getChildren(fiber);
    const isUserComponent = USER_COMPONENT_TAGS.includes(fiber.tag);

    const isFresh = parentChildrenFresh;

    // Detect whether this fiber's children were re-processed in this commit.
    // When React bails out without child work, WIP.child stays = current.child
    // (same object reference, inherited). When reconciliation or cloneChildFibers
    // runs, WIP.child is updated to a new WIP child (different reference).
    const alternate = fiber.alternate;
    const childrenFresh =
      isFresh && (alternate === null || fiber.child !== alternate.child);

    if (isUserComponent) {
      const childSnapshots = children.flatMap((c) =>
        snapshotFiber(c, childrenFresh),
      );
      return [
        {
          fiber,
          actualDuration: fiber.actualDuration ?? 0,
          selfBaseDuration: fiber.selfBaseDuration ?? 0,
          treeBaseDuration: fiber.treeBaseDuration ?? 0,
          hasAlternate: !!alternate,
          isFresh,
          didRender:
            alternate !== null &&
            (fiber.memoizedProps !== alternate.memoizedProps ||
              fiber.memoizedState !== alternate.memoizedState),
          children: childSnapshots,
        },
      ];
    }

    return children.flatMap((c) => snapshotFiber(c, childrenFresh));
  } catch {
    return [];
  }
};

export const snapshotCommit = (root: FiberRoot): CommitSnapshot => ({
  timestamp: Date.now(),
  rootSnapshots: getChildren(root.current).flatMap((c) =>
    snapshotFiber(c, true),
  ),
});
