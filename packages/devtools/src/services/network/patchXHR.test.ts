import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RadarMessage } from '@radar/types';
import { patchXHR } from './patchXHR';

type Listener = (event: Event) => void;

const createMockXHR = () => {
  const listeners: Record<string, Listener[]> = {};

  const mockXHR = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    addEventListener: vi.fn((event: string, handler: Listener) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    getAllResponseHeaders: vi.fn(() => 'content-type: application/json\r\n'),
    status: 200,
    statusText: 'OK',
    responseText: '{"id":1}',
    response: '{"id":1}',
    _listeners: listeners,
  };

  return mockXHR;
};

type MockXHR = ReturnType<typeof createMockXHR>;

const createMockXHRClass = () => {
  const MockXMLHttpRequest = vi.fn(() => createMockXHR()) as unknown as {
    new (): MockXHR;
    prototype: {
      open: (...args: Parameters<XMLHttpRequest['open']>) => void;
      send: (body?: Document | XMLHttpRequestBodyInit | null) => void;
      setRequestHeader: (name: string, value: string) => void;
    };
  };

  MockXMLHttpRequest.prototype = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
  };

  return MockXMLHttpRequest;
};

describe('patchXHR', () => {
  let send: ReturnType<typeof vi.fn<(message: RadarMessage) => void>>;
  let MockXMLHttpRequest: ReturnType<typeof createMockXHRClass>;

  beforeEach(() => {
    send = vi.fn();
    MockXMLHttpRequest = createMockXHRClass();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as Record<string, any>).XMLHttpRequest = MockXMLHttpRequest;
  });

  it('patches open, send, and setRequestHeader', () => {
    const originalOpen = MockXMLHttpRequest.prototype.open;
    const originalSend = MockXMLHttpRequest.prototype.send;
    const originalSetRequestHeader =
      MockXMLHttpRequest.prototype.setRequestHeader;

    patchXHR(send);

    expect(MockXMLHttpRequest.prototype.open).not.toBe(originalOpen);
    expect(MockXMLHttpRequest.prototype.send).not.toBe(originalSend);
    expect(MockXMLHttpRequest.prototype.setRequestHeader).not.toBe(
      originalSetRequestHeader,
    );
  });

  it('sends request event on send()', () => {
    patchXHR(send);

    const xhr = createMockXHR();
    MockXMLHttpRequest.prototype.open.call(
      xhr,
      'GET',
      'https://example.com/api',
    );
    MockXMLHttpRequest.prototype.send.call(xhr);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'network',
        event: 'request',
        method: 'GET',
        url: 'https://example.com/api',
      }),
    );
  });

  it('sends response event on load', () => {
    patchXHR(send);

    const xhr = createMockXHR();
    MockXMLHttpRequest.prototype.open.call(
      xhr,
      'POST',
      'https://example.com/api',
    );
    MockXMLHttpRequest.prototype.send.call(
      xhr,
      JSON.stringify({ title: 'test' }),
    );

    const loadHandler = xhr._listeners['load']?.[0];
    expect(loadHandler).toBeDefined();
    loadHandler(new Event('load'));

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'network',
        event: 'response',
        method: 'POST',
        url: 'https://example.com/api',
        status: 200,
        statusText: 'OK',
        responseBody: { id: 1 },
      }),
    );
  });

  it('sends error response on error event', () => {
    patchXHR(send);

    const xhr = createMockXHR();
    MockXMLHttpRequest.prototype.open.call(
      xhr,
      'GET',
      'https://example.com/fail',
    );
    MockXMLHttpRequest.prototype.send.call(xhr);

    const errorHandler = xhr._listeners['error']?.[0];
    expect(errorHandler).toBeDefined();
    errorHandler(new Event('error'));

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'network',
        event: 'response',
        status: 0,
        statusText: 'Network Error',
      }),
    );
  });

  it('captures request headers via setRequestHeader', () => {
    patchXHR(send);

    const xhr = createMockXHR();
    MockXMLHttpRequest.prototype.open.call(
      xhr,
      'POST',
      'https://example.com/api',
    );
    MockXMLHttpRequest.prototype.setRequestHeader.call(
      xhr,
      'Content-Type',
      'application/json',
    );
    MockXMLHttpRequest.prototype.send.call(xhr, '{}');

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'request',
        requestHeaders: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
  });

  it('does nothing if XMLHttpRequest is not available', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as Record<string, any>).XMLHttpRequest;
    expect(() => patchXHR(send)).not.toThrow();
  });
});
