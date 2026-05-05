import { describe, it, expect } from 'vitest';
import { verifyOrigin } from './verifyOrigin';

describe('verifyOrigin', () => {
  it('accepts an empty origin (native non-browser client)', () => {
    expect(verifyOrigin('', 'localhost:8347')).toBe(true);
  });

  it('accepts an origin whose host matches the request host (React Native auto-origin)', () => {
    expect(verifyOrigin('http://localhost:8347', 'localhost:8347')).toBe(true);
  });

  it('accepts a LAN-IP origin matching the request host (real device on wifi)', () => {
    expect(verifyOrigin('http://192.168.1.42:8347', '192.168.1.42:8347')).toBe(
      true,
    );
  });

  it('accepts an IPv6 loopback origin matching the request host', () => {
    expect(verifyOrigin('http://[::1]:8347', '[::1]:8347')).toBe(true);
  });

  it('rejects a public-domain origin (browser tab on evil.com)', () => {
    expect(verifyOrigin('https://evil.com', 'localhost:8347')).toBe(false);
  });

  it('rejects a same-host origin on a different port (browser tab on localhost:3000)', () => {
    expect(verifyOrigin('http://localhost:3000', 'localhost:8347')).toBe(false);
  });

  it('rejects when origin loopback alias does not match request host (localhost vs 127.0.0.1)', () => {
    expect(verifyOrigin('http://localhost:8347', '127.0.0.1:8347')).toBe(false);
  });

  it('rejects a malformed origin string', () => {
    expect(verifyOrigin('not-a-url', 'localhost:8347')).toBe(false);
  });

  it('rejects when host header is missing', () => {
    expect(verifyOrigin('http://localhost:8347', undefined)).toBe(false);
  });
});
