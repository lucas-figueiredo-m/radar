import type { ProfilerCommitData } from '@radar/types';
import type { ProfilerView, ComponentStatsEntry } from '../../types';
import { ProfilerToolbar } from './ProfilerToolbar';
import { CommitTimeline } from './CommitTimeline';
import { FlamegraphView } from './FlamegraphView';
import { RankedView } from './RankedView';
import { ComponentStats } from './ComponentStats';

export { ProfilerToolbar } from './ProfilerToolbar';
export type { ProfilerToolbarProps } from './ProfilerToolbar';
export { CommitTimeline } from './CommitTimeline';
export type { CommitTimelineProps } from './CommitTimeline';
export { FlamegraphView } from './FlamegraphView';
export type { FlamegraphViewProps } from './FlamegraphView';
export { renderFlamegraph } from './FlamegraphCanvas';
export { computeFlamegraphLayout } from './FlamegraphLayout';
export type { FlamegraphBar } from './FlamegraphLayout';
export { RankedView } from './RankedView';
export type { RankedViewProps } from './RankedView';
export { ComponentStats } from './ComponentStats';
export type { ComponentStatsProps } from './ComponentStats';
export {
  DURATION_THRESHOLDS,
  DURATION_COLORS,
  FLAMEGRAPH_ROW_HEIGHT,
  FLAMEGRAPH_ROW_GAP,
  FLAMEGRAPH_PADDING,
  FLAMEGRAPH_MIN_WIDTH,
  TIMELINE_BAR_WIDTH,
  TIMELINE_BAR_GAP,
  TIMELINE_HEIGHT,
} from './constants';

export type ProfilerPanelProps = {
  isProfiling: boolean;
  commits: ProfilerCommitData[];
  selectedCommitIndex: number;
  selectedCommit: ProfilerCommitData | null;
  activeView: ProfilerView;
  componentStats: ComponentStatsEntry[];
  connected: boolean;
  onSelectCommit: (index: number) => void;
  onChangeView: (view: ProfilerView) => void;
  onStartProfiling: () => void;
  onStopProfiling: () => void;
  onReload: () => void;
  onClear: () => void;
};

export const ProfilerPanel = ({
  isProfiling,
  commits,
  selectedCommitIndex,
  selectedCommit,
  activeView,
  componentStats,
  connected,
  onSelectCommit,
  onChangeView,
  onStartProfiling,
  onStopProfiling,
  onReload,
  onClear,
}: ProfilerPanelProps) => {
  const hasCommits = commits.length > 0;

  const handlePrevCommit = () => {
    if (selectedCommitIndex > 0) {
      onSelectCommit(selectedCommitIndex - 1);
    }
  };

  const handleNextCommit = () => {
    if (selectedCommitIndex < commits.length - 1) {
      onSelectCommit(selectedCommitIndex + 1);
    }
  };

  const renderEmptyState = () => {
    if (!connected) {
      return (
        <div className="flex items-center justify-center flex-1 text-text-tertiary">
          Waiting for device connection...
        </div>
      );
    }

    if (isProfiling && !hasCommits) {
      return (
        <div className="flex items-center justify-center flex-1 text-text-tertiary">
          Profiling... interact with your app
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center flex-1 text-text-tertiary">
        Click record to start profiling
      </div>
    );
  };

  const renderContent = () => {
    if (!selectedCommit) return null;

    switch (activeView) {
      case 'flamegraph':
        return <FlamegraphView components={selectedCommit.components} />;
      case 'ranked':
        return <RankedView components={selectedCommit.components} />;
      case 'stats':
        return <ComponentStats stats={componentStats} />;
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ProfilerToolbar
        isProfiling={isProfiling}
        hasCommits={hasCommits}
        selectedCommitIndex={selectedCommitIndex}
        totalCommits={commits.length}
        activeView={activeView}
        onStartProfiling={onStartProfiling}
        onStopProfiling={onStopProfiling}
        onReload={onReload}
        onChangeView={onChangeView}
        onPrevCommit={handlePrevCommit}
        onNextCommit={handleNextCommit}
        onClear={onClear}
      />

      {hasCommits && (
        <CommitTimeline
          commits={commits}
          selectedIndex={selectedCommitIndex}
          onSelect={onSelectCommit}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {hasCommits && selectedCommit ? renderContent() : renderEmptyState()}
      </div>
    </div>
  );
};
