import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { ComponentTreeNode, InspectedComponentData } from '@radar/types';
import type { ComponentTreeState } from '../../types';
import {
  countNodes,
  collectSourceFiles,
  filterTreeBySource,
  buildSearchRegex,
  searchTreeNodes,
} from '../../utils';
import { ComponentInspector } from '..';
import { TreeNode } from './TreeNode';
import { FileFilterSelect } from './FileFilterSelect';
import { SearchBar } from './SearchBar';
import { DEFAULT_EXPAND_DEPTH } from './constants';

export { TreeNode } from './TreeNode';
export type { TreeNodeProps } from './TreeNode';
export { FileFilterSelect } from './FileFilterSelect';
export type { FileFilterSelectProps } from './FileFilterSelect';
export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';
export { DEFAULT_EXPAND_DEPTH } from './constants';

export type ComponentTreePanelProps = {
  tree: ComponentTreeState | null;
  connected: boolean;
  selectedComponentId: string | null;
  inspectedComponent: InspectedComponentData | null;
  onInspectComponent: (id: string) => void;
  onClearInspection: () => void;
  editorName?: string | null;
  onRequestEditorPicker?: () => void;
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

const EMPTY_SET = new Set<string>();

export const ComponentTreePanel = ({
  tree,
  connected,
  selectedComponentId,
  inspectedComponent,
  onInspectComponent,
  onClearInspection,
  editorName,
  onRequestEditorPicker,
}: ComponentTreePanelProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [selectedSourceFile, setSelectedSourceFile] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const sourceFiles = useMemo(
    () => (tree ? collectSourceFiles(tree.rootNodes) : []),
    [tree],
  );

  const displayedRootNodes = useMemo(() => {
    if (!tree) return [];
    if (!selectedSourceFile) return tree.rootNodes;
    return filterTreeBySource(tree.rootNodes, selectedSourceFile);
  }, [tree, selectedSourceFile]);

  const searchRegex = useMemo(
    () => buildSearchRegex(searchQuery),
    [searchQuery],
  );

  const searchResult = useMemo(
    () => searchTreeNodes(displayedRootNodes, searchRegex),
    [displayedRootNodes, searchRegex],
  );

  const matchNodeIdSet = useMemo(
    () =>
      searchResult.matchIds.length > 0
        ? new Set(searchResult.matchIds)
        : EMPTY_SET,
    [searchResult.matchIds],
  );

  const currentMatchId =
    searchResult.matchIds.length > 0
      ? searchResult.matchIds[currentMatchIndex] ?? null
      : null;

  useEffect(() => {
    if (selectedSourceFile && !sourceFiles.includes(selectedSourceFile)) {
      setSelectedSourceFile(null);
    }
  }, [sourceFiles, selectedSourceFile]);

  useEffect(() => {
    if (tree && !hasAutoExpanded) {
      const ids = collectNodeIds(tree.rootNodes, DEFAULT_EXPAND_DEPTH, 0);
      setExpandedNodes(new Set(ids));
      setHasAutoExpanded(true);
    }
  }, [tree, hasAutoExpanded]);

  // Reset match index when matches change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchResult.matchIds]);

  // Auto-expand ancestors of matches
  useEffect(() => {
    if (searchResult.ancestorIds.size > 0) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        for (const id of searchResult.ancestorIds) {
          next.add(id);
        }
        return next.size === prev.size ? prev : next;
      });
    }
  }, [searchResult.ancestorIds]);

  // Scroll to current match
  useEffect(() => {
    if (!currentMatchId || !treeContainerRef.current) return;
    const el = treeContainerRef.current.querySelector(
      `[data-node-id="${currentMatchId}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [currentMatchId]);

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
    const allIds = collectAllNodeIds(displayedRootNodes);
    setExpandedNodes(new Set(allIds));
  }, [tree, displayedRootNodes]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const handlePrevMatch = useCallback(() => {
    if (searchResult.matchIds.length === 0) return;
    setCurrentMatchIndex(prev =>
      prev <= 0 ? searchResult.matchIds.length - 1 : prev - 1,
    );
  }, [searchResult.matchIds.length]);

  const handleNextMatch = useCallback(() => {
    if (searchResult.matchIds.length === 0) return;
    setCurrentMatchIndex(prev =>
      prev >= searchResult.matchIds.length - 1 ? 0 : prev + 1,
    );
  }, [searchResult.matchIds.length]);

  const nodeCount = countNodes(displayedRootNodes);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          currentMatchIndex={currentMatchIndex}
          totalMatches={searchResult.matchIds.length}
          onPrevMatch={handlePrevMatch}
          onNextMatch={handleNextMatch}
        />
        {sourceFiles.length > 0 && (
          <FileFilterSelect
            files={sourceFiles}
            selectedFile={selectedSourceFile}
            onSelectFile={setSelectedSourceFile}
          />
        )}
        <span className="text-text-tertiary text-xs ml-auto whitespace-nowrap">
          {nodeCount} components
        </span>
      </div>

      {/* Content area: tree + inspector side by side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree */}
        <div
          ref={treeContainerRef}
          className={`flex-1 overflow-auto ${
            inspectedComponent ? 'border-r border-border-default' : ''
          }`}
        >
          {tree === null ? (
            <div className="flex items-center justify-center h-full text-text-tertiary">
              {connected
                ? 'No component tree yet. Waiting for React to render...'
                : 'Waiting for React Native app to connect on port 8347...'}
            </div>
          ) : displayedRootNodes.length === 0 && selectedSourceFile ? (
            <div className="flex items-center justify-center h-full text-text-tertiary">
              No components found in selected file
            </div>
          ) : (
            displayedRootNodes.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedNodes={expandedNodes}
                onToggleNode={handleToggleNode}
                selectedNodeId={selectedComponentId}
                onSelectNode={onInspectComponent}
                searchRegex={searchRegex}
                matchNodeIds={matchNodeIdSet}
                currentMatchId={currentMatchId}
              />
            ))
          )}
        </div>

        {/* Inspector panel */}
        {inspectedComponent && (
          <ComponentInspector
            data={inspectedComponent}
            onClose={onClearInspection}
            onInspectComponent={onInspectComponent}
            editorName={editorName}
            onRequestEditorPicker={onRequestEditorPicker}
          />
        )}
      </div>
    </div>
  );
};
