export type ComponentTreeNode = {
  id: string;
  name: string;
  key: string | null;
  source?: string;
  children: ComponentTreeNode[];
};

export type ComponentTreeMessage = {
  type: 'componentTree';
  rootNodes: ComponentTreeNode[];
  timestamp: number;
};

export type SerializedValue =
  | { type: 'primitive'; value: string | number | boolean | null | undefined }
  | { type: 'string'; value: string; truncated?: boolean }
  | {
      type: 'object';
      preview: string;
      entries?: SerializedEntry[];
      dehydrated?: boolean;
    }
  | {
      type: 'array';
      length: number;
      items?: SerializedValue[];
      dehydrated?: boolean;
    }
  | { type: 'function'; name: string }
  | { type: 'symbol'; description: string }
  | { type: 'element'; elementType: string }
  | { type: 'circular' }
  | { type: 'unknown'; preview: string };

export type SerializedEntry = { key: string; value: SerializedValue };

export type HookInfo = { type: string; index: number; value: SerializedValue };

export type RenderedByEntry = { id?: string; name: string };

export type InspectedComponentData = {
  id: string;
  name: string;
  props: SerializedEntry[];
  hooks: HookInfo[];
  source?: { fileName: string; lineNumber?: number; columnNumber?: number };
  sourceFile?: string;
  renderedBy?: RenderedByEntry[];
};

export type InspectComponentRequest = {
  type: 'inspectComponent';
  direction: 'request';
  componentId: string;
};

export type InspectComponentResponse = {
  type: 'inspectComponent';
  direction: 'response';
  componentId: string;
  data: InspectedComponentData | null;
  timestamp: number;
};
