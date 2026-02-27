export type NetworkMessage = {
  type: 'network';
  id: string;
  event: 'request' | 'response';
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  duration?: number;
  timestamp: number;
};
