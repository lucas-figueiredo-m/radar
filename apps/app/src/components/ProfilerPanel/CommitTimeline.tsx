import { useRef, useState } from 'react';
import type { ProfilerCommitData } from '@radar/types';
import { formatTime } from '../../utils';
import { useResizeObserver } from '../../hooks';

// Matches React DevTools' 10-step commit gradient (teal → amber)
const COMMIT_GRADIENT = [
  '#37afa9',
  '#63b19e',
  '#80b393',
  '#97b488',
  '#abb67d',
  '#beb771',
  '#cfb965',
  '#dfba57',
  '#efbb49',
  '#febc38',
];

const getCommitBarColor = (t: number): string => {
  const maxIndex = COMMIT_GRADIENT.length - 1;
  const index = Math.round(Math.min(1, Math.max(0, t)) * maxIndex);
  return COMMIT_GRADIENT[index];
};

const MAX_BAR_WIDTH = 12;
const MIN_BAR_WIDTH = 3;
const BAR_GAP = 1;
const BAR_AREA_HEIGHT = 36;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useResizeObserver(containerRef, entry => {
    setContainerWidth(entry.contentRect.width);
  });

  const maxDuration = Math.max(...commits.map(c => c.duration), 1);
  const maxCbrt = Math.cbrt(maxDuration);

  const totalGaps = Math.max(0, commits.length - 1) * BAR_GAP;
  const availableForBars = containerWidth - totalGaps;
  const barWidth =
    commits.length > 0
      ? Math.max(
          MIN_BAR_WIDTH,
          Math.min(MAX_BAR_WIDTH, availableForBars / commits.length),
        )
      : MAX_BAR_WIDTH;

  return (
    <div
      ref={containerRef}
      className="relative flex items-end flex-1 min-w-0 overflow-hidden"
    >
      {commits.map((commit, index) => {
        const heightScale = Math.min(
          1,
          Math.max(0, Math.cbrt(commit.duration) / maxCbrt),
        );
        const barHeight = Math.max(4, heightScale * BAR_AREA_HEIGHT);
        const isSelected = index === selectedIndex;

        return (
          <button
            key={commit.index}
            onClick={() => onSelect(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`shrink-0 rounded-sm cursor-pointer transition-opacity ${
              isSelected
                ? 'ring-1 ring-text-primary ring-offset-1 ring-offset-bg-base'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              width: barWidth,
              height: barHeight,
              marginLeft: index > 0 ? BAR_GAP : 0,
              backgroundColor: getCommitBarColor(commit.duration / maxDuration),
            }}
          />
        );
      })}

      {hoveredIndex !== null && commits[hoveredIndex] && (
        <div className="absolute bottom-full mb-2 right-0 z-50 px-3 py-2 rounded-md bg-bg-elevated border border-border-default shadow-lg text-xs pointer-events-none whitespace-nowrap">
          <div className="text-text-secondary">
            Committed at:{' '}
            <span className="text-text-primary">
              {formatTime(commits[hoveredIndex].timestamp)}
            </span>
          </div>
          <div className="text-text-secondary mt-0.5">Durations:</div>
          <div className="text-text-secondary ml-2">
            Render:{' '}
            <span className="text-text-primary">
              {commits[hoveredIndex].duration.toFixed(3)}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
