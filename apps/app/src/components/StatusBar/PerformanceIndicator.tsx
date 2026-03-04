import type { PerformanceDataPoint } from '../../types';
import { getMetricColor, formatMemory } from '../../utils';

export type PerformanceIndicatorProps = {
  latestMetric: PerformanceDataPoint | null;
};

export const PerformanceIndicator = ({
  latestMetric,
}: PerformanceIndicatorProps) => {
  if (!latestMetric) return null;

  const jsFpsColor = getMetricColor(latestMetric.jsFps / 60);
  const uiFpsColor =
    latestMetric.uiFps !== null
      ? getMetricColor(latestMetric.uiFps / 60)
      : undefined;
  const ramColor =
    latestMetric.ram !== null
      ? getMetricColor(1 - latestMetric.ram / (500 * 1024 * 1024))
      : undefined;

  return (
    <span className="text-xs font-mono flex items-center gap-2">
      <span>
        JS:{' '}
        <span style={{ color: jsFpsColor }}>{latestMetric.jsFps}fps</span>
      </span>
      <span className="text-zinc-600">&middot;</span>
      <span>
        UI:{' '}
        {latestMetric.uiFps !== null ? (
          <span style={{ color: uiFpsColor }}>{latestMetric.uiFps}fps</span>
        ) : (
          <span className="text-zinc-500">N/A</span>
        )}
      </span>
      <span className="text-zinc-600">&middot;</span>
      <span>
        RAM:{' '}
        {latestMetric.ram !== null ? (
          <span style={{ color: ramColor }}>
            {formatMemory(latestMetric.ram)}
          </span>
        ) : (
          <span className="text-zinc-500">N/A</span>
        )}
      </span>
    </span>
  );
};
