import type { InspectComponentResponse, SerializedEntry } from '@radar/types';
import { fiberIdMap } from './fiberIdMap';
import { getComponentName } from './getComponentName';
import { serializeValue } from './serializeValue';
import { serializeHooks } from './serializeHooks';
import type { FiberNode } from './fiberTypes';

const FUNCTION_COMPONENT = 0;

const serializeProps = (fiber: FiberNode): SerializedEntry[] => {
  const props = fiber.memoizedProps;

  if (props === null || typeof props !== 'object') {
    return [];
  }

  return Object.entries(props)
    .filter(([key]) => key !== 'children')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      value: serializeValue(value),
    }));
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

    return {
      type: 'inspectComponent',
      direction: 'response',
      componentId,
      data: {
        id: componentId,
        name,
        props,
        hooks,
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
