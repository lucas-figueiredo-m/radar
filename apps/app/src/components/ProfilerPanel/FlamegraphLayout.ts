import type { ProfilerComponentData } from '@radar/types';
import { getDurationColor } from '../../utils';
import {
  FLAMEGRAPH_ROW_HEIGHT,
  FLAMEGRAPH_ROW_GAP,
  FLAMEGRAPH_PADDING,
  FLAMEGRAPH_MIN_WIDTH,
  DID_NOT_RENDER_COLOR,
} from './constants';

export type FlamegraphBar = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  component: ProfilerComponentData;
  dimmed: boolean;
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
    : component.treeBaseDuration / parentDuration;
  const barWidth = Math.max(widthRatio * parentWidth, FLAMEGRAPH_MIN_WIDTH);
  const y = depth * (FLAMEGRAPH_ROW_HEIGHT + FLAMEGRAPH_ROW_GAP);

  const isDidNotRender = component.phase === 'did-not-render';
  const label = isDidNotRender
    ? component.name
    : barWidth > 60
    ? `${component.name} (${component.actualDuration.toFixed(1)}ms)`
    : component.name;

  bars.push({
    x: parentX,
    y,
    width: barWidth,
    height: FLAMEGRAPH_ROW_HEIGHT,
    color: isDidNotRender
      ? DID_NOT_RENDER_COLOR
      : getDurationColor(component.actualDuration),
    label,
    component,
    dimmed: false,
  });

  let childX = parentX;
  const childCount = component.children.length;
  for (const child of component.children) {
    processComponent(
      child,
      childX,
      barWidth,
      component.treeBaseDuration,
      childCount,
      depth + 1,
      bars,
    );
    const childUseEqual = component.treeBaseDuration <= 0;
    const childRatio = childUseEqual
      ? 1 / Math.max(childCount, 1)
      : child.treeBaseDuration / component.treeBaseDuration;
    childX += Math.max(childRatio * barWidth, FLAMEGRAPH_MIN_WIDTH);
  }
};

const findPathToComponent = (
  components: ProfilerComponentData[],
  targetId: string,
): ProfilerComponentData[] | null => {
  for (const component of components) {
    if (component.id === targetId) return [component];
    const childPath = findPathToComponent(component.children, targetId);
    if (childPath) return [component, ...childPath];
  }
  return null;
};

const makeLabel = (
  component: ProfilerComponentData,
  barWidth: number,
): string => {
  if (component.phase === 'did-not-render') return component.name;
  return barWidth > 60
    ? `${component.name} (${component.actualDuration.toFixed(1)}ms)`
    : component.name;
};

const getBarColor = (component: ProfilerComponentData): string =>
  component.phase === 'did-not-render'
    ? DID_NOT_RENDER_COLOR
    : getDurationColor(component.actualDuration);

const computeZoomedLayout = (
  path: ProfilerComponentData[],
  containerWidth: number,
): FlamegraphBar[] => {
  const bars: FlamegraphBar[] = [];
  const availableWidth = containerWidth - 2 * FLAMEGRAPH_PADDING;
  const x = FLAMEGRAPH_PADDING;

  for (let i = 0; i < path.length - 1; i++) {
    const component = path[i];
    const y = i * (FLAMEGRAPH_ROW_HEIGHT + FLAMEGRAPH_ROW_GAP);
    bars.push({
      x,
      y,
      width: availableWidth,
      height: FLAMEGRAPH_ROW_HEIGHT,
      color: getBarColor(component),
      label: makeLabel(component, availableWidth),
      component,
      dimmed: true,
    });
  }

  const selected = path[path.length - 1];
  const selectedDepth = path.length - 1;
  const selectedY =
    selectedDepth * (FLAMEGRAPH_ROW_HEIGHT + FLAMEGRAPH_ROW_GAP);

  bars.push({
    x,
    y: selectedY,
    width: availableWidth,
    height: FLAMEGRAPH_ROW_HEIGHT,
    color: getBarColor(selected),
    label: makeLabel(selected, availableWidth),
    component: selected,
    dimmed: false,
  });

  let childX = x;
  const childCount = selected.children.length;
  for (const child of selected.children) {
    processComponent(
      child,
      childX,
      availableWidth,
      selected.treeBaseDuration,
      childCount,
      selectedDepth + 1,
      bars,
    );
    const childRatio =
      selected.treeBaseDuration <= 0
        ? 1 / Math.max(childCount, 1)
        : child.treeBaseDuration / selected.treeBaseDuration;
    childX += Math.max(childRatio * availableWidth, FLAMEGRAPH_MIN_WIDTH);
  }

  return bars;
};

export const computeFlamegraphLayout = (
  components: ProfilerComponentData[],
  containerWidth: number,
  _containerHeight: number,
  selectedComponentId?: string | null,
): FlamegraphBar[] => {
  const bars: FlamegraphBar[] = [];

  if (components.length === 0) return bars;

  if (selectedComponentId) {
    const path = findPathToComponent(components, selectedComponentId);
    if (path) return computeZoomedLayout(path, containerWidth);
  }

  const totalDuration = components.reduce(
    (sum, c) => sum + c.treeBaseDuration,
    0,
  );
  const useEqualWidth = totalDuration <= 0;

  const availableWidth = containerWidth - 2 * FLAMEGRAPH_PADDING;
  let currentX = FLAMEGRAPH_PADDING;

  for (const component of components) {
    const widthRatio = useEqualWidth
      ? 1 / components.length
      : component.treeBaseDuration / totalDuration;
    const barWidth = Math.max(
      widthRatio * availableWidth,
      FLAMEGRAPH_MIN_WIDTH,
    );

    bars.push({
      x: currentX,
      y: 0,
      width: barWidth,
      height: FLAMEGRAPH_ROW_HEIGHT,
      color: getBarColor(component),
      label: makeLabel(component, barWidth),
      component,
      dimmed: false,
    });

    let childX = currentX;
    const childCount = component.children.length;
    for (const child of component.children) {
      processComponent(
        child,
        childX,
        barWidth,
        component.treeBaseDuration,
        childCount,
        1,
        bars,
      );
      const childRatio =
        component.treeBaseDuration <= 0
          ? 1 / Math.max(childCount, 1)
          : child.treeBaseDuration / component.treeBaseDuration;
      childX += Math.max(childRatio * barWidth, FLAMEGRAPH_MIN_WIDTH);
    }

    currentX += barWidth;
  }

  return bars;
};
