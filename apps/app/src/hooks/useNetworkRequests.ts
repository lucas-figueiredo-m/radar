import { useCallback, useMemo, useState } from 'react';
import type { NetworkMessage } from '@radar/types';
import type { NetworkEntry } from '../types';
import { MAX_REQUESTS } from './constants';

type StampedMessage = Record<string, unknown> & {
  type: string;
  deviceId: string;
};
type StampedNetworkMessage = NetworkMessage & { deviceId: string };

export const useNetworkRequests = (selectedDeviceId: string | null) => {
  const [requests, setRequests] = useState<NetworkEntry[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const handleMessage = useCallback(
    (_event: unknown, message: StampedMessage) => {
      if (message.type !== 'network') return;

      const msg = message as StampedNetworkMessage;

      if (msg.event === 'request') {
        setRequests(prev => {
          const next = [
            ...prev,
            {
              id: msg.id,
              method: msg.method,
              url: msg.url,
              graphql: msg.graphql,
              requestHeaders: msg.requestHeaders,
              requestBody: msg.requestBody,
              timestamp: msg.timestamp,
              pending: true,
              deviceId: msg.deviceId,
            },
          ];
          return next.length > MAX_REQUESTS ? next.slice(-MAX_REQUESTS) : next;
        });
      } else if (msg.event === 'response') {
        setRequests(prev =>
          prev.map(r =>
            r.id === msg.id
              ? {
                  ...r,
                  status: msg.status,
                  statusText: msg.statusText,
                  duration: msg.duration,
                  responseHeaders: msg.responseHeaders,
                  responseBody: msg.responseBody,
                  pending: false,
                }
              : r,
          ),
        );
      }
    },
    [],
  );

  const deviceRequests = useMemo(
    () =>
      selectedDeviceId
        ? requests.filter(r => r.deviceId === selectedDeviceId)
        : [],
    [requests, selectedDeviceId],
  );

  const clearRequests = useCallback(() => {
    if (!selectedDeviceId) return;
    setRequests(prev => prev.filter(r => r.deviceId !== selectedDeviceId));
    setSelectedRequest(null);
  }, [selectedDeviceId]);

  return {
    requests: deviceRequests,
    selectedRequest,
    setSelectedRequest,
    clearRequests,
    handleMessage,
  };
};
