import type { StartupData } from '../../types';

export type StartupBreakdownProps = {
  startupData: StartupData | null;
  connected: boolean;
};

const formatMs = (ms: number): string => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
};

type MetricRowProps = {
  label: string;
  value: number | null;
  color: string;
  maxValue: number;
  unavailableText?: string;
};

const MetricRow = ({
  label,
  value,
  color,
  maxValue,
  unavailableText = 'N/A',
}: MetricRowProps) => {
  const barWidth =
    value !== null && maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-zinc-400 w-28 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-5 bg-zinc-800/50 rounded overflow-hidden relative">
        {value !== null ? (
          <div
            className="h-full rounded transition-all duration-500"
            style={{
              width: `${barWidth}%`,
              backgroundColor: color,
              opacity: 0.8,
            }}
          />
        ) : null}
      </div>
      <span
        className="text-xs font-mono w-16 text-right shrink-0"
        style={{ color: value !== null ? color : '#64748b' }}
      >
        {value !== null ? formatMs(value) : unavailableText}
      </span>
    </div>
  );
};

export const StartupBreakdown = ({
  startupData,
  connected,
}: StartupBreakdownProps) => {
  if (!startupData) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: '#111827' }}>
        <h3 className="text-xs font-mono text-zinc-400 mb-2">STARTUP</h3>
        <p className="text-sm text-zinc-500">
          {connected
            ? 'Waiting for startup data...'
            : 'Connect a device to see startup metrics'}
        </p>
      </div>
    );
  }

  const { jsBundleEval, nativeLaunch, tti } = startupData;

  const values = [jsBundleEval, nativeLaunch, tti].filter(
    (v): v is number => v !== null,
  );
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#111827' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono text-zinc-400">STARTUP</h3>
        <span className="text-xs font-mono text-zinc-500">
          Total: {formatMs(total)}
        </span>
      </div>
      <div className="space-y-2">
        <MetricRow
          label="Native Launch"
          value={nativeLaunch}
          color="#a78bfa"
          maxValue={maxValue}
        />
        <MetricRow
          label="JS Bundle Eval"
          value={jsBundleEval}
          color="#60a5fa"
          maxValue={maxValue}
        />
        <MetricRow
          label="TTI"
          value={tti}
          color="#34d399"
          maxValue={maxValue}
          unavailableText="Pending"
        />
      </div>
    </div>
  );
};
