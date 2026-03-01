import {
  Circle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  BarChart3,
  Table2,
  Trash2,
} from 'lucide-react';
import type { ProfilerView } from '../../types';

export type ProfilerToolbarProps = {
  isProfiling: boolean;
  hasCommits: boolean;
  selectedCommitIndex: number;
  totalCommits: number;
  activeView: ProfilerView;
  onStartProfiling: () => void;
  onStopProfiling: () => void;
  onReload: () => void;
  onChangeView: (view: ProfilerView) => void;
  onPrevCommit: () => void;
  onNextCommit: () => void;
  onClear: () => void;
};

const VIEW_OPTIONS: { view: ProfilerView; icon: typeof Flame; label: string }[] = [
  { view: 'flamegraph', icon: Flame, label: 'Flamegraph' },
  { view: 'ranked', icon: BarChart3, label: 'Ranked' },
  { view: 'stats', icon: Table2, label: 'Stats' },
];

export const ProfilerToolbar = ({
  isProfiling,
  hasCommits,
  selectedCommitIndex,
  totalCommits,
  activeView,
  onStartProfiling,
  onStopProfiling,
  onReload,
  onChangeView,
  onPrevCommit,
  onNextCommit,
  onClear,
}: ProfilerToolbarProps) => {
  const canGoPrev = hasCommits && selectedCommitIndex > 0;
  const canGoNext = hasCommits && selectedCommitIndex < totalCommits - 1;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border-subtle shrink-0">
      {/* Record button */}
      <button
        onClick={isProfiling ? onStopProfiling : onStartProfiling}
        className="flex items-center gap-1.5 px-2.5 py-[3px] rounded-md cursor-pointer text-xs border border-transparent hover:bg-bg-surface"
        title={isProfiling ? 'Stop profiling' : 'Start profiling'}
      >
        <Circle
          size={12}
          className={
            isProfiling ? 'text-red-500 fill-red-500' : 'text-text-secondary'
          }
        />
        <span className={isProfiling ? 'text-red-500' : 'text-text-secondary'}>
          {isProfiling ? 'Stop' : 'Record'}
        </span>
      </button>

      {/* Reload button */}
      <button
        onClick={onReload}
        className="flex items-center gap-1.5 px-2.5 py-[3px] rounded-md cursor-pointer text-xs border border-transparent hover:bg-bg-surface text-text-secondary"
        title="Reload and start profiling"
      >
        <RefreshCw size={12} />
      </button>

      {/* Separator */}
      <div className="w-px h-4 bg-border-subtle mx-1" />

      {/* Commit navigator */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onPrevCommit}
          disabled={!canGoPrev}
          className="p-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-bg-surface"
          title="Previous commit"
        >
          <ChevronLeft size={14} className="text-text-secondary" />
        </button>
        <span className="text-xs text-text-secondary min-w-[48px] text-center tabular-nums">
          {hasCommits
            ? `${selectedCommitIndex + 1} / ${totalCommits}`
            : '- / -'}
        </span>
        <button
          onClick={onNextCommit}
          disabled={!canGoNext}
          className="p-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-bg-surface"
          title="Next commit"
        >
          <ChevronRight size={14} className="text-text-secondary" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border-subtle mx-1" />

      {/* View switcher */}
      <div className="flex items-center gap-0.5">
        {VIEW_OPTIONS.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onChangeView(view)}
            className={`flex items-center gap-1 px-2 py-[3px] rounded-md cursor-pointer text-xs border ${
              activeView === view
                ? 'bg-bg-elevated border-border-strong text-text-primary'
                : 'border-transparent text-text-secondary hover:bg-bg-surface'
            }`}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear button */}
      <button
        onClick={onClear}
        disabled={!hasCommits && !isProfiling}
        className="p-1.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-default hover:bg-bg-surface text-text-secondary"
        title="Clear profiling data"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
