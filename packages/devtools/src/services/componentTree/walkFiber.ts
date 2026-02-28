import type { ComponentTreeNode } from '@radar/types';
import type { FiberNode } from './fiberTypes';
import { getComponentName } from './getComponentName';
import { getSourceFile } from './getSourceFile';
import { fiberIdMap } from './fiberIdMap';
import { USER_COMPONENT_TAGS } from './constants';

const getChildren = (fiber: FiberNode): FiberNode[] => {
  const children: FiberNode[] = [];
  let child = fiber.child;

  while (child !== null) {
    children.push(child);
    child = child.sibling;
  }

  return children;
};

export const walkFiber = (rootFiber: FiberNode): ComponentTreeNode[] => {
  const processNode = (fiber: FiberNode): ComponentTreeNode[] => {
    const children = getChildren(fiber);
    const isUserComponent = USER_COMPONENT_TAGS.includes(fiber.tag);
    const name = isUserComponent ? getComponentName(fiber) : null;

    if (isUserComponent && name !== null) {
      const childNodes = children.flatMap(processNode);
      const source = getSourceFile(fiber);

      return [
        {
          id: fiberIdMap.getFiberId(fiber),
          name,
          key: fiber.key,
          ...(source !== undefined && { source }),
          children: childNodes,
        },
      ];
    }

    return children.flatMap(processNode);
  };

  return getChildren(rootFiber).flatMap(processNode);
};
