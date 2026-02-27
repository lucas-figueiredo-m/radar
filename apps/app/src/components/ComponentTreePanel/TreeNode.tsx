import { ChevronRight } from 'lucide-react';
import type { ComponentTreeNode } from '@radar/types';

export type TreeNodeProps = {
  node: ComponentTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  searchRegex: RegExp | null;
  matchNodeIds: Set<string>;
  currentMatchId: string | null;
  isInsideSelected?: boolean;
};

const HighlightedName = ({ name, regex }: { name: string; regex: RegExp }) => {
  const parts = name.split(new RegExp(`(${regex.source})`, regex.flags));
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-status-warning text-bg-base rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

export const TreeNode = ({
  node,
  depth,
  expandedNodes,
  onToggleNode,
  selectedNodeId,
  onSelectNode,
  searchRegex,
  matchNodeIds,
  currentMatchId,
  isInsideSelected = false,
}: TreeNodeProps) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const isCurrentMatch = currentMatchId === node.id;
  const isMatch = matchNodeIds.has(node.id);
  const childrenInsideSelected =
    isInsideSelected || (isSelected && isExpanded);

  const rowBg = isCurrentMatch
    ? 'bg-accent-subtle'
    : isSelected
    ? 'bg-bg-elevated'
    : isMatch
    ? 'bg-status-warning-bg'
    : isInsideSelected
    ? 'bg-bg-secondary hover:bg-bg-surface'
    : 'hover:bg-bg-surface';

  return (
    <>
      <div
        data-node-id={node.id}
        className={`flex items-center py-0.5 cursor-pointer ${rowBg}`}
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
        <span className="text-accent ml-1">
          {searchRegex && isMatch ? (
            <HighlightedName name={node.name} regex={searchRegex} />
          ) : (
            node.name
          )}
        </span>
        {node.key !== null && (
          <span className="text-text-tertiary ml-1.5 text-[11px]">
            key={node.key}
          </span>
        )}
      </div>
      {isExpanded &&
        hasChildren &&
        (isSelected ? (
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 border-l border-border-strong"
              style={{ left: depth * 16 + 16 }}
            />
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                searchRegex={searchRegex}
                matchNodeIds={matchNodeIds}
                currentMatchId={currentMatchId}
                isInsideSelected={childrenInsideSelected}
              />
            ))}
          </div>
        ) : (
          node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              searchRegex={searchRegex}
              matchNodeIds={matchNodeIds}
              currentMatchId={currentMatchId}
              isInsideSelected={childrenInsideSelected}
            />
          ))
        ))}
    </>
  );
};
