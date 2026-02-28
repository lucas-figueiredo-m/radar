import type { ComponentTreeNode } from '@radar/types';

export type { ComponentTreeNode } from '@radar/types';
export type {
  SerializedValue,
  SerializedEntry,
  HookInfo,
  InspectedComponentData,
  InspectComponentRequest,
  InspectComponentResponse,
} from '@radar/types';

export type ComponentTreeState = {
  rootNodes: ComponentTreeNode[];
  timestamp: number;
  deviceId: string;
};
