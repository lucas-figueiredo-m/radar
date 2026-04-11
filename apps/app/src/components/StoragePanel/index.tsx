import { useState, useCallback } from 'react';
import type { StorageCapabilityRow, StorageEntryRow } from '@radar/database';
import type { StorageBackend, StorageValueType } from '@radar/types';
import { BackendSelector } from './BackendSelector';
import { StorageToolbar } from './StorageToolbar';
import { StorageTable } from './StorageTable';
import { EditEntryModal } from './EditEntryModal';
import { EmptyState } from './EmptyState';

export { BackendSelector } from './BackendSelector';
export type { BackendSelectorProps } from './BackendSelector';
export { StorageToolbar } from './StorageToolbar';
export type { StorageToolbarProps } from './StorageToolbar';
export { StorageRow } from './StorageRow';
export type { StorageRowProps } from './StorageRow';
export { StorageTable } from './StorageTable';
export type { StorageTableProps } from './StorageTable';
export { EditEntryModal } from './EditEntryModal';
export type { EditEntryModalProps } from './EditEntryModal';
export { EmptyState as StorageEmptyState } from './EmptyState';
export type { EmptyStateProps as StorageEmptyStateProps } from './EmptyState';

export type StoragePanelProps = {
  capabilities: StorageCapabilityRow[];
  availableBackends: StorageCapabilityRow[];
  entries: StorageEntryRow[];
  allEntries: StorageEntryRow[];
  selectedBackend: StorageBackend;
  selectedInstance: string | undefined;
  searchQuery: string;
  editingEntry: StorageEntryRow | null;
  connected: boolean;
  onSelectBackend: (backend: StorageBackend) => void;
  onSelectInstance: (instanceId: string | undefined) => void;
  onSearch: (query: string) => void;
  onEditEntry: (entry: StorageEntryRow | null) => void;
  onSaveEntry: (key: string, value: string, valueType: StorageValueType) => void;
  onRemoveEntry: (key: string) => void;
  onRefresh: () => void;
  onClear: () => void;
};

export const StoragePanel = ({
  capabilities,
  availableBackends,
  entries,
  allEntries,
  selectedBackend,
  selectedInstance,
  searchQuery,
  editingEntry,
  connected,
  onSelectBackend,
  onSelectInstance,
  onSearch,
  onEditEntry,
  onSaveEntry,
  onRemoveEntry,
  onRefresh,
  onClear,
}: StoragePanelProps) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [editModalVisible, setEditModalVisible] = useState(false);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleEdit = useCallback(
    (entry: StorageEntryRow) => {
      onEditEntry(entry);
      setEditModalVisible(true);
    },
    [onEditEntry],
  );

  const handleAddEntry = useCallback(() => {
    onEditEntry(null);
    setEditModalVisible(true);
  }, [onEditEntry]);

  const handleCloseModal = useCallback(() => {
    setEditModalVisible(false);
    onEditEntry(null);
  }, [onEditEntry]);

  const hasBackends = availableBackends.length > 0;
  const hasEntries = entries.length > 0;

  const showEmptyState = !connected || !hasBackends || !hasEntries;

  return (
    <>
      {capabilities.length > 0 && (
        <BackendSelector
          capabilities={capabilities}
          selectedBackend={selectedBackend}
          selectedInstance={selectedInstance}
          onSelectBackend={onSelectBackend}
          onSelectInstance={onSelectInstance}
        />
      )}

      {hasBackends && (
        <StorageToolbar
          searchQuery={searchQuery}
          entryCount={entries.length}
          totalCount={allEntries.length}
          onSearch={onSearch}
          onRefresh={onRefresh}
          onAddEntry={handleAddEntry}
          onClear={onClear}
        />
      )}

      {showEmptyState ? (
        <EmptyState
          connected={connected}
          hasBackends={hasBackends}
          hasEntries={hasEntries}
          onRefresh={onRefresh}
        />
      ) : (
        <StorageTable
          entries={entries}
          backend={selectedBackend}
          expandedKeys={expandedKeys}
          onToggleExpand={toggleExpand}
          onEdit={handleEdit}
          onRemove={onRemoveEntry}
        />
      )}

      <EditEntryModal
        entry={editingEntry}
        backend={selectedBackend}
        visible={editModalVisible}
        onSave={onSaveEntry}
        onCancel={handleCloseModal}
      />
    </>
  );
};
