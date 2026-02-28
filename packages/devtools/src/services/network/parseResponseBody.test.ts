import { describe, it, expect } from 'vitest';
import { parseResponseBody } from './parseResponseBody';

describe('parseResponseBody', () => {
  it('parses JSON body', async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
    expect(await parseResponseBody(response)).toEqual({ ok: true });
  });

  it('returns short text as-is', async () => {
    const response = new Response('hello world');
    expect(await parseResponseBody(response)).toBe('hello world');
  });

  it('truncates text longer than 5000 characters', async () => {
    const longText = 'a'.repeat(6000);
    const response = new Response(longText);
    const result = await parseResponseBody(response);
    expect(result).toBe('a'.repeat(5000) + '...');
  });

  it('returns placeholder when body cannot be read', async () => {
    const response = new Response('data');
    // Override clone to return a Response whose text() rejects
    response.clone = () => {
      const broken = new Response('data');
      broken.text = () => Promise.reject(new Error('stream locked'));
      return broken;
    };
    const result = await parseResponseBody(response);
    expect(result).toBe('[Could not read body]');
  });
});
