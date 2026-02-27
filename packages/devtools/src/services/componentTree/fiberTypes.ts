export type FiberNode = {
  tag: number;
  type:
    | {
        displayName?: string;
        name?: string;
        render?: { displayName?: string; name?: string };
        type?: { displayName?: string; name?: string };
        _context?: { displayName?: string };
        $$typeof?: symbol;
      }
    | string
    | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  key: string | null;
  memoizedProps: Record<string, unknown> | null;
  memoizedState: MemoizedState | null;
  stateNode: unknown;
  _debugHookTypes: string[] | null;
};

export type MemoizedState = {
  memoizedState: unknown;
  next: MemoizedState | null;
  queue: unknown;
};

export type FiberRoot = {
  current: FiberNode;
};
