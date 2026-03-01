import type { ProfilerComponentData } from '@radar/types';
import { getDurationColor } from '../../utils';
import {
  FLAMEGRAPH_ROW_HEIGHT,
  FLAMEGRAPH_ROW_GAP,
  FLAMEGRAPH_PADDING,
  FLAMEGRAPH_MIN_WIDTH,
} from './constants';

export type FlamegraphBar = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  component: ProfilerComponentData;
};

const processComponent = (
  component: ProfilerComponentData,
  parentX: number,
  parentWidth: number,
  parentDuration: number,
  siblingCount: number,
  depth: number,
  bars: FlamegraphBar[],
): void => {
  const useEqualWidth = parentDuration <= 0;
  const widthRatio = useEqualWidth
    ? 1 / Math.max(siblingCount, 1)
    : component.actualDuration / parentDuration;
  const barWidth = Math.max(widthRatio * parentWidth, FLAMEGRAPH_MIN_WIDTH);
  const y = depth * (FLAMEGRAPH_ROW_HEIGHT + FLAMEGRAPH_ROW_GAP);

  const label =
    barWidth > 60
      ? `${component.name} (${component.actualDuration.toFixed(1)}ms)`
      : component.name;

  bars.push({
    x: parentX,
    y,
    width: barWidth,
    height: FLAMEGRAPH_ROW_HEIGHT,
    color: getDurationColor(component.actualDuration),
    label,
    component,
  });

  let childX = parentX;
  const childCount = component.children.length;
  for (const child of component.children) {
    processComponent(
      child,
      childX,
      barWidth,
      component.actualDuration,
      childCount,
      depth + 1,
      bars,
    );
    const childRatio = useEqualWidth
      ? 1 / Math.max(childCount, 1)
      : child.actualDuration / component.actualDuration;
    childX += Math.max(childRatio * barWidth, FLAMEGRAPH_MIN_WIDTH);
  }
};

export const computeFlamegraphLayout = (
  components: ProfilerComponentData[],
  containerWidth: number,
  _containerHeight: number,
): FlamegraphBar[] => {
  const bars: FlamegraphBar[] = [];

  if (components.length === 0) return bars;

  const totalDuration = components.reduce(
    (sum, c) => sum + c.actualDuration,
    0,
  );
  const useEqualWidth = totalDuration <= 0;

  const availableWidth = containerWidth - 2 * FLAMEGRAPH_PADDING;
  let currentX = FLAMEGRAPH_PADDING;

  for (const component of components) {
    const widthRatio = useEqualWidth
      ? 1 / components.length
      : component.actualDuration / totalDuration;
    const barWidth = Math.max(widthRatio * availableWidth, FLAMEGRAPH_MIN_WIDTH);

    const label =
      barWidth > 60
        ? `${component.name} (${component.actualDuration.toFixed(1)}ms)`
        : component.name;

    bars.push({
      x: currentX,
      y: 0,
      width: barWidth,
      height: FLAMEGRAPH_ROW_HEIGHT,
      color: getDurationColor(component.actualDuration),
      label,
      component,
    });

    let childX = currentX;
    const childCount = component.children.length;
    for (const child of component.children) {
      processComponent(
        child,
        childX,
        barWidth,
        component.actualDuration,
        childCount,
        1,
        bars,
      );
      const childRatio =
        component.actualDuration <= 0
          ? 1 / Math.max(childCount, 1)
          : child.actualDuration / component.actualDuration;
      childX += Math.max(childRatio * barWidth, FLAMEGRAPH_MIN_WIDTH);
    }

    currentX += barWidth;
  }

  return bars;
};
