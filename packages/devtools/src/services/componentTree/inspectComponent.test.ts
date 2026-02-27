import { describe, it, expect } from 'vitest';
import { inspectComponent } from './inspectComponent';
import { fiberIdMap } from './fiberIdMap';
import type { FiberNode } from './fiberTypes';

const makeFiber = (overrides: Partial<FiberNode> = {}): FiberNode => ({
  tag: 0,
  type: { name: 'TestComponent' },
  child: null,
  sibling: null,
  key: null,
  memoizedProps: null,
  memoizedState: null,
  stateNode: null,
  _debugHookTypes: null,
  ...overrides,
});

describe('inspectComponent', () => {
  it('returns null data for unknown component ID', () => {
    const result = inspectComponent('nonexistent');
    expect(result.type).toBe('inspectComponent');
    expect(result.direction).toBe('response');
    expect(result.componentId).toBe('nonexistent');
    expect(result.data).toBeNull();
  });

  it('returns component data for a registered fiber', () => {
    const fiber = makeFiber({
      memoizedProps: { title: 'Hello', count: 42 },
    });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    expect(result.data).not.toBeNull();
    expect(result.data?.name).toBe('TestComponent');
    expect(result.data?.id).toBe(id);
  });

  it('serializes props alphabetically', () => {
    const fiber = makeFiber({
      memoizedProps: { zebra: 'z', alpha: 'a', middle: 'm' },
    });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    const keys = result.data?.props.map(p => p.key);
    expect(keys).toEqual(['alpha', 'middle', 'zebra']);
  });

  it('includes children prop', () => {
    const fiber = makeFiber({
      memoizedProps: { children: 'text content', title: 'Test' },
    });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    const keys = result.data?.props.map(p => p.key);
    expect(keys).toContain('children');
  });

  it('returns empty hooks for non-function components', () => {
    const fiber = makeFiber({
      tag: 1, // CLASS_COMPONENT
      memoizedProps: { title: 'Hello' },
    });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    expect(result.data?.hooks).toEqual([]);
  });

  it('returns empty props when memoizedProps is null', () => {
    const fiber = makeFiber({ memoizedProps: null });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    expect(result.data?.props).toEqual([]);
  });

  it('falls back to Unknown when component has no name', () => {
    const fiber = makeFiber({ type: {} });
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    expect(result.data?.name).toBe('Unknown');
  });

  it('includes a timestamp', () => {
    const before = Date.now();
    const fiber = makeFiber();
    const id = fiberIdMap.getFiberId(fiber);

    const result = inspectComponent(id);
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());
  });
});
