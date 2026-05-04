import { useRef } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export type SearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onPrevMatch: () => void;
  onNextMatch: () => void;
};

export const SearchBar = ({
  query,
  onQueryChange,
  currentMatchIndex,
  totalMatches,
  onPrevMatch,
  onNextMatch,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === 'Escape') {
      onQueryChange('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <div className="relative flex-1 min-w-0">
        <Search
          size={12}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search components..."
          className="w-full bg-bg-surface text-text-primary text-xs pl-6 pr-2 py-1 rounded border border-border-subtle focus:outline-none focus:border-accent"
        />
      </div>
      {query && (
        <>
          <span className="text-text-tertiary text-xs whitespace-nowrap">
            {totalMatches > 0
              ? `${currentMatchIndex + 1}/${totalMatches}`
              : '0/0'}
          </span>
          <button
            onClick={onPrevMatch}
            disabled={totalMatches === 0}
            className="p-0.5 rounded hover:bg-bg-surface cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onNextMatch}
            disabled={totalMatches === 0}
            className="p-0.5 rounded hover:bg-bg-surface cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Next match (Enter)"
          >
            <ChevronDown size={14} />
          </button>
        </>
      )}
    </div>
  );
};
