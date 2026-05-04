import type { ComponentTreeNode } from '@radar/types';

const collect = (nodes: ComponentTreeNode[], set: Set<string>): void => {
  for (const node of nodes) {
    if (node.source) {
      set.add(node.source);
    }
    collect(node.children, set);
  }
};

export const collectSourceFiles = (nodes: ComponentTreeNode[]): string[] => {
  const set = new Set<string>();
  collect(nodes, set);
  return [...set].sort();
};
