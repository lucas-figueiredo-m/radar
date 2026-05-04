import { RefreshCw, Plus, Trash2, Search } from 'lucide-react';

export type StorageToolbarProps = {
  searchQuery: string;
  entryCount: number;
  totalCount: number;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onAddEntry: () => void;
  onClear: () => void;
};

export const StorageToolbar = ({
  searchQuery,
  entryCount,
  totalCount,
  onSearch,
  onRefresh,
  onAddEntry,
  onClear,
}: StorageToolbarProps) => {
  return (
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
          placeholder="Filter keys or values..."
          className="w-full bg-bg-surface text-text-primary text-detail pl-7 pr-2 py-1 rounded border border-border-subtle outline-none placeholder:text-text-disabled focus:border-border-focus"
        />
      </div>

      <span className="text-detail text-text-secondary">
        {entryCount === totalCount
          ? `${totalCount} entries`
          : `${entryCount} / ${totalCount} entries`}
      </span>

      <div className="flex-1" />

      <button
        onClick={onAddEntry}
        className="flex items-center gap-1 px-2 py-1 text-detail text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
        title="Add entry"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 px-2 py-1 text-detail text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
        title="Refresh"
      >
        <RefreshCw size={14} />
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-2 py-1 text-detail text-text-secondary hover:text-red-400 hover:bg-bg-hover rounded transition-colors"
        title="Clear all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
