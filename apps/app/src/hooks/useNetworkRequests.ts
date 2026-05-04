import { useCallback, useMemo, useState } from 'react';
import type { NetworkRequestRow } from '@radar/database';
import { databaseClient } from '../services';
import type { NetworkEntry } from '../types';
import { useDatabaseSubscription } from './useDatabaseSubscription';

const rowToNetworkEntry = (row: NetworkRequestRow): NetworkEntry => ({
  id: row.id,
  method: row.method,
  url: row.url,
  graphql:
    row.graphql_type && row.graphql_name
      ? { operationType: row.graphql_type, operationName: row.graphql_name }
      : undefined,
  status: row.status ?? undefined,
  statusText: row.status_text ?? undefined,
  duration: row.duration ?? undefined,
  requestHeaders: row.request_headers
    ? (JSON.parse(row.request_headers) as Record<string, string>)
    : undefined,
  requestBody: row.request_body ? JSON.parse(row.request_body) : undefined,
  responseHeaders: row.response_headers
    ? (JSON.parse(row.response_headers) as Record<string, string>)
    : undefined,
  responseBody: row.response_body ? JSON.parse(row.response_body) : undefined,
  timestamp: row.timestamp,
  pending: row.pending === 1,
  deviceId: row.device_id,
});

export const useNetworkRequests = (selectedDeviceId: string | null) => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const queryFn = useCallback(
    (deviceId: string) => databaseClient.network.query({ device_id: deviceId }),
    [],
  );

  const { data: rows, refetch } = useDatabaseSubscription(
    'radar:db:network:changed',
    selectedDeviceId,
    queryFn,
    [] as NetworkRequestRow[],
  );

  const requests = useMemo(() => rows.map(rowToNetworkEntry), [rows]);

  const clearRequests = useCallback(async () => {
    if (!selectedDeviceId) return;
    await databaseClient.network.clear(selectedDeviceId);
    setSelectedRequest(null);
    refetch();
  }, [selectedDeviceId, refetch]);

  return {
    requests,
    selectedRequest,
    setSelectedRequest,
    clearRequests,
  };
};
