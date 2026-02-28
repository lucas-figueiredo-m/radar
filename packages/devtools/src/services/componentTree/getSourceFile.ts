import type { FiberNode } from './fiberTypes';
import { isFiberComponentType } from './isFiberComponentType';

export const getSourceFile = (fiber: FiberNode): string | undefined => {
  if (isFiberComponentType(fiber.type)) {
    return fiber.type.__sourceFile;
  }

  return undefined;
};
