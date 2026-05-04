import { describe, it, expect } from 'vitest';
import { searchTreeNodes } from './searchTreeNodes';
import type { ComponentTreeNode } from '@radar/types';

const makeNode = (
  overrides: Partial<ComponentTreeNode> & {
    children?: ComponentTreeNode[];
  } = {},
): ComponentTreeNode => ({
  id: '1',
  name: 'Component',
  key: null,
  children: [],
  ...overrides,
});

describe('searchTreeNodes', () => {
  it('returns empty results for null regex', () => {
    const result = searchTreeNodes([], null);
    expect(result.matchIds).toEqual([]);
    expect(result.ancestorIds.size).toBe(0);
  });

  it('returns empty results for empty tree', () => {
    const result = searchTreeNodes([], /Button/i);
    expect(result.matchIds).toEqual([]);
    expect(result.ancestorIds.size).toBe(0);
  });

  it('finds a single match', () => {
    const tree = [makeNode({ id: 'a', name: 'Button' })];
    const result = searchTreeNodes(tree, /Button/i);
    expect(result.matchIds).toEqual(['a']);
    expect(result.ancestorIds.size).toBe(0);
  });

  it('collects ancestor ids for nested matches', () => {
    const tree = [
      makeNode({
        id: 'root',
        name: 'App',
        children: [
          makeNode({
            id: 'middle',
            name: 'Layout',
            children: [makeNode({ id: 'leaf', name: 'Button' })],
          }),
        ],
      }),
    ];
    const result = searchTreeNodes(tree, /Button/i);
    expect(result.matchIds).toEqual(['leaf']);
    expect(result.ancestorIds).toEqual(new Set(['root', 'middle']));
  });

  it('returns match ids in DFS order', () => {
    const tree = [
      makeNode({
        id: 'root',
        name: 'App',
        children: [
          makeNode({
            id: 'a',
            name: 'Button',
            children: [makeNode({ id: 'b', name: 'ButtonIcon' })],
          }),
          makeNode({ id: 'c', name: 'ButtonGroup' }),
        ],
      }),
    ];
    const result = searchTreeNodes(tree, /Button/i);
    expect(result.matchIds).toEqual(['a', 'b', 'c']);
  });

  it('returns empty results when nothing matches', () => {
    const tree = [
      makeNode({
        id: 'root',
        name: 'App',
        children: [makeNode({ id: 'a', name: 'Header' })],
      }),
    ];
    const result = searchTreeNodes(tree, /Button/i);
    expect(result.matchIds).toEqual([]);
    expect(result.ancestorIds.size).toBe(0);
  });

  it('works with regex patterns', () => {
    const tree = [
      makeNode({ id: 'a', name: 'AppHeader' }),
      makeNode({ id: 'b', name: 'AppFooter' }),
      makeNode({ id: 'c', name: 'Button' }),
    ];
    const result = searchTreeNodes(tree, /^App/);
    expect(result.matchIds).toEqual(['a', 'b']);
  });
});
