import type { ComponentTreeNode } from '@radar/types';

export const filterTreeBySource = (
  nodes: ComponentTreeNode[],
  source: string,
): ComponentTreeNode[] =>
  nodes.flatMap(node => {
    if (node.source === source) {
      return [node];
    }

    return filterTreeBySource(node.children, source);
  });
