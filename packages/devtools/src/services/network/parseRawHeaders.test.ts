import { describe, it, expect } from 'vitest';
import { parseRawHeaders } from './parseRawHeaders';

describe('parseRawHeaders', () => {
  it('returns empty object for empty string', () => {
    expect(parseRawHeaders('')).toEqual({});
  });

  it('parses single header', () => {
    expect(parseRawHeaders('Content-Type: application/json\r\n')).toEqual({
      'content-type': 'application/json',
    });
  });

  it('parses multiple headers', () => {
    const raw = 'Content-Type: application/json\r\nX-Custom: value\r\n';
    expect(parseRawHeaders(raw)).toEqual({
      'content-type': 'application/json',
      'x-custom': 'value',
    });
  });

  it('handles header values with colons', () => {
    const raw = 'Location: https://example.com:8080/path\r\n';
    expect(parseRawHeaders(raw)).toEqual({
      location: 'https://example.com:8080/path',
    });
  });

  it('trims whitespace from keys and values', () => {
    const raw = '  Content-Type :  text/html  \r\n';
    expect(parseRawHeaders(raw)).toEqual({
      'content-type': 'text/html',
    });
  });
});
