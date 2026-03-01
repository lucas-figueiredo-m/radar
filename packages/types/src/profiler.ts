export type ProfilerPhase = 'mount' | 'update' | 'did-not-render';

export type RenderTrigger =
  | { type: 'props'; changedKeys: string[] }
  | { type: 'state' }
  | { type: 'hooks' }
  | { type: 'parent' }
  | { type: 'unknown' };

export type ProfilerComponentData = {
  id: string;
  name: string;
  actualDuration: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
  phase: ProfilerPhase;
  skipped: boolean;
  triggers: RenderTrigger[];
  children: ProfilerComponentData[];
};

export type ProfilerCommitData = {
  index: number;
  timestamp: number;
  duration: number;
  components: ProfilerComponentData[];
};

export type ProfilerSessionMessage = {
  type: 'profilerSession';
  commits: ProfilerCommitData[];
  timestamp: number;
};

export type StartProfilingCommand = {
  type: 'startProfiling';
};

export type StopProfilingCommand = {
  type: 'stopProfiling';
};

export type ReloadAndProfileCommand = {
  type: 'reloadAndProfile';
};
