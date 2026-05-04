import { colorValues } from '@radar/design-system';

export const HOOK_TYPE_COLORS: Record<string, string> = {
  useState: colorValues['syntax-number'],
  useReducer: colorValues['syntax-number'],
  useEffect: colorValues['syntax-string'],
  useLayoutEffect: colorValues['syntax-string'],
  useInsertionEffect: colorValues['syntax-string'],
  useRef: colorValues['syntax-boolean'],
  useMemo: colorValues['syntax-function'],
  useCallback: colorValues['syntax-function'],
  useContext: colorValues['syntax-key'],
};
