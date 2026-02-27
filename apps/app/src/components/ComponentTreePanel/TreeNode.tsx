import { ChevronRight } from 'lucide-react';
import type { ComponentTreeNode } from '@radar/types';

export type TreeNodeProps = {
  node: ComponentTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
};

export const TreeNode = ({
  node,
  depth,
  expandedNodes,
  onToggleNode,
  selectedNodeId,
  onSelectNode,
}: TreeNodeProps) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;

  return (
    <>
      <div
        className={`flex items-center py-0.5 cursor-pointer ${
          isSelected ? 'bg-bg-elevated' : 'hover:bg-bg-surface'
        }`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => onSelectNode(node.id)}
      >
        <span
          className="w-4 h-4 shrink-0 flex items-center justify-center"
          onClick={e => {
            if (hasChildren) {
              e.stopPropagation();
              onToggleNode(node.id);
            }
          }}
        >
          {hasChildren && (
            <ChevronRight
              size={12}
              className="transition-transform duration-150"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </span>
        <span className="text-accent ml-1">{node.name}</span>
        {node.key !== null && (
          <span className="text-text-tertiary ml-1.5 text-[11px]">
            key={node.key}
          </span>
        )}
      </div>
      {isExpanded &&
        hasChildren &&
        node.children.map(child => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedNodes={expandedNodes}
            onToggleNode={onToggleNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ))}
    </>
  );
};
