import type { RadarMessage } from '@radar/types';
import type { FiberNode, FiberRoot } from './fiberTypes';
import { walkFiber } from './walkFiber';
import { fiberIdMap } from './fiberIdMap';
import { COMPONENT_TREE_THROTTLE_MS } from './constants';

type Send = (message: RadarMessage) => void;

type CommitListener = (root: FiberRoot) => void;

type ReactDevToolsHook = {
  supportsFiber: boolean;
  inject: (renderer: Record<string, unknown>) => number;
  onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
  onCommitFiberUnmount: (rendererID: number, fiber: FiberNode) => void;
};

type GlobalWithHook = typeof globalThis & {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
};

const createThrottle = (ms: number) => {
  let lastCallTime = 0;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingFn: (() => void) | null = null;

  return (fn: () => void) => {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }

    if (elapsed >= ms) {
      lastCallTime = now;
      fn();
    } else {
      pendingFn = fn;
      pendingTimer = setTimeout(() => {
        lastCallTime = Date.now();
        pendingTimer = null;
        pendingFn?.();
        pendingFn = null;
      }, ms - elapsed);
    }
  };
};

export const installComponentTreeHook = (send: Send) => {
  const throttle = createThrottle(COMPONENT_TREE_THROTTLE_MS);
  const commitListeners: CommitListener[] = [];

  const addCommitListener = (listener: CommitListener) => {
    commitListeners.push(listener);
    return () => {
      const idx = commitListeners.indexOf(listener);
      if (idx !== -1) commitListeners.splice(idx, 1);
    };
  };

  const handleCommit = (root: FiberRoot) => {
    const rootNodes = walkFiber(root.current);
    send({
      type: 'componentTree',
      rootNodes,
      timestamp: Date.now(),
    });
  };

  const throttledHandleCommit = (root: FiberRoot) => {
    throttle(() => handleCommit(root));
  };

  const onCommitRoot = (root: FiberRoot) => {
    throttledHandleCommit(root);
    for (const listener of commitListeners) {
      listener(root);
    }
  };

  const handleUnmount = (_rendererID: number, fiber: FiberNode) => {
    fiberIdMap.removeFiber(fiber);
  };

  const typedGlobal = globalThis as GlobalWithHook;
  const existingHook = typedGlobal.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (existingHook) {
    const originalOnCommit = existingHook.onCommitFiberRoot;
    existingHook.onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
      originalOnCommit.call(existingHook, rendererID, root);
      onCommitRoot(root);
    };

    const originalOnUnmount = existingHook.onCommitFiberUnmount;
    existingHook.onCommitFiberUnmount = (
      rendererID: number,
      fiber: FiberNode,
    ) => {
      originalOnUnmount.call(existingHook, rendererID, fiber);
      handleUnmount(rendererID, fiber);
    };
  } else {
    typedGlobal.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_rendererID: number, root: FiberRoot) => {
        onCommitRoot(root);
      },
      onCommitFiberUnmount: handleUnmount,
    };
  }

  return { addCommitListener };
};
