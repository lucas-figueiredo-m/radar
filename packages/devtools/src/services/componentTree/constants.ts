export const COMPONENT_TREE_THROTTLE_MS = 500;

export const FUNCTION_COMPONENT = 0;
export const CLASS_COMPONENT = 1;
export const HOST_ROOT = 3;
export const CONTEXT_PROVIDER = 10;
export const FORWARD_REF = 11;
export const MEMO = 14;
export const SIMPLE_MEMO = 15;

export const USER_COMPONENT_TAGS = [
  FUNCTION_COMPONENT,
  CLASS_COMPONENT,
  CONTEXT_PROVIDER,
  FORWARD_REF,
  MEMO,
  SIMPLE_MEMO,
];
