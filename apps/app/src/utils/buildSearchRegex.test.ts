import { describe, it, expect } from 'vitest';
import { buildSearchRegex } from './buildSearchRegex';

describe('buildSearchRegex', () => {
  it('returns null for empty string', () => {
    expect(buildSearchRegex('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(buildSearchRegex('   ')).toBeNull();
  });

  it('creates case-insensitive regex for plain text', () => {
    const regex = buildSearchRegex('Button');
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.test('Button')).toBe(true);
    expect(regex!.test('button')).toBe(true);
    expect(regex!.test('MyButton')).toBe(true);
    expect(regex!.test('Checkbox')).toBe(false);
  });

  it('escapes special regex characters in plain text', () => {
    const regex = buildSearchRegex('foo.bar');
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.test('foo.bar')).toBe(true);
    expect(regex!.test('fooXbar')).toBe(false);
  });

  it('parses regex delimiters', () => {
    const regex = buildSearchRegex('/^App$/');
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.test('App')).toBe(true);
    expect(regex!.test('MyApp')).toBe(false);
  });

  it('parses regex with flags', () => {
    const regex = buildSearchRegex('/button/i');
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.test('Button')).toBe(true);
    expect(regex!.test('BUTTON')).toBe(true);
  });

  it('returns null for invalid regex', () => {
    expect(buildSearchRegex('/[invalid/')).toBeNull();
  });

  it('escapes parentheses in plain text', () => {
    const regex = buildSearchRegex('App()');
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.test('App()')).toBe(true);
    expect(regex!.test('App')).toBe(false);
  });
});
