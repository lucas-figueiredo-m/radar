import type {
  InspectComponentResponse,
  InspectedComponentData,
  RenderedByEntry,
  SerializedEntry,
} from '@radar/types';
import { fiberIdMap } from './fiberIdMap';
import { getComponentName } from './getComponentName';
import { getSourceFile } from './getSourceFile';
import { serializeValue } from './serializeValue';
import { serializeHooks } from './serializeHooks';
import type { FiberNode } from './fiberTypes';
import {
  FUNCTION_COMPONENT,
  HOST_ROOT,
  USER_COMPONENT_TAGS,
} from './constants';
import { isFiberComponentType } from './isFiberComponentType';

const MAX_RENDERED_BY_DEPTH = 50;

const serializeProps = (fiber: FiberNode): SerializedEntry[] => {
  const props = fiber.memoizedProps;

  if (props === null || typeof props !== 'object') {
    return [];
  }

  return Object.entries(props)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      value: serializeValue(value),
    }));
};

const getSource = (
  fiber: FiberNode,
): InspectedComponentData['source'] | undefined => {
  if (isFiberComponentType(fiber.type) && fiber.type.__source != null) {
    return {
      fileName: fiber.type.__source.fileName,
      lineNumber: fiber.type.__source.lineNumber,
    };
  }

  return undefined;
};

const getRenderedBy = (fiber: FiberNode): RenderedByEntry[] => {
  const ancestors: RenderedByEntry[] = [];
  let current = fiber.return;

  while (current !== null && ancestors.length < MAX_RENDERED_BY_DEPTH) {
    if (current.tag === HOST_ROOT) {
      ancestors.push({ name: 'createRoot()' });
      break;
    }

    if (USER_COMPONENT_TAGS.includes(current.tag)) {
      const name = getComponentName(current);
      if (name !== null) {
        ancestors.push({
          id: fiberIdMap.getFiberId(current),
          name,
        });
      }
    }
    current = current.return;
  }

  return ancestors;
};

export const inspectComponent = (
  componentId: string,
): InspectComponentResponse => {
  try {
    const fiber = fiberIdMap.getFiberById(componentId);

    if (fiber === undefined) {
      return {
        type: 'inspectComponent',
        direction: 'response',
        componentId,
        data: null,
        timestamp: Date.now(),
      };
    }

    const name = getComponentName(fiber) ?? 'Unknown';
    const props = serializeProps(fiber);
    const hooks = fiber.tag === FUNCTION_COMPONENT ? serializeHooks(fiber) : [];
    const source = getSource(fiber);
    const sourceFile = getSourceFile(fiber);
    const renderedBy = getRenderedBy(fiber);

    return {
      type: 'inspectComponent',
      direction: 'response',
      componentId,
      data: {
        id: componentId,
        name,
        props,
        hooks,
        ...(source !== undefined && { source }),
        ...(sourceFile !== undefined && { sourceFile }),
        renderedBy,
      },
      timestamp: Date.now(),
    };
  } catch {
    return {
      type: 'inspectComponent',
      direction: 'response',
      componentId,
      data: null,
      timestamp: Date.now(),
    };
  }
};
