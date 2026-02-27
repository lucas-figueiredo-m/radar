import type { FiberNode } from './fiberTypes';

let nextId = 0;
const fiberToId = new WeakMap<FiberNode, string>();
const idToFiber = new Map<string, FiberNode>();

const getFiberId = (fiber: FiberNode): string => {
  const existing = fiberToId.get(fiber);
  if (existing !== undefined) return existing;

  const id = String(nextId++);
  fiberToId.set(fiber, id);
  idToFiber.set(id, fiber);
  return id;
};

const removeFiber = (fiber: FiberNode) => {
  const id = fiberToId.get(fiber);
  if (id !== undefined) {
    fiberToId.delete(fiber);
    idToFiber.delete(id);
  }
};

const getFiberById = (id: string): FiberNode | undefined => idToFiber.get(id);

export const fiberIdMap = { getFiberId, removeFiber, getFiberById };
