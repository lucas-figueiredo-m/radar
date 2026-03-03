const MAX_DEPTH = 5;

const REACT_ELEMENT_TYPEOF = Symbol.for('react.element');
const REACT_TRANSITIONAL_TYPEOF = Symbol.for('react.transitional.element');
const FORWARD_REF_TYPEOF = Symbol.for('react.forward_ref');
const MEMO_TYPEOF = Symbol.for('react.memo');

type ElementType =
  | {
      displayName?: string;
      name?: string;
      $$typeof?: symbol;
      render?: { displayName?: string; name?: string };
      type?: { displayName?: string; name?: string };
    }
  | ((...args: unknown[]) => unknown)
  | string;

type ReactElementLike = {
  $$typeof?: symbol;
  type?: ElementType;
  props?: Record<string, unknown>;
  key?: string | null;
  ref?: unknown;
};

const isReactElement = (value: object): value is ReactElementLike =>
  '$$typeof' in value &&
  ((value as ReactElementLike).$$typeof === REACT_ELEMENT_TYPEOF ||
    (value as ReactElementLike).$$typeof === REACT_TRANSITIONAL_TYPEOF);

const getElementName = (value: ReactElementLike): string => {
  const elementType = value.type;

  if (typeof elementType === 'string') return elementType;

  if (typeof elementType === 'function') {
    const fn = elementType as { displayName?: string; name?: string };
    return fn.displayName ?? fn.name ?? 'Unknown';
  }

  if (
    elementType !== null &&
    elementType !== undefined &&
    typeof elementType === 'object'
  ) {
    if (elementType.$$typeof === FORWARD_REF_TYPEOF) return 'ForwardRef';
    if (elementType.$$typeof === MEMO_TYPEOF) return 'Memo';
    return elementType.displayName ?? elementType.name ?? 'Unknown';
  }

  return 'Unknown';
};

const serializeRecursive = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown => {
  if (value === null) return null;
  if (value === undefined) return { __type: 'Undefined' };

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;

  if (typeof value === 'bigint')
    return { __type: 'BigInt', value: `${value}n` };

  if (typeof value === 'symbol')
    return { __type: 'Symbol', description: value.description ?? '' };

  if (typeof value === 'function')
    return { __type: 'Function', name: value.name || 'anonymous' };

  if (typeof value !== 'object') return String(value);

  if (value instanceof Error)
    return { __type: 'Error', message: value.message, stack: value.stack };

  if (isReactElement(value)) {
    seen.add(value);
    return {
      __type: 'ReactElement',
      name: getElementName(value),
      props:
        value.props && typeof value.props === 'object'
          ? serializeRecursive(value.props, depth + 1, seen)
          : {},
      key: value.key ?? null,
      ref: serializeRecursive(value.ref, depth + 1, seen),
    };
  }

  if (seen.has(value)) {
    const keys = Object.keys(value as Record<string, unknown>);
    return { __type: 'Circular', keys };
  }
  seen.add(value);

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return { __type: 'Array', length: value.length };
    return value.map(item => serializeRecursive(item, depth + 1, seen));
  }

  if (depth >= MAX_DEPTH) return { __type: 'Object', preview: '{...}' };

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    result[key] = serializeRecursive(
      (value as Record<string, unknown>)[key],
      depth + 1,
      seen,
    );
  }
  return result;
};

export const serialize = (value: unknown): unknown =>
  serializeRecursive(value, 0, new WeakSet());
