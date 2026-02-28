import type { RadarMessage } from '@radar/types';
import { headersToRecord } from './headersToRecord';
import { extractUrl } from './extractUrl';
import { parseHeaders } from './parseHeaders';
import { parseRequestBody } from './parseRequestBody';
import { parseResponseBody } from './parseResponseBody';

type Send = (message: RadarMessage) => void;

let requestIdCounter = 0;

export const patchFetch = (send: Send) => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const id = `req_${requestIdCounter++}`;
    const startTime = Date.now();

    const method = init?.method ?? 'GET';
    const url = extractUrl(input);
    const requestHeaders = parseHeaders(init?.headers);
    const requestBody = parseRequestBody(init?.body);

    send({
      type: 'network',
      id,
      event: 'request',
      method: method.toUpperCase(),
      url,
      requestHeaders,
      requestBody,
      timestamp: startTime,
    });

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;
      const responseBody = await parseResponseBody(response);

      send({
        type: 'network',
        id,
        event: 'response',
        method: method.toUpperCase(),
        url,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: headersToRecord(response.headers),
        responseBody,
        duration,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      send({
        type: 'network',
        id,
        event: 'response',
        method: method.toUpperCase(),
        url,
        status: 0,
        statusText: error instanceof Error ? error.message : 'Network Error',
        duration,
        timestamp: Date.now(),
      });

      throw error;
    }
  };
};
