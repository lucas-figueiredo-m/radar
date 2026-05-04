import type { ComponentTreeNode } from '@radar/types';

export const countNodes = (nodes: ComponentTreeNode[]): number =>
  nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
