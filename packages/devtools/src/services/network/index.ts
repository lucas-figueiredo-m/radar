import type { RadarMessage } from '@radar/types';
import { headersToRecord } from './headersToRecord';

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
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as { url: string }).url;

    let requestHeaders: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        requestHeaders = headersToRecord(init.headers);
      } else if (Array.isArray(init.headers)) {
        for (const [key, value] of init.headers) {
          requestHeaders[key] = value;
        }
      } else {
        requestHeaders = { ...init.headers } as Record<string, string>;
      }
    }

    let requestBody: unknown = undefined;
    if (init?.body) {
      if (typeof init.body === 'string') {
        try {
          requestBody = JSON.parse(init.body);
        } catch {
          requestBody = init.body;
        }
      } else {
        requestBody = '[Binary/FormData]';
      }
    }

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

      const clone = response.clone();
      let responseBody: unknown;
      try {
        const text = await clone.text();
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody =
            text.length > 5000 ? text.slice(0, 5000) + '...' : text;
        }
      } catch {
        responseBody = '[Could not read body]';
      }

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
