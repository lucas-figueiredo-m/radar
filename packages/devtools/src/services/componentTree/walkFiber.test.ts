import { describe, it, expect, beforeEach } from 'vitest';
import { walkFiber } from './walkFiber';
import type { FiberNode } from './fiberTypes';

const makeFiber = (
  overrides: Partial<FiberNode> & { children?: FiberNode[] } = {},
): FiberNode => {
  const { children = [], ...rest } = overrides;
  const fiber: FiberNode = {
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
    ...rest,
  };

  if (children.length > 0) {
    fiber.child = children[0];
    for (let i = 0; i < children.length - 1; i++) {
      children[i].sibling = children[i + 1];
    }
  }

  return fiber;
};

describe('walkFiber', () => {
  beforeEach(() => {
    // Reset fiber id map between tests by importing fresh
  });

  it('returns empty array for root with no children', () => {
    const root = makeFiber();
    expect(walkFiber(root)).toEqual([]);
  });

  it('returns component tree nodes for function components', () => {
    const child = makeFiber({ tag: 0, type: { name: 'App' } });
    const root = makeFiber({ children: [child] });

    const result = walkFiber(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('App');
    expect(result[0].children).toEqual([]);
  });

  it('skips host components (string type)', () => {
    const hostChild = makeFiber({ tag: 5, type: 'div' });
    const root = makeFiber({ children: [hostChild] });

    expect(walkFiber(root)).toEqual([]);
  });

  it('includes source when __sourceFile is set', () => {
    const child = makeFiber({
      tag: 0,
      type: { name: 'App', __sourceFile: 'src/App.tsx' },
    });
    const root = makeFiber({ children: [child] });

    const result = walkFiber(root);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('src/App.tsx');
  });

  it('omits source when __sourceFile is not set', () => {
    const child = makeFiber({ tag: 0, type: { name: 'App' } });
    const root = makeFiber({ children: [child] });

    const result = walkFiber(root);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('source');
  });

  it('builds nested tree structure', () => {
    const grandchild = makeFiber({
      tag: 0,
      type: { name: 'Button', __sourceFile: 'src/Button.tsx' },
    });
    const child = makeFiber({
      tag: 0,
      type: { name: 'App', __sourceFile: 'src/App.tsx' },
      children: [grandchild],
    });
    const root = makeFiber({ children: [child] });

    const result = walkFiber(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('App');
    expect(result[0].source).toBe('src/App.tsx');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe('Button');
    expect(result[0].children[0].source).toBe('src/Button.tsx');
  });
});
