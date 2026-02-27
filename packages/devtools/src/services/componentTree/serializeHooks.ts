import type { HookInfo, SerializedValue } from '@radar/types';
import type { FiberNode, MemoizedState } from './fiberTypes';
import { serializeValue } from './serializeValue';

const EFFECT_HOOKS = new Set([
  'useEffect',
  'useLayoutEffect',
  'useInsertionEffect',
]);

const EFFECT_VALUE: SerializedValue = { type: 'string', value: '(effect)' };

const isLinkedList = (state: MemoizedState | null): state is MemoizedState =>
  state !== null &&
  typeof state === 'object' &&
  'memoizedState' in state &&
  'next' in state;

const serializeRefHook = (hookState: unknown): SerializedValue => {
  try {
    const ref = hookState as { current?: unknown } | null;
    if (ref !== null && typeof ref === 'object' && 'current' in ref) {
      return serializeValue(ref.current);
    }
    return serializeValue(hookState);
  } catch {
    return { type: 'unknown', preview: '[Error]' };
  }
};

const serializeMemoHook = (hookState: unknown): SerializedValue => {
  try {
    if (Array.isArray(hookState) && hookState.length === 2) {
      return serializeValue(hookState[0]);
    }
    return serializeValue(hookState);
  } catch {
    return { type: 'unknown', preview: '[Error]' };
  }
};

const serializeHookValue = (
  hookType: string,
  hookState: unknown,
): SerializedValue => {
  if (EFFECT_HOOKS.has(hookType)) {
    return EFFECT_VALUE;
  }

  if (hookType === 'useRef') {
    return serializeRefHook(hookState);
  }

  if (hookType === 'useMemo' || hookType === 'useCallback') {
    return serializeMemoHook(hookState);
  }

  return serializeValue(hookState);
};

export const serializeHooks = (fiber: FiberNode): HookInfo[] => {
  try {
    const firstHook = fiber.memoizedState;

    if (!isLinkedList(firstHook)) {
      return [];
    }

    const hooks: HookInfo[] = [];
    let hookNode: MemoizedState | null = firstHook;
    let index = 0;

    while (hookNode !== null) {
      try {
        const hookType = fiber._debugHookTypes?.[index] ?? `hook${index}`;

        hooks.push({
          type: hookType,
          index,
          value: serializeHookValue(hookType, hookNode.memoizedState),
        });
      } catch {
        const hookType = fiber._debugHookTypes?.[index] ?? `hook${index}`;

        hooks.push({
          type: hookType,
          index,
          value: { type: 'unknown', preview: '[Error]' },
        });
      }

      hookNode = hookNode.next;
      index++;
    }

    return hooks;
  } catch {
    return [];
  }
};
