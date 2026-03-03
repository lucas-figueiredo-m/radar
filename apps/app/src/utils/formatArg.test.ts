import { describe, it, expect } from 'vitest';
import { formatArg } from './formatArg';

describe('formatArg', () => {
  it('returns "null" for null', () => {
    expect(formatArg(null)).toBe('null');
  });

  it('returns "undefined" for undefined', () => {
    expect(formatArg(undefined)).toBe('undefined');
  });

  it('returns strings as-is', () => {
    expect(formatArg('')).toBe('');
    expect(formatArg('hello')).toBe('hello');
    expect(formatArg('with spaces')).toBe('with spaces');
  });

  it('stringifies numbers', () => {
    expect(formatArg(0)).toBe('0');
    expect(formatArg(42)).toBe('42');
    expect(formatArg(-1)).toBe('-1');
    expect(formatArg(3.14)).toBe('3.14');
  });

  it('stringifies booleans', () => {
    expect(formatArg(true)).toBe('true');
    expect(formatArg(false)).toBe('false');
  });

  it('formats Error objects with stack', () => {
    const err = { __type: 'Error', message: 'boom', stack: 'at line 1' };
    expect(formatArg(err)).toBe('Error: boom\nat line 1');
  });

  it('formats Error objects without stack', () => {
    const err = { __type: 'Error', message: 'boom' };
    expect(formatArg(err)).toBe('Error: boom');
  });

  it('JSON-stringifies plain objects', () => {
    const obj = { a: 1, b: 'two' };
    expect(formatArg(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  it('JSON-stringifies arrays', () => {
    const arr = [1, 'two', true];
    expect(formatArg(arr)).toBe(JSON.stringify(arr, null, 2));
  });

  it('falls back to String() for circular references', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatArg(circular)).toBe('[object Object]');
  });

  it('formats Function marker', () => {
    expect(formatArg({ __type: 'Function', name: 'handleClick' })).toBe(
      'ƒ handleClick()',
    );
  });

  it('formats Symbol marker', () => {
    expect(formatArg({ __type: 'Symbol', description: 'foo' })).toBe(
      'Symbol(foo)',
    );
  });

  it('formats BigInt marker', () => {
    expect(formatArg({ __type: 'BigInt', value: '123n' })).toBe('123n');
  });

  it('formats Undefined marker', () => {
    expect(formatArg({ __type: 'Undefined' })).toBe('undefined');
  });

  it('formats Circular marker without keys', () => {
    expect(formatArg({ __type: 'Circular', keys: [] })).toBe('[Circular]');
  });

  it('formats Circular marker with keys', () => {
    expect(formatArg({ __type: 'Circular', keys: ['name', 'children'] })).toBe(
      '[Circular: {name, children}]',
    );
  });

  it('formats ReactElement marker without props', () => {
    expect(
      formatArg({ __type: 'ReactElement', name: 'MyButton', props: {} }),
    ).toBe('<MyButton />');
  });

  it('formats ReactElement marker with props', () => {
    expect(
      formatArg({
        __type: 'ReactElement',
        name: 'MyButton',
        props: { title: 'Click' },
      }),
    ).toBe('<MyButton props={...} />');
  });

  it('formats dehydrated Object marker', () => {
    expect(formatArg({ __type: 'Object', preview: '{...}' })).toBe('{...}');
  });

  it('formats dehydrated Array marker', () => {
    expect(formatArg({ __type: 'Array', length: 5 })).toBe('Array(5)');
  });
});
