import { describe, it, expect } from 'vitest';
import { parseRequestBody } from './parseRequestBody';

describe('parseRequestBody', () => {
  it('returns undefined for null', () => {
    expect(parseRequestBody(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseRequestBody(undefined)).toBeUndefined();
  });

  it('parses JSON string into object', () => {
    const body = JSON.stringify({ key: 'value' });
    expect(parseRequestBody(body)).toEqual({ key: 'value' });
  });

  it('returns non-JSON string as-is', () => {
    expect(parseRequestBody('plain text')).toBe('plain text');
  });

  it('returns placeholder for binary/FormData', () => {
    const blob = new Blob(['data']);
    expect(parseRequestBody(blob)).toBe('[Binary/FormData]');
  });
});
