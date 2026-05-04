import { describe, it, expect } from 'vitest';
import { parseHeaders } from './parseHeaders';

describe('parseHeaders', () => {
  it('returns empty object for undefined', () => {
    expect(parseHeaders(undefined)).toEqual({});
  });

  it('converts Headers instance to record', () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    expect(parseHeaders(headers)).toEqual({
      'content-type': 'application/json',
    });
  });

  it('converts array tuples to record', () => {
    const headers: [string, string][] = [
      ['x-custom', 'value1'],
      ['authorization', 'Bearer token'],
    ];
    expect(parseHeaders(headers)).toEqual({
      'x-custom': 'value1',
      authorization: 'Bearer token',
    });
  });

  it('spreads plain record', () => {
    const headers = { accept: 'text/html', 'cache-control': 'no-cache' };
    expect(parseHeaders(headers)).toEqual({
      accept: 'text/html',
      'cache-control': 'no-cache',
    });
  });
});
