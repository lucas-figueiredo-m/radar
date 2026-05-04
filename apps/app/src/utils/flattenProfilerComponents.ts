import type { ProfilerComponentData } from '@radar/types';

export type FlatProfilerComponent = ProfilerComponentData & { depth: number };

export const flattenProfilerComponents = (
  components: ProfilerComponentData[],
  depth = 0,
): FlatProfilerComponent[] =>
  components.flatMap(c => [
    { ...c, depth, children: [] },
    ...flattenProfilerComponents(c.children, depth + 1),
  ]);
