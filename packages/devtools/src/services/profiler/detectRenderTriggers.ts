import type { RenderTrigger } from '@radar/types';
import type { FiberNode } from '../componentTree/fiberTypes';

const shallowDiffKeys = (
  prev: Record<string, unknown> | null,
  next: Record<string, unknown> | null,
): string[] => {
  if (prev === null || next === null) return [];
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of allKeys) {
    if (prev[key] !== next[key]) {
      changed.push(key);
    }
  }
  return changed;
};

const didStateChange = (fiber: FiberNode): boolean => {
  if (!fiber.alternate) return false;
  let current = fiber.memoizedState ?? null;
  let previous = fiber.alternate.memoizedState ?? null;
  while (current !== null && previous !== null) {
    if (current.memoizedState !== previous.memoizedState) return true;
    current = current.next;
    previous = previous.next;
  }
  return current !== previous;
};

export const detectRenderTriggers = (fiber: FiberNode): RenderTrigger[] => {
  const triggers: RenderTrigger[] = [];
  const alternate = fiber.alternate;

  if (!alternate) {
    return triggers;
  }

  const changedProps = shallowDiffKeys(
    alternate.memoizedProps,
    fiber.memoizedProps,
  );
  if (changedProps.length > 0) {
    triggers.push({ type: 'props', changedKeys: changedProps });
  }

  if (didStateChange(fiber)) {
    triggers.push({ type: 'state' });
  }

  if (triggers.length === 0) {
    triggers.push({ type: 'parent' });
  }

  return triggers;
};
