import { useCallback, useMemo, useState } from 'react';
import type {
  ComponentTreeMessage,
  InspectedComponentData,
  InspectComponentResponse,
} from '@radar/types';
import { sendCommand } from '../services';
import type { ComponentTreeState } from '../types';

type StampedMessage = Record<string, unknown> & {
  type: string;
  deviceId: string;
};

export const useComponentTree = (selectedDeviceId: string | null) => {
  const [componentTrees, setComponentTrees] = useState<
    Map<string, ComponentTreeState>
  >(new Map());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [inspectedComponent, setInspectedComponent] =
    useState<InspectedComponentData | null>(null);

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type === 'componentTree') {
        const msg = message as ComponentTreeMessage & { deviceId: string };
        setComponentTrees(prev => {
          const next = new Map(prev);
          next.set(msg.deviceId, {
            rootNodes: msg.rootNodes,
            timestamp: msg.timestamp,
            deviceId: msg.deviceId,
          });
          return next;
        });
      } else if (message.type === 'inspectComponent') {
        const msg = message as InspectComponentResponse & {
          deviceId: string;
        };
        setSelectedComponentId(current => {
          if (msg.componentId === current) {
            setInspectedComponent(msg.data);
          }
          return current;
        });
      }
    },
    [],
  );

  const deviceComponentTree = useMemo(
    () =>
      selectedDeviceId ? componentTrees.get(selectedDeviceId) ?? null : null,
    [componentTrees, selectedDeviceId],
  );

  const clearComponentTree = useCallback(() => {
    if (!selectedDeviceId) return;
    setComponentTrees(prev => {
      const next = new Map(prev);
      next.delete(selectedDeviceId);
      return next;
    });
  }, [selectedDeviceId]);

  const inspectComponentById = useCallback(
    (componentId: string) => {
      if (!selectedDeviceId) return;
      setSelectedComponentId(componentId);
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
    setInspectedComponent(null);
  }, []);

  return {
    componentTree: deviceComponentTree,
    selectedComponentId,
    inspectedComponent,
    clearComponentTree,
    inspectComponent: inspectComponentById,
    clearInspection,
    handleMessage,
  };
};
