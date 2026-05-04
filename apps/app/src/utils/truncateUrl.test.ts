import { describe, it, expect } from 'vitest';
import { truncateUrl } from './truncateUrl';

describe('truncateUrl', () => {
  it('extracts path from valid URL', () => {
    expect(truncateUrl('https://example.com/api/users')).toBe('/api/users');
  });

  it('includes query string', () => {
    expect(truncateUrl('https://example.com/api?q=test')).toBe('/api?q=test');
  });

  it('returns "/" for host-only URL', () => {
    expect(truncateUrl('https://example.com')).toBe('/');
  });

  it('truncates at >60 chars with "..."', () => {
    const longPath = '/api/' + 'a'.repeat(60);
    const url = `https://example.com${longPath}`;
    const result = truncateUrl(url);
    expect(result).toHaveLength(63);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('does NOT truncate at exactly 60 chars', () => {
    const path = '/' + 'a'.repeat(59);
    const url = `https://example.com${path}`;
    const result = truncateUrl(url);
    expect(result).toBe(path);
    expect(result).toHaveLength(60);
  });

  it('returns invalid URL as-is when short', () => {
    expect(truncateUrl('not-a-url')).toBe('not-a-url');
  });

  it('truncates invalid URL when long', () => {
    const longInvalid = 'not-a-url/' + 'x'.repeat(60);
    const result = truncateUrl(longInvalid);
    expect(result).toHaveLength(63);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('handles trailing slash', () => {
    expect(truncateUrl('https://example.com/')).toBe('/');
  });
});
