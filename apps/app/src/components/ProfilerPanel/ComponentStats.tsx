import { useState, useMemo } from 'react';
import { formatDuration } from '../../utils';
import type { ComponentStatsEntry } from '../../types';

export type ComponentStatsProps = {
  stats: ComponentStatsEntry[];
};

type SortField =
  | 'name'
  | 'renderCount'
  | 'totalTime'
  | 'avgTime'
  | 'maxTime'
  | 'mountCount'
  | 'updateCount'
  | 'didNotRenderCount';

type SortDirection = 'asc' | 'desc';

const COLUMNS: { key: SortField; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Name', align: 'left' },
  { key: 'renderCount', label: 'Renders', align: 'right' },
  { key: 'totalTime', label: 'Total', align: 'right' },
  { key: 'avgTime', label: 'Avg', align: 'right' },
  { key: 'maxTime', label: 'Max', align: 'right' },
  { key: 'mountCount', label: 'Mounts', align: 'right' },
  { key: 'updateCount', label: 'Updates', align: 'right' },
  { key: 'didNotRenderCount', label: 'Skipped', align: 'right' },
];

export const ComponentStats = ({ stats }: ComponentStatsProps) => {
  const [sortField, setSortField] = useState<SortField>('totalTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedStats = useMemo(() => {
    const sorted = [...stats];
    sorted.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      const aNum = a[sortField];
      const bNum = b[sortField];
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [stats, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No component stats available.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="sticky top-0 bg-bg-base z-sticky">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-4 py-2 border-b border-border-default text-detail text-text-disabled font-semibold cursor-pointer hover:text-text-secondary select-none ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '\u25B2' : '\u25BC'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedStats.map(entry => (
            <tr
              key={entry.id}
              className="border-b border-border-subtle hover:bg-bg-surface transition-colors"
            >
              <td className="px-4 py-1.5 text-text-primary text-xs truncate max-w-[200px]">
                {entry.name}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {entry.renderCount}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {formatDuration(entry.totalTime)}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {formatDuration(entry.avgTime)}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {formatDuration(entry.maxTime)}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {entry.mountCount}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {entry.updateCount}
              </td>
              <td className="px-4 py-1.5 text-text-secondary text-xs text-right tabular-nums">
                {entry.didNotRenderCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
