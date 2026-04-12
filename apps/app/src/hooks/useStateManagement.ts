import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  StateCapabilityRow,
  StateSnapshotRow,
  StateActionRow,
} from '@radar/database';
import { useDatabaseSubscription } from './useDatabaseSubscription';
import { databaseClient } from '../services/databaseClient';
import { sendCommand } from '../services/sendCommand';

export const useStateManagement = (selectedDeviceId: string | null) => {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const queryCapabilities = useCallback(
    (deviceId: string) => databaseClient.state.getCapabilities(deviceId),
    [],
  );

  const { data: capabilities } = useDatabaseSubscription(
    'radar:db:state:capabilities:changed',
    selectedDeviceId,
    queryCapabilities,
    [] as StateCapabilityRow[],
  );

  const querySnapshots = useCallback(
    (deviceId: string) => databaseClient.state.getSnapshots(deviceId),
    [],
  );

  const { data: snapshots } = useDatabaseSubscription(
    'radar:db:state:changed',
    selectedDeviceId,
    querySnapshots,
    [] as StateSnapshotRow[],
  );

  const queryActions = useCallback(
    (deviceId: string) => {
      if (!selectedStore) return Promise.resolve([] as StateActionRow[]);
      return databaseClient.state.getActions(deviceId, selectedStore);
    },
    [selectedStore],
  );

  const { data: actions } = useDatabaseSubscription(
    'radar:db:state:action:changed',
    selectedDeviceId,
    queryActions,
    [] as StateActionRow[],
  );

  // Auto-select first store when capabilities arrive
  useEffect(() => {
    if (capabilities.length === 0) {
      setSelectedStore(null);
      return;
    }
    if (
      selectedStore === null ||
      !capabilities.some(c => c.store_name === selectedStore)
    ) {
      setSelectedStore(capabilities[0].store_name);
    }
  }, [capabilities, selectedStore]);

  // Reset selected action when store changes
  useEffect(() => {
    setSelectedActionId(null);
  }, [selectedStore]);

  const selectedSnapshot = useMemo(
    () => snapshots.find(s => s.store_name === selectedStore) ?? null,
    [snapshots, selectedStore],
  );

  // State to display: either from selected action or current snapshot
  const displayState = useMemo(() => {
    if (selectedActionId !== null) {
      const action = actions.find(a => a.id === selectedActionId);
      if (action) {
        try {
          return JSON.parse(action.state) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
    if (!selectedSnapshot) return null;
    try {
      return JSON.parse(selectedSnapshot.state) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [selectedActionId, actions, selectedSnapshot]);

  const refresh = useCallback(() => {
    if (!selectedDeviceId || !selectedStore) return;
    sendCommand(selectedDeviceId, {
      type: 'stateGet',
      storeName: selectedStore,
    });
  }, [selectedDeviceId, selectedStore]);

  const clearState = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.state.clear(selectedDeviceId);
  }, [selectedDeviceId]);

  return {
    capabilities,
    snapshots,
    actions,
    selectedStore,
    selectedActionId,
    displayState,
    searchQuery,
    setSelectedStore,
    setSelectedActionId,
    setSearchQuery,
    refresh,
    clearState,
  };
};
