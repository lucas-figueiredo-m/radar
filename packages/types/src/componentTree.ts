export type ComponentTreeNode = {
  id: string;
  name: string;
  key: string | null;
  children: ComponentTreeNode[];
};

export type ComponentTreeMessage = {
  type: 'componentTree';
  rootNodes: ComponentTreeNode[];
  timestamp: number;
};
