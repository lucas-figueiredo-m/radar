import { describe, it, expect } from 'vitest';
import { getComponentName } from './getComponentName';
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

describe('getComponentName', () => {
  it('returns null for string type (host components)', () => {
    expect(getComponentName(makeFiber({ type: 'div' }))).toBeNull();
  });

  it('returns null for null type', () => {
    expect(getComponentName(makeFiber({ type: null }))).toBeNull();
  });

  it('returns displayName for function components', () => {
    const type = { displayName: 'MyComponent', name: 'MyComponent' };
    expect(getComponentName(makeFiber({ tag: 0, type }))).toBe('MyComponent');
  });

  it('falls back to name when displayName is missing', () => {
    const type = { name: 'Fallback' };
    expect(getComponentName(makeFiber({ tag: 0, type }))).toBe('Fallback');
  });

  it('returns null when no name is available', () => {
    const type = {};
    expect(getComponentName(makeFiber({ tag: 0, type }))).toBeNull();
  });

  it('handles context providers (tag 10)', () => {
    const type = { _context: { displayName: 'Theme' } };
    expect(getComponentName(makeFiber({ tag: 10, type }))).toBe(
      'Theme.Provider',
    );
  });

  it('falls back to Context.Provider for unnamed contexts', () => {
    const type = {};
    expect(getComponentName(makeFiber({ tag: 10, type }))).toBe(
      'Context.Provider',
    );
  });

  it('handles forwardRef (tag 11)', () => {
    const type = { render: { displayName: 'Input' } };
    expect(getComponentName(makeFiber({ tag: 11, type }))).toBe('Input');
  });

  it('handles forwardRef with render.name fallback', () => {
    const type = { render: { name: 'InputRef' } };
    expect(getComponentName(makeFiber({ tag: 11, type }))).toBe('InputRef');
  });

  it('handles memo (tag 14)', () => {
    const type = { type: { displayName: 'MemoItem' } };
    expect(getComponentName(makeFiber({ tag: 14, type }))).toBe('MemoItem');
  });

  it('handles memo with type.name fallback', () => {
    const type = { type: { name: 'Item' } };
    expect(getComponentName(makeFiber({ tag: 14, type }))).toBe('Item');
  });
});
