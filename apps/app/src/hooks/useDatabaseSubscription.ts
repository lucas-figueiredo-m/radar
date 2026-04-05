import { useCallback, useEffect, useRef, useState } from 'react';
import { ipcRenderer } from '../services';

const DEBOUNCE_MS = 80;

export const useDatabaseSubscription = <T>(
  channel: string,
  deviceId: string | null,
  queryFn: (deviceId: string) => Promise<T>,
  defaultValue: T,
  shouldUpdate?: (payload: Record<string, string>) => boolean,
): { data: T; refetch: () => void } => {
  const [data, setData] = useState<T>(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  const shouldUpdateRef = useRef(shouldUpdate);
  shouldUpdateRef.current = shouldUpdate;

  const refetch = useCallback(() => {
    if (!deviceId) return;
    queryFnRef.current(deviceId).then(setData);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) {
      setData(defaultValue);
      return;
    }

    // Initial load
    queryFnRef.current(deviceId).then(setData);

    const handler = (
      _event: unknown,
      payload: { deviceId: string } & Record<string, string>,
    ) => {
      if (payload.deviceId !== deviceId) return;
      if (shouldUpdateRef.current && !shouldUpdateRef.current(payload)) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryFnRef.current(deviceId).then(setData);
      }, DEBOUNCE_MS);
    };

    ipcRenderer.on(channel, handler);

    return () => {
      ipcRenderer.removeListener(channel, handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, deviceId]);

  return { data, refetch };
};
