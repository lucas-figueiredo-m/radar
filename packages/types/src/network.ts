export type GraphQLInfo = {
  operationType: 'query' | 'mutation';
  operationName?: string;
};

export type NetworkMessage = {
  type: 'network';
  id: string;
  event: 'request' | 'response';
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  graphql?: GraphQLInfo;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  duration?: number;
  timestamp: number;
};
