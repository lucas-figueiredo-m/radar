import { describe, it, expect } from 'vitest';
import { collectSourceFiles } from './collectSourceFiles';
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

describe('collectSourceFiles', () => {
  it('returns empty array for empty input', () => {
    expect(collectSourceFiles([])).toEqual([]);
  });

  it('returns empty array when no nodes have source', () => {
    const nodes = [makeNode({ id: '1', name: 'App' })];
    expect(collectSourceFiles(nodes)).toEqual([]);
  });

  it('collects source files from flat list', () => {
    const nodes = [
      makeNode({ id: '1', name: 'App', source: 'src/App.tsx' }),
      makeNode({ id: '2', name: 'Header', source: 'src/Header.tsx' }),
    ];
    expect(collectSourceFiles(nodes)).toEqual([
      'src/App.tsx',
      'src/Header.tsx',
    ]);
  });

  it('deduplicates source files', () => {
    const nodes = [
      makeNode({ id: '1', name: 'App', source: 'src/App.tsx' }),
      makeNode({ id: '2', name: 'Header', source: 'src/App.tsx' }),
    ];
    expect(collectSourceFiles(nodes)).toEqual(['src/App.tsx']);
  });

  it('collects from nested children', () => {
    const nodes = [
      makeNode({
        id: '1',
        name: 'App',
        source: 'src/App.tsx',
        children: [
          makeNode({ id: '2', name: 'Button', source: 'src/Button.tsx' }),
        ],
      }),
    ];
    expect(collectSourceFiles(nodes)).toEqual([
      'src/App.tsx',
      'src/Button.tsx',
    ]);
  });

  it('returns sorted results', () => {
    const nodes = [
      makeNode({ id: '1', name: 'Z', source: 'src/Z.tsx' }),
      makeNode({ id: '2', name: 'A', source: 'src/A.tsx' }),
      makeNode({ id: '3', name: 'M', source: 'src/M.tsx' }),
    ];
    expect(collectSourceFiles(nodes)).toEqual([
      'src/A.tsx',
      'src/M.tsx',
      'src/Z.tsx',
    ]);
  });
});
