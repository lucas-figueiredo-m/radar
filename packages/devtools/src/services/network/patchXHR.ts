import type { RadarMessage } from '@radar/types';
import { generateRequestId } from './requestId';
import { parseRawHeaders } from './parseRawHeaders';
import { parseRequestBody } from './parseRequestBody';
import { detectGraphQL } from './detectGraphQL';

type Send = (message: RadarMessage) => void;

type RequestMetadata = {
  id: string;
  method: string;
  url: string;
  startTime: number;
  requestHeaders: Record<string, string>;
  requestBody: BodyInit | null | undefined;
};

const MAX_TEXT_LENGTH = 5000;

type XHRListeners = {
  handleResponse: () => void;
  handleError: () => void;
};

const xhrMetadata = new WeakMap<XMLHttpRequest, RequestMetadata>();
const xhrListeners = new WeakMap<XMLHttpRequest, XHRListeners>();

const readXHRText = (xhr: XMLHttpRequest): string => {
  // In React Native, accessing responseText throws when responseType
  // is not "" or "text". Try responseText first, then fall back to response.
  try {
    if (
      xhr.responseType === '' ||
      xhr.responseType === 'text'
    ) {
      return xhr.responseText;
    }
  } catch {
    // ignored — fall through to response
  }

  const raw = xhr.response;
  if (typeof raw === 'string') return raw;
  if (raw == null) return '';

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
};

const parseXHRResponseBody = (xhr: XMLHttpRequest): unknown => {
  const text = readXHRText(xhr);
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH) + '...'
      : text;
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
    if (!metadata) {
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

      send({
        type: 'network',
        id: metadata.id,
        event: 'response',
        method: metadata.method,
        url: metadata.url,
        status: this.status,
        statusText: this.statusText,
        responseHeaders: parseRawHeaders(this.getAllResponseHeaders()),
        responseBody: parseXHRResponseBody(this),
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

    // Remove previous listeners to avoid duplicates if send() is called
    // multiple times on the same XHR instance (e.g. React Native's fetch polyfill).
    const prev = xhrListeners.get(this);
    if (prev) {
      this.removeEventListener('load', prev.handleResponse);
      this.removeEventListener('error', prev.handleError);
      this.removeEventListener('timeout', prev.handleError);
    }

    xhrListeners.set(this, { handleResponse, handleError });
    this.addEventListener('load', handleResponse);
    this.addEventListener('error', handleError);
    this.addEventListener('timeout', handleError);

    return originalSend.call(this, body);
  };
};
