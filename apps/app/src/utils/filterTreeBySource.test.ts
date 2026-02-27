import { describe, it, expect } from 'vitest';
import { filterTreeBySource } from './filterTreeBySource';
import type { ComponentTreeNode } from '@radar/types';

const makeNode = (
  overrides: Partial<ComponentTreeNode> & { children?: ComponentTreeNode[] } = {},
): ComponentTreeNode => ({
  id: '1',
  name: 'Component',
  key: null,
  children: [],
  ...overrides,
});

describe('filterTreeBySource', () => {
  it('returns empty array for empty input', () => {
    expect(filterTreeBySource([], 'src/App.tsx')).toEqual([]);
  });

  it('returns matching root nodes with full children', () => {
    const child = makeNode({ id: '2', name: 'Button', source: 'src/Button.tsx' });
    const root = makeNode({
      id: '1',
      name: 'App',
      source: 'src/App.tsx',
      children: [child],
    });

    const result = filterTreeBySource([root], 'src/App.tsx');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('App');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe('Button');
  });

  it('promotes matching descendants when parent does not match', () => {
    const nested = makeNode({ id: '3', name: 'Button', source: 'src/Button.tsx' });
    const middle = makeNode({
      id: '2',
      name: 'Wrapper',
      source: 'src/Wrapper.tsx',
      children: [nested],
    });
    const root = makeNode({
      id: '1',
      name: 'App',
      source: 'src/App.tsx',
      children: [middle],
    });

    const result = filterTreeBySource([root], 'src/Button.tsx');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Button');
  });

  it('returns empty array when no nodes match', () => {
    const root = makeNode({ id: '1', name: 'App', source: 'src/App.tsx' });
    expect(filterTreeBySource([root], 'src/Other.tsx')).toEqual([]);
  });

  it('returns multiple matching subtrees', () => {
    const btn1 = makeNode({ id: '2', name: 'Button1', source: 'src/Button.tsx' });
    const btn2 = makeNode({ id: '3', name: 'Button2', source: 'src/Button.tsx' });
    const root = makeNode({
      id: '1',
      name: 'App',
      source: 'src/App.tsx',
      children: [btn1, btn2],
    });

    const result = filterTreeBySource([root], 'src/Button.tsx');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Button1');
    expect(result[1].name).toBe('Button2');
  });

  it('handles nodes without source', () => {
    const child = makeNode({ id: '2', name: 'Button', source: 'src/Button.tsx' });
    const root = makeNode({
      id: '1',
      name: 'App',
      children: [child],
    });

    const result = filterTreeBySource([root], 'src/Button.tsx');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Button');
  });
});
