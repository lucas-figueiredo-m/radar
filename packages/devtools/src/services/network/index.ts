import type { RadarMessage } from '@radar/types';
import { headersToRecord } from './headersToRecord';
import { extractUrl } from './extractUrl';
import { parseHeaders } from './parseHeaders';
import { parseRequestBody } from './parseRequestBody';
import { parseResponseBody } from './parseResponseBody';
import { generateRequestId } from './requestId';
import { detectGraphQL } from './detectGraphQL';
import { fetchFlag } from './fetchFlag';

export { patchXHR } from './patchXHR';

type Send = (message: RadarMessage) => void;

export const patchFetch = (send: Send) => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const id = generateRequestId();
    const startTime = Date.now();

    const method = init?.method ?? 'GET';
    const url = extractUrl(input);
    const requestHeaders = parseHeaders(init?.headers);
    const requestBody = parseRequestBody(init?.body);
    const graphql = detectGraphQL(requestBody);

    send({
      type: 'network',
      id,
      event: 'request',
      method: method.toUpperCase(),
      url,
      requestHeaders,
      requestBody,
      graphql,
      timestamp: startTime,
    });

    try {
      // Flag is set synchronously around originalFetch so that patchXHR
      // can mark the internal XHR instance created by RN's fetch polyfill.
      fetchFlag.set();
      const responsePromise = originalFetch(input, init);
      fetchFlag.reset();

      const response = await responsePromise;
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
      fetchFlag.reset();
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
