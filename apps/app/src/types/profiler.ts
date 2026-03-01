import type { ProfilerCommitData } from '@radar/types';

export type ProfilerView = 'flamegraph' | 'ranked' | 'stats';

export type ProfilerSessionState = {
  commits: ProfilerCommitData[];
  selectedCommitIndex: number;
  activeView: ProfilerView;
};

export type ComponentStatsEntry = {
  id: string;
  name: string;
  renderCount: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  mountCount: number;
  updateCount: number;
};
