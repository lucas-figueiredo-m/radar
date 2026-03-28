import { useRef, useEffect, useCallback, useState } from 'react';
import { renderMetricChart } from './MetricChartCanvas';

export type MetricChartProps = {
  values: (number | null)[];
  maxValue: number;
  minValue: number;
  title: string;
  unit: string;
  invertColors?: boolean;
};

type HoverState = {
  x: number;
  y: number;
  formattedValue: string;
} | null;

export const MetricChart = ({
  values,
  maxValue,
  minValue,
  title,
  unit,
  invertColors = false,
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
      });
    } else {
      setHoverInfo(null);
    }
  }, [values, maxValue, minValue, title, unit, invertColors, size, hoverX]);

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
      className="relative aspect-square rounded-lg overflow-hidden"
      style={{ backgroundColor: '#111827' }}
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
          <div className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 shadow-lg">
            <span className="text-xs font-mono text-zinc-100 whitespace-nowrap">
              {hoverInfo.formattedValue}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
