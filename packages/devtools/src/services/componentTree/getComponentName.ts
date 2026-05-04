import type { FiberNode } from './fiberTypes';
import { CONTEXT_PROVIDER, FORWARD_REF, MEMO } from './constants';

export const getComponentName = (fiber: FiberNode): string | null => {
  if (typeof fiber.type === 'string' || fiber.type == null) {
    return null;
  }

  if (fiber.tag === CONTEXT_PROVIDER) {
    const contextName =
      fiber.type._context?.displayName ?? fiber.type.displayName ?? 'Context';
    return `${contextName}.Provider`;
  }

  if (fiber.tag === FORWARD_REF) {
    return (
      fiber.type.displayName ??
      fiber.type.render?.displayName ??
      fiber.type.render?.name ??
      null
    );
  }

  if (fiber.tag === MEMO) {
    return (
      fiber.type.displayName ??
      fiber.type.type?.displayName ??
      fiber.type.type?.name ??
      null
    );
  }

  return fiber.type.displayName ?? fiber.type.name ?? null;
};
