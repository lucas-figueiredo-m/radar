import type { RadarMessage } from '@radar/types';
import { walkFiber } from './walkFiber';
import { COMPONENT_TREE_THROTTLE_MS } from './constants';

type Send = (message: RadarMessage) => void;

type FiberNode = {
  tag: number;
  type:
    | {
        displayName?: string;
        name?: string;
        render?: { displayName?: string; name?: string };
        type?: { displayName?: string; name?: string };
      }
    | string
    | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  key: string | null;
};

type FiberRoot = {
  current: FiberNode;
};

type ReactDevToolsHook = {
  supportsFiber: boolean;
  inject: (renderer: Record<string, unknown>) => number;
  onCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
  onCommitFiberUnmount: () => void;
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

  const typedGlobal = globalThis as GlobalWithHook;
  const existingHook = typedGlobal.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (existingHook) {
    const originalOnCommit = existingHook.onCommitFiberRoot;
    existingHook.onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
      originalOnCommit.call(existingHook, rendererID, root);
      throttledHandleCommit(root);
    };
  } else {
    typedGlobal.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_rendererID: number, root: FiberRoot) => {
        throttledHandleCommit(root);
      },
      onCommitFiberUnmount: () => {},
    };
  }
};
