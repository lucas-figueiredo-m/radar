import type { FiberComponentType, FiberNode } from './fiberTypes';

const isFiberComponentType = (
  type: FiberNode['type'],
): type is FiberComponentType =>
  type !== null && typeof type !== 'string';

export const getSourceFile = (fiber: FiberNode): string | undefined => {
  if (isFiberComponentType(fiber.type)) {
    return fiber.type.__sourceFile;
  }

  return undefined;
};
