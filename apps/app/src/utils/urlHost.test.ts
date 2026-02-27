import { describe, it, expect } from 'vitest';
import { urlHost } from './urlHost';

describe('urlHost', () => {
  it('extracts host from valid URL', () => {
    expect(urlHost('https://example.com/path')).toBe('example.com');
  });

  it('includes port when present', () => {
    expect(urlHost('http://localhost:3000/api')).toBe('localhost:3000');
  });

  it('strips path and query', () => {
    expect(urlHost('https://api.example.com/v1/users?id=1')).toBe(
      'api.example.com',
    );
  });

  it('returns empty string for invalid URL', () => {
    expect(urlHost('not-a-url')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(urlHost('')).toBe('');
  });
});
