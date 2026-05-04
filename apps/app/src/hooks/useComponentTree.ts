import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentTreeNode, InspectedComponentData } from '@radar/types';
import { databaseClient, ipcRenderer, sendCommand } from '../services';
import type { ComponentTreeState } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

export const useComponentTree = (selectedDeviceId: string | null) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [inspectedComponent, setInspectedComponent] =
    useState<InspectedComponentData | null>(null);
  const selectedComponentIdRef = useRef<string | null>(null);

  const queryFn = useCallback(
    async (deviceId: string): Promise<ComponentTreeState | null> => {
      const row = await databaseClient.componentTree.getLatest(deviceId);
      if (!row) return null;
      return {
        rootNodes: JSON.parse(row.root_nodes) as ComponentTreeNode[],
        timestamp: row.timestamp,
        deviceId: row.device_id,
      };
    },
    [],
  );

  const { data: componentTree, refetch } = useDatabaseSubscription(
    'radar:db:componentTree:changed',
    selectedDeviceId,
    queryFn,
    null as ComponentTreeState | null,
  );

  // Listen for inspected component updates
  useEffect(() => {
    if (!selectedDeviceId) return;

    const handler = (
      _event: unknown,
      payload: { deviceId: string; componentId: string },
    ) => {
      if (payload.deviceId !== selectedDeviceId) return;
      if (payload.componentId !== selectedComponentIdRef.current) return;

      databaseClient.inspectedComponent
        .getByComponentId(selectedDeviceId, payload.componentId)
        .then(row => {
          if (row) {
            setInspectedComponent(
              JSON.parse(row.data) as InspectedComponentData,
            );
          }
        });
    };

    ipcRenderer.on('radar:db:inspectedComponent:changed', handler);
    return () => {
      ipcRenderer.removeListener(
        'radar:db:inspectedComponent:changed',
        handler,
      );
    };
  }, [selectedDeviceId]);

  const clearComponentTree = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.componentTree.clear(selectedDeviceId);
    refetch();
  }, [selectedDeviceId, refetch]);

  const inspectComponentById = useCallback(
    (componentId: string) => {
      if (!selectedDeviceId) return;
      setSelectedComponentId(componentId);
      selectedComponentIdRef.current = componentId;
      sendCommand(selectedDeviceId, {
        type: 'inspectComponent',
        direction: 'request',
        componentId,
      });
    },
    [selectedDeviceId],
  );

  const clearInspection = useCallback(() => {
    setSelectedComponentId(null);
    selectedComponentIdRef.current = null;
    setInspectedComponent(null);
  }, []);

  return {
    componentTree,
    selectedComponentId,
    inspectedComponent,
    clearComponentTree,
    inspectComponent: inspectComponentById,
    clearInspection,
  };
};
