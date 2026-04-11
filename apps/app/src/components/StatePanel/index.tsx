import { RefreshCw, Search } from 'lucide-react';
import type { StateCapabilityRow, StateSnapshotRow } from '@radar/database';
import { StoreSelector } from './StoreSelector';
import { StateTree } from './StateTree';
import { StateEmptyState } from './EmptyState';

export { StoreSelector } from './StoreSelector';
export type { StoreSelectorProps } from './StoreSelector';
export { StateTree } from './StateTree';
export type { StateTreeProps } from './StateTree';
export { StateEmptyState } from './EmptyState';
export type { StateEmptyStateProps } from './EmptyState';

export type StatePanelProps = {
  capabilities: StateCapabilityRow[];
  snapshots: StateSnapshotRow[];
  selectedStore: string | null;
  parsedState: Record<string, unknown> | null;
  searchQuery: string;
  connected: boolean;
  onSelectStore: (storeName: string) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
};

export const StatePanel = ({
  capabilities,
  selectedStore,
  parsedState,
  searchQuery,
  connected,
  onSelectStore,
  onSearch,
  onRefresh,
}: StatePanelProps) => {
  const hasStores = capabilities.length > 0;

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

      <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-text-disabled"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Filter state..."
            className="w-full bg-bg-surface text-text-primary text-detail pl-7 pr-2 py-1 rounded border border-border-subtle outline-none placeholder:text-text-disabled focus:border-border-focus"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2 py-1 text-detail text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {parsedState ? (
        <StateTree data={parsedState} searchQuery={searchQuery} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-disabled text-detail">
          No state data available
        </div>
      )}
    </>
  );
};
