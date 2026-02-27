import { describe, it, expect } from 'vitest';
import { serializeValue } from './serializeValue';

describe('serializeValue', () => {
  describe('primitives', () => {
    it('serializes null', () => {
      expect(serializeValue(null)).toEqual({ type: 'primitive', value: null });
    });

    it('serializes undefined', () => {
      expect(serializeValue(undefined)).toEqual({
        type: 'primitive',
        value: undefined,
      });
    });

    it('serializes booleans', () => {
      expect(serializeValue(true)).toEqual({ type: 'primitive', value: true });
      expect(serializeValue(false)).toEqual({
        type: 'primitive',
        value: false,
      });
    });

    it('serializes numbers', () => {
      expect(serializeValue(42)).toEqual({ type: 'primitive', value: 42 });
      expect(serializeValue(3.14)).toEqual({ type: 'primitive', value: 3.14 });
    });
  });

  describe('strings', () => {
    it('serializes short strings', () => {
      expect(serializeValue('hello')).toEqual({
        type: 'string',
        value: 'hello',
      });
    });

    it('truncates strings longer than 500 chars', () => {
      const long = 'a'.repeat(600);
      const result = serializeValue(long);
      expect(result).toEqual({
        type: 'string',
        value: 'a'.repeat(500),
        truncated: true,
      });
    });

    it('does not truncate strings at exactly 500 chars', () => {
      const exact = 'b'.repeat(500);
      const result = serializeValue(exact);
      expect(result).toEqual({ type: 'string', value: exact });
    });
  });

  describe('functions', () => {
    it('serializes named functions', () => {
      const myFunc = () => {};
      expect(serializeValue(myFunc)).toEqual({
        type: 'function',
        name: 'myFunc',
      });
    });

    it('serializes anonymous functions', () => {
      expect(serializeValue(Function())).toEqual({
        type: 'function',
        name: 'anonymous',
      });
    });
  });

  describe('symbols', () => {
    it('serializes symbols with description', () => {
      expect(serializeValue(Symbol('test'))).toEqual({
        type: 'symbol',
        description: 'test',
      });
    });

    it('serializes symbols without description', () => {
      expect(serializeValue(Symbol())).toEqual({
        type: 'symbol',
        description: '',
      });
    });
  });

  describe('React elements', () => {
    it('serializes elements with string type', () => {
      const element = { $$typeof: Symbol.for('react.element'), type: 'div' };
      expect(serializeValue(element)).toEqual({
        type: 'element',
        elementType: 'div',
      });
    });

    it('serializes elements with function type', () => {
      const MyComponent = () => null;
      const element = {
        $$typeof: Symbol.for('react.element'),
        type: MyComponent,
      };
      expect(serializeValue(element)).toEqual({
        type: 'element',
        elementType: 'MyComponent',
      });
    });

    it('serializes forwardRef elements', () => {
      const element = {
        $$typeof: Symbol.for('react.element'),
        type: {
          $$typeof: Symbol.for('react.forward_ref'),
          render: () => null,
        },
      };
      expect(serializeValue(element)).toEqual({
        type: 'element',
        elementType: 'ForwardRef',
      });
    });

    it('serializes memo elements', () => {
      const element = {
        $$typeof: Symbol.for('react.element'),
        type: {
          $$typeof: Symbol.for('react.memo'),
          type: () => null,
        },
      };
      expect(serializeValue(element)).toEqual({
        type: 'element',
        elementType: 'Memo',
      });
    });

    it('falls back to Unknown for unrecognized element type', () => {
      const element = { $$typeof: Symbol.for('react.element'), type: 123 };
      expect(serializeValue(element)).toEqual({
        type: 'element',
        elementType: 'Unknown',
      });
    });
  });

  describe('arrays', () => {
    it('serializes arrays with items', () => {
      const result = serializeValue([1, 'two', true]);
      expect(result).toEqual({
        type: 'array',
        length: 3,
        items: [
          { type: 'primitive', value: 1 },
          { type: 'string', value: 'two' },
          { type: 'primitive', value: true },
        ],
      });
    });

    it('dehydrates arrays beyond max depth', () => {
      const result = serializeValue([1, 2, 3], 0);
      expect(result).toEqual({ type: 'array', length: 3, dehydrated: true });
    });

    it('limits array items to 50', () => {
      const big = Array.from({ length: 100 }, (_, i) => i);
      const result = serializeValue(big);
      expect(result.type).toBe('array');
      if (result.type === 'array') {
        expect(result.length).toBe(100);
        expect(result.items?.length).toBe(50);
      }
    });
  });

  describe('objects', () => {
    it('serializes objects with entries', () => {
      const result = serializeValue({ a: 1, b: 'two' });
      expect(result).toEqual({
        type: 'object',
        preview: '{a, b}',
        entries: [
          { key: 'a', value: { type: 'primitive', value: 1 } },
          { key: 'b', value: { type: 'string', value: 'two' } },
        ],
      });
    });

    it('sorts object keys alphabetically', () => {
      const result = serializeValue({ z: 1, a: 2, m: 3 });
      if (result.type === 'object' && result.entries) {
        expect(result.entries.map(e => e.key)).toEqual(['a', 'm', 'z']);
      }
    });

    it('dehydrates objects beyond max depth', () => {
      const result = serializeValue({ a: 1 }, 0);
      expect(result).toEqual({
        type: 'object',
        preview: '{...}',
        dehydrated: true,
      });
    });

    it('shows preview with first 3 keys', () => {
      const result = serializeValue({ a: 1, b: 2, c: 3, d: 4 });
      if (result.type === 'object') {
        expect(result.preview).toBe('{a, b, c, ...}');
      }
    });
  });

  describe('circular references', () => {
    it('detects circular objects', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;
      const result = serializeValue(obj);
      if (result.type === 'object' && result.entries) {
        const selfEntry = result.entries.find(e => e.key === 'self');
        expect(selfEntry?.value).toEqual({ type: 'circular' });
      }
    });

    it('detects circular arrays', () => {
      const arr: unknown[] = [1];
      arr.push(arr);
      const result = serializeValue(arr);
      if (result.type === 'array' && result.items) {
        expect(result.items[1]).toEqual({ type: 'circular' });
      }
    });
  });

  describe('depth limiting', () => {
    it('serializes nested objects up to max depth', () => {
      const result = serializeValue({ nested: { deep: 'value' } }, 2);
      expect(result).toEqual({
        type: 'object',
        preview: '{nested}',
        entries: [
          {
            key: 'nested',
            value: {
              type: 'object',
              preview: '{deep}',
              entries: [
                { key: 'deep', value: { type: 'string', value: 'value' } },
              ],
            },
          },
        ],
      });
    });

    it('dehydrates objects at max depth', () => {
      const result = serializeValue({ nested: { deep: 'value' } }, 1);
      if (result.type === 'object' && result.entries) {
        expect(result.entries[0].value).toEqual({
          type: 'object',
          preview: '{...}',
          dehydrated: true,
        });
      }
    });
  });
});
