import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { StorageEntryRow } from '@radar/database';
import type { StorageBackend } from '@radar/types';
import { StorageRow } from './StorageRow';
import { ESTIMATED_ROW_HEIGHT } from './constants';

export type StorageTableProps = {
  entries: StorageEntryRow[];
  backend: StorageBackend;
  expandedKeys: Set<string>;
  onToggleExpand: (key: string) => void;
  onEdit: (entry: StorageEntryRow) => void;
  onRemove: (key: string) => void;
};

export const StorageTable = ({
  entries,
  backend,
  expandedKeys,
  onToggleExpand,
  onEdit,
  onRemove,
}: StorageTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 20,
  });

  // Re-measure when expanded keys change
  useEffect(() => {
    virtualizer.measure();
  }, [expandedKeys, virtualizer]);

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] text-text-disabled uppercase tracking-wider border-b border-border-subtle bg-bg-surface sticky top-0 z-10">
        <span className="w-3" />
        <span className="min-w-[120px] max-w-[200px]">Key</span>
        <span className="flex-1">Value</span>
        {backend === 'mmkv' && <span className="w-16">Type</span>}
        <span className="w-20">Actions</span>
      </div>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const entry = entries[virtualRow.index];
          return (
            <div
              key={entry.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <StorageRow
                entry={entry}
                backend={backend}
                expanded={expandedKeys.has(entry.key)}
                onToggleExpand={() => onToggleExpand(entry.key)}
                onEdit={() => onEdit(entry)}
                onRemove={() => onRemove(entry.key)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
