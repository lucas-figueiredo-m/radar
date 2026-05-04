import type { GraphQLInfo } from '@radar/types';

export type NetworkEntry = {
  id: string;
  method: string;
  url: string;
  graphql?: GraphQLInfo;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  timestamp: number;
  pending: boolean;
  deviceId: string;
};
