import type { FiberComponentType, FiberNode } from './fiberTypes';

export const isFiberComponentType = (
  type: FiberNode['type'],
): type is FiberComponentType => type !== null && typeof type !== 'string';
