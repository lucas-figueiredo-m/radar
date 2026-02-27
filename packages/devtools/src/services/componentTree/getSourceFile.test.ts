import { describe, it, expect } from 'vitest';
import { getSourceFile } from './getSourceFile';
import type { FiberNode } from './fiberTypes';

const makeFiber = (overrides: Partial<FiberNode> = {}): FiberNode => ({
  tag: 0,
  type: null,
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

describe('getSourceFile', () => {
  it('returns undefined for null type', () => {
    expect(getSourceFile(makeFiber({ type: null }))).toBeUndefined();
  });

  it('returns undefined for string type', () => {
    expect(getSourceFile(makeFiber({ type: 'div' }))).toBeUndefined();
  });

  it('returns undefined when __sourceFile is not set', () => {
    expect(getSourceFile(makeFiber({ type: { name: 'App' } }))).toBeUndefined();
  });

  it('returns the source file when set', () => {
    const fiber = makeFiber({
      type: { name: 'App', __sourceFile: 'src/App.tsx' },
    });
    expect(getSourceFile(fiber)).toBe('src/App.tsx');
  });
});
