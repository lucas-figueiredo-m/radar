import { describe, it, expect } from 'vitest';
import { headersToRecord } from './headersToRecord';

describe('headersToRecord', () => {
  it('converts Headers to a plain record', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });

    const result = headersToRecord(headers);

    expect(result).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer token',
    });
  });

  it('returns an empty record for empty Headers', () => {
    const headers = new Headers();
    expect(headersToRecord(headers)).toEqual({});
  });

  it('handles duplicate header values by keeping the last one', () => {
    const headers = new Headers();
    headers.append('x-custom', 'first');
    headers.append('x-custom', 'second');

    const result = headersToRecord(headers);

    expect(result['x-custom']).toBe('first, second');
  });
});
