import type { ComponentTreeNode } from '@radar/types';

export type SearchTreeResult = {
  matchIds: string[];
  ancestorIds: Set<string>;
};

const traverse = (
  nodes: ComponentTreeNode[],
  regex: RegExp,
  ancestors: string[],
  matchIds: string[],
  ancestorIds: Set<string>,
): void => {
  for (const node of nodes) {
    const isMatch = regex.test(node.name);
    if (isMatch) {
      matchIds.push(node.id);
      for (const id of ancestors) {
        ancestorIds.add(id);
      }
    }
    traverse(
      node.children,
      regex,
      [...ancestors, node.id],
      matchIds,
      ancestorIds,
    );
  }
};

export const searchTreeNodes = (
  nodes: ComponentTreeNode[],
  regex: RegExp | null,
): SearchTreeResult => {
  const matchIds: string[] = [];
  const ancestorIds = new Set<string>();

  if (!regex) return { matchIds, ancestorIds };

  traverse(nodes, regex, [], matchIds, ancestorIds);
  return { matchIds, ancestorIds };
};
