import { describe, it, expect } from 'vitest';
import { verifyMcpToken } from './verifyMcpToken';

const TOKEN = 'a1b2c3d4-e5f6-7890-abcd-ef0123456789';

describe('verifyMcpToken', () => {
  it('accepts a correct Bearer token', () => {
    expect(verifyMcpToken(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
  });

  it('rejects a missing Authorization header', () => {
    expect(verifyMcpToken(undefined, TOKEN)).toBe(false);
  });

  it('rejects an empty Authorization header', () => {
    expect(verifyMcpToken('', TOKEN)).toBe(false);
  });

  it('rejects a non-Bearer scheme', () => {
    expect(verifyMcpToken(`Basic ${TOKEN}`, TOKEN)).toBe(false);
    expect(verifyMcpToken(`Token ${TOKEN}`, TOKEN)).toBe(false);
  });

  it('rejects "Bearer" with no token value', () => {
    expect(verifyMcpToken('Bearer ', TOKEN)).toBe(false);
  });

  it('rejects a token that differs by one character', () => {
    const wrong = TOKEN.slice(0, -1) + '0';
    expect(verifyMcpToken(`Bearer ${wrong}`, TOKEN)).toBe(false);
  });

  it('rejects a token that is a prefix of the expected token', () => {
    expect(verifyMcpToken(`Bearer ${TOKEN.slice(0, 8)}`, TOKEN)).toBe(false);
  });

  it('rejects a token longer than the expected token', () => {
    expect(verifyMcpToken(`Bearer ${TOKEN}extra`, TOKEN)).toBe(false);
  });

  it('is case-sensitive on the scheme prefix', () => {
    expect(verifyMcpToken(`bearer ${TOKEN}`, TOKEN)).toBe(false);
  });
});
