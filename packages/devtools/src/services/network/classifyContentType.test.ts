import { describe, it, expect } from 'vitest';
import { classifyContentType } from './classifyContentType';

describe('classifyContentType', () => {
  it('returns json for application/json', () => {
    expect(classifyContentType('application/json')).toBe('json');
  });

  it('returns json for +json suffix', () => {
    expect(classifyContentType('application/vnd.api+json')).toBe('json');
  });

  it('returns json for undefined', () => {
    expect(classifyContentType(undefined)).toBe('json');
  });

  it('returns image for image types', () => {
    expect(classifyContentType('image/png')).toBe('image');
    expect(classifyContentType('image/jpeg')).toBe('image');
    expect(classifyContentType('image/svg+xml')).toBe('image');
  });

  it('returns html for text/html', () => {
    expect(classifyContentType('text/html; charset=utf-8')).toBe('html');
  });

  it('returns pdf for application/pdf', () => {
    expect(classifyContentType('application/pdf')).toBe('pdf');
  });

  it('returns text for text types', () => {
    expect(classifyContentType('text/plain')).toBe('text');
    expect(classifyContentType('text/css')).toBe('text');
    expect(classifyContentType('application/xml')).toBe('text');
    expect(classifyContentType('application/javascript')).toBe('text');
  });

  it('returns binary for octet-stream', () => {
    expect(classifyContentType('application/octet-stream')).toBe('binary');
    expect(classifyContentType('application/zip')).toBe('binary');
  });
});
