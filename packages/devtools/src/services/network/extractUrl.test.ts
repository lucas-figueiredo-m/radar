import { describe, it, expect } from 'vitest';
import { extractUrl } from './extractUrl';

describe('extractUrl', () => {
  it('returns string input as-is', () => {
    expect(extractUrl('https://example.com')).toBe('https://example.com');
  });

  it('converts URL object to string', () => {
    const url = new URL('https://example.com/path');
    expect(extractUrl(url)).toBe('https://example.com/path');
  });

  it('extracts url property from Request-like object', () => {
    const request = new Request('https://example.com/api');
    expect(extractUrl(request)).toBe('https://example.com/api');
  });
});
