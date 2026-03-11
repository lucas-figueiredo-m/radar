import type { RadarMessage } from '@radar/types';
import { generateRequestId } from './requestId';
import { parseRawHeaders } from './parseRawHeaders';
import { parseRequestBody } from './parseRequestBody';
import { detectGraphQL } from './detectGraphQL';
import { fetchFlag } from './fetchFlag';
import { classifyContentType } from './classifyContentType';
import { formatBytes } from './formatBytes';

type Send = (message: RadarMessage) => void;

type RequestMetadata = {
  id: string;
  method: string;
  url: string;
  startTime: number;
  requestHeaders: Record<string, string>;
  requestBody: BodyInit | null | undefined;
};

const MAX_TEXT_LENGTH = 50_000;

const xhrMetadata = new WeakMap<XMLHttpRequest, RequestMetadata>();

const parseXHRResponseBody = (
  xhr: XMLHttpRequest,
  contentType: string | undefined,
): unknown => {
  const category = classifyContentType(contentType);

  if (category === 'image' || category === 'pdf' || category === 'binary') {
    const size = xhr.response
      ? formatBytes((xhr.response as ArrayBuffer).byteLength ?? 0)
      : 'unknown size';
    return `[Binary: ${contentType ?? category}, ${size}]`;
  }

  try {
    const text =
      typeof xhr.responseText === 'string'
        ? xhr.responseText
        : String(xhr.response ?? '');

    try {
      return JSON.parse(text);
    } catch {
      return text.length > MAX_TEXT_LENGTH
        ? text.slice(0, MAX_TEXT_LENGTH) + '...'
        : text;
    }
  } catch {
    return '[Could not read body]';
  }
};

export const patchXHR = (send: Send) => {
  const XHR = globalThis.XMLHttpRequest;
  if (!XHR) return;

  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  const originalSetRequestHeader = XHR.prototype.setRequestHeader;

  XHR.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: [boolean?, (string | null)?, (string | null)?]
  ) {
    // Mark XHR instances created inside fetch() so send() can skip them.
    fetchFlag.markIfActive(this);

    const urlStr = typeof url === 'string' ? url : url.toString();

    xhrMetadata.set(this, {
      id: '',
      method: method.toUpperCase(),
      url: urlStr,
      startTime: 0,
      requestHeaders: {},
      requestBody: undefined,
    });

    return originalOpen.call(this, method, urlStr, ...rest);
  };

  XHR.prototype.setRequestHeader = function (name: string, value: string) {
    const metadata = xhrMetadata.get(this);
    if (metadata) {
      metadata.requestHeaders[name.toLowerCase()] = value;
    }

    return originalSetRequestHeader.call(this, name, value);
  };

  XHR.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const metadata = xhrMetadata.get(this);

    // Skip interception if no metadata or if this XHR was created by fetch().
    // patchFetch handles fetch-originated requests with better body parsing.
    if (!metadata || fetchFlag.isFromFetch(this)) {
      return originalSend.call(this, body);
    }

    metadata.id = generateRequestId();
    metadata.startTime = Date.now();
    metadata.requestBody = body as BodyInit | null | undefined;

    const requestBody = parseRequestBody(metadata.requestBody);
    const graphql = detectGraphQL(requestBody);

    send({
      type: 'network',
      id: metadata.id,
      event: 'request',
      method: metadata.method,
      url: metadata.url,
      requestHeaders: metadata.requestHeaders,
      requestBody,
      graphql,
      timestamp: metadata.startTime,
    });

    const handleResponse = () => {
      const duration = Date.now() - metadata.startTime;
      const responseHeaders = parseRawHeaders(this.getAllResponseHeaders());
      const contentType = responseHeaders['content-type'];

      send({
        type: 'network',
        id: metadata.id,
        event: 'response',
        method: metadata.method,
        url: metadata.url,
        status: this.status,
        statusText: this.statusText,
        responseHeaders,
        responseBody: parseXHRResponseBody(this, contentType),
        duration,
        timestamp: Date.now(),
      });
    };

    const handleError = () => {
      const duration = Date.now() - metadata.startTime;

      send({
        type: 'network',
        id: metadata.id,
        event: 'response',
        method: metadata.method,
        url: metadata.url,
        status: 0,
        statusText: 'Network Error',
        duration,
        timestamp: Date.now(),
      });
    };

    this.addEventListener('load', handleResponse);
    this.addEventListener('error', handleError);
    this.addEventListener('timeout', handleError);

    return originalSend.call(this, body);
  };
};
