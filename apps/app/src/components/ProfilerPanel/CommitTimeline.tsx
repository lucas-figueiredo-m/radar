import type { ProfilerCommitData } from '@radar/types';
import { getDurationColor, formatTime } from '../../utils';
import {
  TIMELINE_BAR_WIDTH,
  TIMELINE_BAR_GAP,
  TIMELINE_HEIGHT,
} from './constants';

export type CommitTimelineProps = {
  commits: ProfilerCommitData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export const CommitTimeline = ({
  commits,
  selectedIndex,
  onSelect,
}: CommitTimelineProps) => {
  const maxDuration = Math.max(...commits.map(c => c.duration), 1);
  const barAreaHeight = TIMELINE_HEIGHT - 8;

  return (
    <div className="flex items-end gap-px px-4 py-1 border-b border-border-subtle shrink-0 overflow-x-auto">
      {commits.map((commit, index) => {
        const barHeight = Math.max(
          4,
          (commit.duration / maxDuration) * barAreaHeight,
        );
        const isSelected = index === selectedIndex;

        return (
          <button
            key={commit.index}
            onClick={() => onSelect(index)}
            title={`Commit ${index + 1} - ${formatTime(
              commit.timestamp,
            )} (${commit.duration.toFixed(3)}ms)`}
            className={`shrink-0 rounded-sm cursor-pointer transition-opacity ${
              isSelected
                ? 'ring-1 ring-text-primary ring-offset-1 ring-offset-bg-base'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              width: TIMELINE_BAR_WIDTH,
              height: barHeight,
              marginLeft: index > 0 ? TIMELINE_BAR_GAP : 0,
              backgroundColor: getDurationColor(commit.duration),
            }}
          />
        );
      })}
    </div>
  );
};
