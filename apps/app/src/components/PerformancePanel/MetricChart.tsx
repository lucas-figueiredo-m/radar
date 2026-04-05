import { useRef, useEffect, useCallback, useState } from 'react';
import { renderMetricChart } from './MetricChartCanvas';

export type MetricChartProps = {
  values: (number | null)[];
  timestamps?: number[];
  maxValue: number;
  minValue: number;
  title: string;
  unit: string;
  invertColors?: boolean;
  aspectRatio?: string;
};

type HoverState = {
  x: number;
  y: number;
  formattedValue: string;
  timestamp: number | null;
} | null;

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const MetricChart = ({
  values,
  timestamps,
  maxValue,
  minValue,
  title,
  unit,
  invertColors = false,
  aspectRatio,
}: MetricChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverState>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentValue = values.length > 0 ? values[values.length - 1] : null;

    const result = renderMetricChart(ctx, {
      values,
      timestamps,
      maxValue,
      minValue,
      title,
      currentValue,
      unit,
      invertColors,
      dpr,
      width: size.width,
      height: size.height,
      hoverX,
    });

    if (result) {
      setHoverInfo({
        x: result.x,
        y: result.y,
        formattedValue: result.formattedValue,
        timestamp: result.timestamp,
      });
    } else {
      setHoverInfo(null);
    }
  }, [
    values,
    timestamps,
    maxValue,
    minValue,
    title,
    unit,
    invertColors,
    size,
    hoverX,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverX(e.clientX - rect.left);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
    setHoverInfo(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg overflow-hidden"
      style={{ backgroundColor: '#111827', aspectRatio: aspectRatio ?? '1' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: hoverInfo.x,
            top: hoverInfo.y,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 shadow-lg text-center">
            <span className="text-xs font-mono text-white font-bold whitespace-nowrap block">
              {hoverInfo.formattedValue}
            </span>
            {hoverInfo.timestamp && (
              <span className="text-[10px] font-mono text-zinc-300 whitespace-nowrap block">
                {formatTime(hoverInfo.timestamp)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
