import { Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import type { StorageEntryRow } from '@radar/database';
import type { StorageBackend } from '@radar/types';
import { CopyButton } from '../CopyButton';
import { VALUE_TYPE_BG_COLORS } from './constants';

export type StorageRowProps = {
  entry: StorageEntryRow;
  backend: StorageBackend;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

export const StorageRow = ({
  entry,
  backend,
  expanded,
  onToggleExpand,
  onEdit,
  onRemove,
}: StorageRowProps) => {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="border-b border-border-subtle">
      <div
        className="flex items-center gap-3 px-4 py-1.5 hover:bg-bg-hover cursor-pointer group"
        onClick={onToggleExpand}
      >
        <Chevron size={12} className="text-text-disabled shrink-0" />

        <span className="text-detail text-text-primary font-medium truncate min-w-[120px] max-w-[200px]">
          {entry.key}
        </span>

        {!expanded && (
          <span className="text-detail text-text-secondary truncate flex-1">
            {entry.value}
          </span>
        )}

        {expanded && <span className="flex-1" />}

        {backend === 'mmkv' && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              VALUE_TYPE_BG_COLORS[entry.value_type]
            }`}
          >
            {entry.value_type}
          </span>
        )}

        <div
          className="flex items-center gap-1 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <CopyButton text={entry.value} ariaLabel="Copy value" />
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-active transition-colors"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-text-secondary hover:text-red-400 rounded hover:bg-bg-active transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-2 pl-10 bg-bg-surface border-t border-border-subtle">
          <pre className="text-detail text-text-primary whitespace-pre-wrap break-all font-mono">
            {formatExpandedValue(entry.value)}
          </pre>
        </div>
      )}
    </div>
  );
};

const formatExpandedValue = (value: string): string => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
};
