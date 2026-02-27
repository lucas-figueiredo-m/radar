import type { SerializedValue } from '@radar/types';

const MAX_STRING_LENGTH = 500;
const MAX_ITEMS = 50;
const MAX_KEYS = 50;
const PREVIEW_KEYS = 3;

const isReactElement = (value: object): boolean => '$$typeof' in value;

type ReactElementLike = {
  type?: { displayName?: string; name?: string } | string;
};

const getElementTypeName = (value: ReactElementLike): string => {
  const elementType = value.type;

  if (typeof elementType === 'string') {
    return elementType;
  }

  if (
    elementType !== null &&
    elementType !== undefined &&
    typeof elementType === 'object'
  ) {
    return elementType.displayName ?? elementType.name ?? 'Unknown';
  }

  return 'Unknown';
};

const buildObjectPreview = (keys: string[]): string => {
  const previewKeys = keys.slice(0, PREVIEW_KEYS);
  const suffix = keys.length > PREVIEW_KEYS ? ', ...' : '';
  return `{${previewKeys.join(', ')}${suffix}}`;
};

export const serializeValue = (
  value: unknown,
  maxDepth: number = 2,
  currentDepth: number = 0,
  seen: WeakSet<object> = new WeakSet(),
): SerializedValue => {
  try {
    if (value === null) {
      return { type: 'primitive', value: null };
    }

    if (value === undefined) {
      return { type: 'primitive', value: undefined };
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return { type: 'primitive', value };
    }

    if (typeof value === 'string') {
      if (value.length > MAX_STRING_LENGTH) {
        return {
          type: 'string',
          value: value.slice(0, MAX_STRING_LENGTH),
          truncated: true,
        };
      }
      return { type: 'string', value };
    }

    if (typeof value === 'function') {
      return { type: 'function', name: value.name || 'anonymous' };
    }

    if (typeof value === 'symbol') {
      return { type: 'symbol', description: value.description ?? '' };
    }

    if (typeof value !== 'object') {
      return { type: 'unknown', preview: String(value) };
    }

    if (isReactElement(value)) {
      return {
        type: 'element',
        elementType: getElementTypeName(value as ReactElementLike),
      };
    }

    if (seen.has(value)) {
      return { type: 'circular' };
    }

    seen.add(value);

    if (Array.isArray(value)) {
      if (currentDepth >= maxDepth) {
        return { type: 'array', length: value.length, dehydrated: true };
      }

      const items = value
        .slice(0, MAX_ITEMS)
        .map(item => serializeValue(item, maxDepth, currentDepth + 1, seen));

      return { type: 'array', length: value.length, items };
    }

    if (currentDepth >= maxDepth) {
      return { type: 'object', preview: '{...}', dehydrated: true };
    }

    const keys = Object.keys(value).sort().slice(0, MAX_KEYS);
    const preview = buildObjectPreview(keys);
    const entries = keys.map(key => ({
      key,
      value: serializeValue(
        (value as Record<string, unknown>)[key],
        maxDepth,
        currentDepth + 1,
        seen,
      ),
    }));

    return { type: 'object', preview, entries };
  } catch {
    return { type: 'unknown', preview: '[Error]' };
  }
};
