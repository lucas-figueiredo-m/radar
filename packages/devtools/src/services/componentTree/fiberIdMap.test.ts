import { describe, it, expect } from 'vitest';

// fiberIdMap uses module-level state, so we need a fresh import each test
// Since vitest caches modules, we test the exposed API directly
import { fiberIdMap } from './fiberIdMap';
import type { FiberNode } from './fiberTypes';

const makeFiber = (overrides: Partial<FiberNode> = {}): FiberNode => ({
  tag: 0,
  type: { name: 'Test' },
  child: null,
  sibling: null,
  return: null,
  key: null,
  memoizedProps: null,
  memoizedState: null,
  stateNode: null,
  _debugHookTypes: null,
  _debugSource: null,
  ...overrides,
});

describe('fiberIdMap', () => {
  it('assigns a stable ID to a fiber', () => {
    const fiber = makeFiber();
    const id1 = fiberIdMap.getFiberId(fiber);
    const id2 = fiberIdMap.getFiberId(fiber);
    expect(id1).toBe(id2);
  });

  it('assigns different IDs to different fibers', () => {
    const fiber1 = makeFiber();
    const fiber2 = makeFiber();
    expect(fiberIdMap.getFiberId(fiber1)).not.toBe(
      fiberIdMap.getFiberId(fiber2),
    );
  });

  it('looks up fiber by ID', () => {
    const fiber = makeFiber();
    const id = fiberIdMap.getFiberId(fiber);
    expect(fiberIdMap.getFiberById(id)).toBe(fiber);
  });

  it('returns undefined for unknown ID', () => {
    expect(fiberIdMap.getFiberById('nonexistent')).toBeUndefined();
  });

  it('removes fiber and cleans up both maps', () => {
    const fiber = makeFiber();
    const id = fiberIdMap.getFiberId(fiber);

    fiberIdMap.removeFiber(fiber);

    expect(fiberIdMap.getFiberById(id)).toBeUndefined();
    // Getting ID again should assign a new one
    const newId = fiberIdMap.getFiberId(fiber);
    expect(newId).not.toBe(id);
  });

  it('removeFiber is a no-op for unknown fibers', () => {
    const fiber = makeFiber();
    // Should not throw
    fiberIdMap.removeFiber(fiber);
  });
});
