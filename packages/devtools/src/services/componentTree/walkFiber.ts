import type { ComponentTreeNode } from '@radar/types';

type FiberNode = {
  tag: number;
  type:
    | {
        displayName?: string;
        name?: string;
        render?: { displayName?: string; name?: string };
        type?: { displayName?: string; name?: string };
        _context?: { displayName?: string };
      }
    | string
    | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  key: string | null;
};

const FUNCTION_COMPONENT = 0;
const CLASS_COMPONENT = 1;
const CONTEXT_PROVIDER = 10;
const FORWARD_REF = 11;
const MEMO = 14;
const SIMPLE_MEMO = 15;

const USER_COMPONENT_TAGS = [
  FUNCTION_COMPONENT,
  CLASS_COMPONENT,
  CONTEXT_PROVIDER,
  FORWARD_REF,
  MEMO,
  SIMPLE_MEMO,
];

const getComponentName = (fiber: FiberNode): string | null => {
  if (typeof fiber.type === 'string' || fiber.type === null) {
    return null;
  }

  if (fiber.tag === CONTEXT_PROVIDER) {
    // React 18: fiber.type = Context.Provider, fiber.type._context = Context
    // React 19: fiber.type = Context directly
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
  let nextId = 0;

  const processNode = (fiber: FiberNode): ComponentTreeNode[] => {
    const children = getChildren(fiber);
    const isUserComponent = USER_COMPONENT_TAGS.includes(fiber.tag);
    const name = isUserComponent ? getComponentName(fiber) : null;

    if (isUserComponent && name !== null) {
      const childNodes = children.flatMap(processNode);

      return [
        {
          id: String(nextId++),
          name,
          key: fiber.key,
          children: childNodes,
        },
      ];
    }

    return children.flatMap(processNode);
  };

  return getChildren(rootFiber).flatMap(processNode);
};
