import { describe, it, expect } from 'vitest';
import { verifyMcpOrigin } from './verifyMcpOrigin';

describe('verifyMcpOrigin', () => {
  it('accepts an undefined origin (native non-browser MCP client)', () => {
    expect(verifyMcpOrigin(undefined)).toBe(true);
  });

  it('accepts an empty origin', () => {
    expect(verifyMcpOrigin('')).toBe(true);
  });

  it('accepts the literal "null" origin (file:// or sandboxed)', () => {
    expect(verifyMcpOrigin('null')).toBe(true);
  });

  it('accepts http://localhost on any port', () => {
    expect(verifyMcpOrigin('http://localhost:3000')).toBe(true);
    expect(verifyMcpOrigin('http://localhost')).toBe(true);
  });

  it('accepts http://127.0.0.1 on any port', () => {
    expect(verifyMcpOrigin('http://127.0.0.1:8348')).toBe(true);
  });

  it('accepts http://[::1] (IPv6 loopback) on any port', () => {
    expect(verifyMcpOrigin('http://[::1]:8348')).toBe(true);
  });

  it('rejects a public-domain origin (browser tab on evil.com)', () => {
    expect(verifyMcpOrigin('https://evil.com')).toBe(false);
  });

  it('rejects a LAN-IP origin (cannot reach loopback bind, but defense-in-depth)', () => {
    expect(verifyMcpOrigin('http://192.168.1.42')).toBe(false);
  });

  it('rejects a malformed origin string', () => {
    expect(verifyMcpOrigin('not-a-url')).toBe(false);
  });
});
