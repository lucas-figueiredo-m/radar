import { useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Trash2 } from 'lucide-react';
import type { StateCapabilityRow, StateActionRow } from '@radar/database';
import { StoreSelector } from './StoreSelector';
import { ActionList } from './ActionList';
import { StateTree } from './StateTree';
import { StateEmptyState } from './EmptyState';

export { StoreSelector } from './StoreSelector';
export type { StoreSelectorProps } from './StoreSelector';
export { ActionList } from './ActionList';
export type { ActionListProps } from './ActionList';
export { StateTree } from './StateTree';
export type { StateTreeProps } from './StateTree';
export { StateEmptyState } from './EmptyState';
export type { StateEmptyStateProps } from './EmptyState';

export type StatePanelProps = {
  capabilities: StateCapabilityRow[];
  actions: StateActionRow[];
  selectedStore: string | null;
  selectedActionId: number | null;
  displayState: Record<string, unknown> | null;
  searchQuery: string;
  connected: boolean;
  onSelectStore: (storeName: string) => void;
  onSelectAction: (id: number | null) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onClear: () => void;
};

export const StatePanel = ({
  capabilities,
  actions,
  selectedStore,
  selectedActionId,
  displayState,
  searchQuery,
  connected,
  onSelectStore,
  onSelectAction,
  onSearch,
  onRefresh,
  onClear,
}: StatePanelProps) => {
  const hasStores = capabilities.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const [actionPanelWidth, setActionPanelWidth] = useState(260);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(
        160,
        Math.min(e.clientX - rect.left, rect.width - 200),
      );
      setActionPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  if (!connected || !hasStores) {
    return <StateEmptyState connected={connected} hasStores={hasStores} />;
  }

  return (
    <>
      <StoreSelector
        capabilities={capabilities}
        selectedStore={selectedStore}
        onSelectStore={onSelectStore}
      />

      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left: Action log */}
        <div
          className="flex flex-col shrink-0 border-r border-border-subtle"
          style={{ width: actionPanelWidth }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle shrink-0">
            <span className="text-[10px] text-text-disabled uppercase tracking-wider">
              Actions
            </span>
            <span className="text-[10px] text-text-disabled">
              ({actions.length})
            </span>
            <div className="flex-1" />
            <button
              onClick={onRefresh}
              className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={onClear}
              className="p-1 text-text-secondary hover:text-red-400 rounded hover:bg-bg-hover transition-colors"
              title="Clear"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <ActionList
            actions={actions}
            selectedActionId={selectedActionId}
            onSelectAction={onSelectAction}
          />
        </div>

        {/* Draggable divider */}
        <div
          className="w-1 cursor-col-resize hover:bg-border-focus transition-colors shrink-0"
          onMouseDown={handleMouseDown}
        />

        {/* Right: State tree */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle shrink-0">
            <span className="text-[10px] text-text-disabled uppercase tracking-wider">
              {selectedActionId !== null ? 'State at action' : 'Current state'}
            </span>
            <div className="flex-1" />
            <div className="relative max-w-[200px]">
              <Search
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-text-disabled"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                placeholder="Filter..."
                className="w-full bg-bg-surface text-text-primary text-detail pl-6 pr-2 py-0.5 rounded border border-border-subtle outline-none placeholder:text-text-disabled focus:border-border-focus text-[11px]"
              />
            </div>
          </div>

          {displayState ? (
            <StateTree data={displayState} searchQuery={searchQuery} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-disabled text-detail">
              No state data
            </div>
          )}
        </div>
      </div>
    </>
  );
};
