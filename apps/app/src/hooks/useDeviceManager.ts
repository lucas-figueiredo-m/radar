import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CliToolStatus,
  DetectedDevice,
  Device,
  DeviceConnectionStatus,
} from '@radar/types';
import { ipcRenderer } from '../services';

const OFFLINE_REMOVAL_DELAY_MS = 5000;

export const useDeviceManager = () => {
  const [detectedDevices, setDetectedDevices] = useState<DetectedDevice[]>([]);
  const [connectedDeviceIds, setConnectedDeviceIds] = useState<string[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [cliToolStatuses, setCliToolStatuses] = useState<CliToolStatus[]>([]);

  const previousDeviceIdsRef = useRef<Set<string>>(new Set());
  const offlineTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [offlineDeviceIds, setOfflineDeviceIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const onDetectedDevices = (_event: unknown, devices: DetectedDevice[]) => {
      setDetectedDevices(devices);
    };

    const onConnectedDevices = (_event: unknown, deviceIds: string[]) => {
      setConnectedDeviceIds(deviceIds);
    };

    const onCliStatus = (_event: unknown, statuses: CliToolStatus[]) => {
      setCliToolStatuses(statuses);
    };

    ipcRenderer.on('radar:detected-devices', onDetectedDevices);
    ipcRenderer.on('radar:connected-devices', onConnectedDevices);
    ipcRenderer.on('radar:cli-status', onCliStatus);

    ipcRenderer
      .invoke<{ connectedDeviceIds: string[] }>('radar:get-initial-state')
      .then(state => {
        setConnectedDeviceIds(state.connectedDeviceIds);
      })
      .catch((err: unknown) => {
        console.error('[radar] Failed to get initial state:', err);
      });

    return () => {
      ipcRenderer.removeListener('radar:detected-devices', onDetectedDevices);
      ipcRenderer.removeListener('radar:connected-devices', onConnectedDevices);
      ipcRenderer.removeListener('radar:cli-status', onCliStatus);
    };
  }, []);

  useEffect(() => {
    const currentDeviceIds = new Set<string>([
      ...detectedDevices.map(d => d.id),
      ...connectedDeviceIds,
    ]);

    const previousIds = previousDeviceIdsRef.current;

    for (const prevId of previousIds) {
      if (!currentDeviceIds.has(prevId)) {
        if (!offlineTimersRef.current.has(prevId)) {
          setOfflineDeviceIds(prev => {
            const next = new Set(prev);
            next.add(prevId);
            return next;
          });

          const timer = setTimeout(() => {
            setOfflineDeviceIds(prev => {
              const next = new Set(prev);
              next.delete(prevId);
              return next;
            });
            offlineTimersRef.current.delete(prevId);
          }, OFFLINE_REMOVAL_DELAY_MS);

          offlineTimersRef.current.set(prevId, timer);
        }
      } else {
        const existingTimer = offlineTimersRef.current.get(prevId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          offlineTimersRef.current.delete(prevId);
          setOfflineDeviceIds(prev => {
            const next = new Set(prev);
            next.delete(prevId);
            return next;
          });
        }
      }
    }

    previousDeviceIdsRef.current = currentDeviceIds;
  }, [detectedDevices, connectedDeviceIds]);

  useEffect(() => {
    const timers = offlineTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const devices = useMemo<Device[]>(() => {
    const connectedSet = new Set(connectedDeviceIds);
    const detectedMap = new Map<string, DetectedDevice>();
    for (const d of detectedDevices) {
      detectedMap.set(d.id, d);
    }

    const result: Device[] = [];
    const seenIds = new Set<string>();

    for (const detected of detectedDevices) {
      seenIds.add(detected.id);
      const connectionStatus: DeviceConnectionStatus = connectedSet.has(
        detected.id,
      )
        ? 'connected'
        : 'device-only';
      result.push({
        ...detected,
        connectionStatus,
        projectRoot: null,
      });
    }

    for (const connId of connectedDeviceIds) {
      if (!seenIds.has(connId)) {
        seenIds.add(connId);
        result.push({
          id: connId,
          name: connId,
          platform: 'ios',
          osVersion: '',
          connectionStatus: 'connected',
          projectRoot: null,
        });
      }
    }

    for (const offlineId of offlineDeviceIds) {
      if (!seenIds.has(offlineId)) {
        result.push({
          id: offlineId,
          name: offlineId,
          platform: 'ios',
          osVersion: '',
          connectionStatus: 'offline',
          projectRoot: null,
        });
      }
    }

    return result;
  }, [detectedDevices, connectedDeviceIds, offlineDeviceIds]);

  useEffect(() => {
    if (selectedDeviceId !== null) return;

    const connectedDevices = devices.filter(
      d => d.connectionStatus === 'connected',
    );

    if (connectedDevices.length === 1) {
      setSelectedDeviceId(connectedDevices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectDevice = useCallback((id: string) => {
    setSelectedDeviceId(id);
  }, []);

  return {
    devices,
    selectedDeviceId,
    selectDevice,
    cliToolStatuses,
  };
};
