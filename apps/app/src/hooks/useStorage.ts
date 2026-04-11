import { useState, useCallback, useMemo, useEffect } from 'react';
import type { StorageCapabilityRow, StorageEntryRow } from '@radar/database';
import type { StorageBackend, StorageValueType } from '@radar/types';
import { useDatabaseSubscription } from './useDatabaseSubscription';
import { databaseClient } from '../services/databaseClient';
import { sendCommand } from '../services/sendCommand';

export const useStorage = (selectedDeviceId: string | null) => {
  const [selectedBackend, setSelectedBackend] =
    useState<StorageBackend>('asyncStorage');
  const [selectedInstance, setSelectedInstance] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<StorageEntryRow | null>(
    null,
  );

  const queryCapabilities = useCallback(
    (deviceId: string) => databaseClient.storage.getCapabilities(deviceId),
    [],
  );

  const { data: capabilities } = useDatabaseSubscription(
    'radar:db:storage:capabilities:changed',
    selectedDeviceId,
    queryCapabilities,
    [] as StorageCapabilityRow[],
  );

  const queryEntries = useCallback(
    (deviceId: string) =>
      databaseClient.storage.getEntries({
        device_id: deviceId,
        backend: selectedBackend,
        instance_id: selectedInstance,
      }),
    [selectedBackend, selectedInstance],
  );

  const { data: entries, refetch } = useDatabaseSubscription(
    'radar:db:storage:changed',
    selectedDeviceId,
    queryEntries,
    [] as StorageEntryRow[],
  );

  // Auto-select the first available backend when capabilities arrive
  useEffect(() => {
    if (capabilities.length === 0) return;
    const available = capabilities.filter(c => c.available);
    if (available.length === 0) return;

    const currentAvailable = available.find(
      c =>
        c.backend === selectedBackend &&
        (c.instance_id ?? undefined) === selectedInstance,
    );
    if (!currentAvailable) {
      setSelectedBackend(available[0].backend);
      setSelectedInstance(available[0].instance_id ?? undefined);
    }
  }, [capabilities, selectedBackend, selectedInstance]);

  const refresh = useCallback(() => {
    if (!selectedDeviceId) return;
    sendCommand(selectedDeviceId, {
      type: 'storageGetAll',
      requestId: crypto.randomUUID(),
      backend: selectedBackend,
      instanceId: selectedInstance,
    });
  }, [selectedDeviceId, selectedBackend, selectedInstance]);

  // Auto-refresh when backend selection changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  const editEntry = useCallback(
    (key: string, value: string, valueType: StorageValueType) => {
      if (!selectedDeviceId) return;
      sendCommand(selectedDeviceId, {
        type: 'storageSet',
        requestId: crypto.randomUUID(),
        backend: selectedBackend,
        instanceId: selectedInstance,
        key,
        value,
        valueType,
      });
    },
    [selectedDeviceId, selectedBackend, selectedInstance],
  );

  const removeEntry = useCallback(
    (key: string) => {
      if (!selectedDeviceId) return;
      sendCommand(selectedDeviceId, {
        type: 'storageRemove',
        requestId: crypto.randomUUID(),
        backend: selectedBackend,
        instanceId: selectedInstance,
        key,
      });
    },
    [selectedDeviceId, selectedBackend, selectedInstance],
  );

  const clearStorage = useCallback(() => {
    if (!selectedDeviceId) return;
    sendCommand(selectedDeviceId, {
      type: 'storageClear',
      requestId: crypto.randomUUID(),
      backend: selectedBackend,
      instanceId: selectedInstance,
    });
  }, [selectedDeviceId, selectedBackend, selectedInstance]);

  const clearAll = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.storage.clear(selectedDeviceId);
    refetch();
  }, [selectedDeviceId, refetch]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      e =>
        e.key.toLowerCase().includes(query) ||
        e.value.toLowerCase().includes(query),
    );
  }, [entries, searchQuery]);

  const availableBackends = useMemo(
    () => capabilities.filter(c => c.available),
    [capabilities],
  );

  return {
    capabilities,
    availableBackends,
    entries: filteredEntries,
    allEntries: entries,
    selectedBackend,
    selectedInstance,
    searchQuery,
    editingEntry,
    setSelectedBackend,
    setSelectedInstance,
    setSearchQuery,
    setEditingEntry,
    refresh,
    editEntry,
    removeEntry,
    clearStorage,
    clearAll,
  };
};
