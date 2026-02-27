import { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { ComponentTreeNode } from '@radar/types';
import type { ComponentTreeState } from '../../types';
import { countNodes } from '../../utils';
import { TreeNode } from './TreeNode';
import { DEFAULT_EXPAND_DEPTH } from './constants';

export { TreeNode } from './TreeNode';
export type { TreeNodeProps } from './TreeNode';
export { DEFAULT_EXPAND_DEPTH } from './constants';

export type ComponentTreePanelProps = {
  tree: ComponentTreeState | null;
  connected: boolean;
};

const collectNodeIds = (
  nodes: ComponentTreeNode[],
  maxDepth: number,
  currentDepth: number,
): string[] => {
  if (currentDepth >= maxDepth) return [];
  return nodes.flatMap(node => [
    node.id,
    ...collectNodeIds(node.children, maxDepth, currentDepth + 1),
  ]);
};

const collectAllNodeIds = (nodes: ComponentTreeNode[]): string[] =>
  nodes.flatMap(node => [node.id, ...collectAllNodeIds(node.children)]);

export const ComponentTreePanel = ({
  tree,
  connected,
}: ComponentTreePanelProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  useEffect(() => {
    if (tree && !hasAutoExpanded) {
      const ids = collectNodeIds(tree.rootNodes, DEFAULT_EXPAND_DEPTH, 0);
      setExpandedNodes(new Set(ids));
      setHasAutoExpanded(true);
    }
  }, [tree, hasAutoExpanded]);

  const handleToggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!tree) return;
    const allIds = collectAllNodeIds(tree.rootNodes);
    setExpandedNodes(new Set(allIds));
  }, [tree]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const nodeCount = tree ? countNodes(tree.rootNodes) : 0;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle shrink-0">
        <button
          onClick={handleExpandAll}
          className="p-1 rounded hover:bg-bg-surface cursor-pointer"
          title="Expand All"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={handleCollapseAll}
          className="p-1 rounded hover:bg-bg-surface cursor-pointer"
          title="Collapse All"
        >
          <Minimize2 size={14} />
        </button>
        <span className="text-text-tertiary text-xs ml-auto">
          {nodeCount} components
        </span>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-auto">
        {tree === null ? (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            {connected
              ? 'No component tree yet. Waiting for React to render...'
              : 'Waiting for React Native app to connect on port 8347...'}
          </div>
        ) : (
          tree.rootNodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              expandedNodes={expandedNodes}
              onToggleNode={handleToggleNode}
            />
          ))
        )}
      </div>
    </>
  );
};
