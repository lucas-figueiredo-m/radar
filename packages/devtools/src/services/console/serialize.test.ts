import { describe, it, expect } from 'vitest';
import { serialize } from './serialize';

describe('serialize', () => {
  it('returns null for null', () => {
    expect(serialize(null)).toBeNull();
  });

  it('returns Undefined marker for undefined', () => {
    expect(serialize(undefined)).toEqual({ __type: 'Undefined' });
  });

  it('returns strings as-is', () => {
    expect(serialize('hello')).toBe('hello');
  });

  it('returns numbers as-is', () => {
    expect(serialize(42)).toBe(42);
  });

  it('returns booleans as-is', () => {
    expect(serialize(true)).toBe(true);
    expect(serialize(false)).toBe(false);
  });

  it('serializes Error instances with __type, message, and stack', () => {
    const error = new Error('test error');
    const result = serialize(error) as {
      __type: string;
      message: string;
      stack: string | undefined;
    };

    expect(result.__type).toBe('Error');
    expect(result.message).toBe('test error');
    expect(result.stack).toBeDefined();
  });

  it('recursively serializes plain objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = serialize(obj);

    expect(result).toEqual({ a: 1, b: { c: 2 } });
  });

  it('recursively serializes arrays', () => {
    const arr = [1, 'two', { three: 3 }];
    const result = serialize(arr);

    expect(result).toEqual([1, 'two', { three: 3 }]);
  });

  it('returns BigInt marker for BigInt values', () => {
    expect(serialize(BigInt(123))).toEqual({ __type: 'BigInt', value: '123n' });
  });

  it('returns Function marker for functions', () => {
    const fn = () => 'hello';
    expect(serialize(fn)).toEqual({ __type: 'Function', name: 'fn' });
  });

  it('returns Function marker with "anonymous" for unnamed functions', () => {
    expect(serialize(() => {})).toEqual({
      __type: 'Function',
      name: 'anonymous',
    });
  });

  it('returns Function marker for named functions', () => {
    function greet() {
      return 'hi';
    }
    expect(serialize(greet)).toEqual({ __type: 'Function', name: 'greet' });
  });

  it('returns Circular marker with keys for circular references', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(serialize(circular)).toEqual({
      self: { __type: 'Circular', keys: ['self'] },
    });
  });

  it('returns Symbol marker for symbols', () => {
    expect(serialize(Symbol('foo'))).toEqual({
      __type: 'Symbol',
      description: 'foo',
    });
  });

  it('returns Symbol marker with empty description for symbols without description', () => {
    expect(serialize(Symbol())).toEqual({ __type: 'Symbol', description: '' });
  });

  it('preserves function values inside objects', () => {
    const obj = { handler: () => {}, name: 'test' };
    expect(serialize(obj)).toEqual({
      handler: { __type: 'Function', name: 'handler' },
      name: 'test',
    });
  });

  it('preserves undefined values inside objects', () => {
    const obj = { missing: undefined, present: null };
    expect(serialize(obj)).toEqual({
      missing: { __type: 'Undefined' },
      present: null,
    });
  });

  it('preserves symbol values inside objects', () => {
    const obj = { id: Symbol('unique') };
    expect(serialize(obj)).toEqual({
      id: { __type: 'Symbol', description: 'unique' },
    });
  });

  it('preserves bigint values inside objects', () => {
    const obj = { count: BigInt(42) };
    expect(serialize(obj)).toEqual({
      count: { __type: 'BigInt', value: '42n' },
    });
  });

  it('handles nested circular references with keys', () => {
    const a: Record<string, unknown> = { name: 'a' };
    const b: Record<string, unknown> = { name: 'b', ref: a };
    a.ref = b;

    const result = serialize(a) as Record<string, unknown>;
    expect(result).toEqual({
      name: 'a',
      ref: {
        name: 'b',
        ref: { __type: 'Circular', keys: ['name', 'ref'] },
      },
    });
  });

  it('serializes React elements with props, key, and ref', () => {
    const element = {
      $$typeof: Symbol.for('react.element'),
      type: 'div',
      props: { children: 'hello' },
      key: null,
      ref: null,
    };
    expect(serialize(element)).toEqual({
      __type: 'ReactElement',
      name: 'div',
      props: { children: 'hello' },
      key: null,
      ref: null,
    });
  });

  it('serializes React elements with function type and props', () => {
    const MyComponent = () => null;
    const element = {
      $$typeof: Symbol.for('react.element'),
      type: MyComponent,
      props: { title: 'test', count: 5 },
      key: 'item-1',
      ref: null,
    };
    expect(serialize(element)).toEqual({
      __type: 'ReactElement',
      name: 'MyComponent',
      props: { title: 'test', count: 5 },
      key: 'item-1',
      ref: null,
    });
  });

  it('recursively serializes non-JSON-safe values in React element props', () => {
    const element = {
      $$typeof: Symbol.for('react.element'),
      type: 'View',
      props: { onPress: () => {}, style: { flex: 1 } },
      key: null,
      ref: null,
    };
    const result = serialize(element) as Record<string, unknown>;
    expect(result).toEqual({
      __type: 'ReactElement',
      name: 'View',
      props: {
        onPress: { __type: 'Function', name: 'onPress' },
        style: { flex: 1 },
      },
      key: null,
      ref: null,
    });
  });

  it('handles deeply nested mixed types', () => {
    const obj = {
      fn: () => {},
      data: {
        sym: Symbol('x'),
        nested: {
          big: BigInt(1),
          undef: undefined,
        },
      },
    };
    expect(serialize(obj)).toEqual({
      fn: { __type: 'Function', name: 'fn' },
      data: {
        sym: { __type: 'Symbol', description: 'x' },
        nested: {
          big: { __type: 'BigInt', value: '1n' },
          undef: { __type: 'Undefined' },
        },
      },
    });
  });

  it('handles arrays with non-JSON-safe values', () => {
    const arr = [1, undefined, () => {}, Symbol('s'), BigInt(5)];
    expect(serialize(arr)).toEqual([
      1,
      { __type: 'Undefined' },
      { __type: 'Function', name: 'anonymous' },
      { __type: 'Symbol', description: 's' },
      { __type: 'BigInt', value: '5n' },
    ]);
  });

  it('returns dehydrated Object marker when depth is exceeded', () => {
    const deep = { a: { b: { c: { d: { e: { f: 'too deep' } } } } } };
    const result = serialize(deep) as Record<string, unknown>;
    const level5 = (
      (
        ((result.a as Record<string, unknown>).b as Record<string, unknown>)
          .c as Record<string, unknown>
      ).d as Record<string, unknown>
    ).e;
    expect(level5).toEqual({ __type: 'Object', preview: '{...}' });
  });

  it('returns dehydrated Array marker when depth is exceeded', () => {
    const deep = { a: { b: { c: { d: { e: [1, 2, 3] } } } } };
    const result = serialize(deep) as Record<string, unknown>;
    const level5 = (
      (
        ((result.a as Record<string, unknown>).b as Record<string, unknown>)
          .c as Record<string, unknown>
      ).d as Record<string, unknown>
    ).e;
    expect(level5).toEqual({ __type: 'Array', length: 3 });
  });

  it('serializes Date objects as plain objects', () => {
    const date = new Date('2026-01-01');
    const result = serialize(date);
    expect(result).toEqual({});
  });

  it('serializes RegExp as plain object', () => {
    const regex = /foo/gi;
    const result = serialize(regex);
    expect(result).toEqual({});
  });
});
