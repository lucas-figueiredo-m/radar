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

// React's PerformedWork flag — bit 0 of fiber.flags.
// Set by the reconciler when a component's render function actually executes.
// Used by React DevTools' didFiberRender() to detect rendered user components.
export const PERFORMED_WORK = 0b1;
