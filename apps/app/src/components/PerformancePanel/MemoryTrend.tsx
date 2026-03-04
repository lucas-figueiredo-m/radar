import { useRef, useEffect, useCallback, useState } from 'react';
import { getMetricColor } from '../../utils';
import { MAX_DATA_POINTS, CHART_COLORS } from './constants';

export type MemoryTrendProps = {
  ramValues: (number | null)[];
  gcEventCounts: number[];
  totalGcEvents: number;
};

const CHART_HEIGHT = 120;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const renderMemoryTrend = (
  ctx: CanvasRenderingContext2D,
  ramValues: (number | null)[],
  gcEventCounts: number[],
  dpr: number,
  width: number,
  height: number,
): void => {
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = CHART_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 24, right: 12, bottom: 12, left: 12 };
  const chartLeft = padding.left;
  const chartRight = width - padding.right;
  const chartTop = padding.top;
  const chartBottom = height - padding.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Filter non-null RAM values for range calculation
  const validValues = ramValues.filter((v): v is number => v !== null);
  const maxRam = validValues.length > 0 ? Math.max(...validValues) * 1.2 : 1;
  const minRam = 0;
  const range = maxRam - minRam || 1;

  const mapX = (index: number): number =>
    chartLeft + (index / (MAX_DATA_POINTS - 1)) * chartWidth;

  const mapY = (value: number): number =>
    chartBottom - ((value - minRam) / range) * chartHeight;

  // Draw title
  ctx.fillStyle = CHART_COLORS.titleText;
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MEMORY TREND', chartLeft, 6);

  // Draw grid lines
  ctx.strokeStyle = CHART_COLORS.gridLine;
  ctx.lineWidth = 1;
  for (const fraction of [0.25, 0.5, 0.75]) {
    const y = chartBottom - fraction * chartHeight;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
  }

  // Build drawable points
  const offset = MAX_DATA_POINTS - ramValues.length;
  const drawablePoints: { x: number; y: number; value: number }[] = [];
  for (let i = 0; i < ramValues.length; i++) {
    const v = ramValues[i];
    if (v !== null) {
      drawablePoints.push({
        x: mapX(i + offset),
        y: mapY(v),
        value: v,
      });
    }
  }

  if (drawablePoints.length > 1) {
    // Fill under line
    ctx.beginPath();
    ctx.moveTo(drawablePoints[0].x, chartBottom);
    for (const point of drawablePoints) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(drawablePoints[drawablePoints.length - 1].x, chartBottom);
    ctx.closePath();

    const avgValue =
      drawablePoints.reduce((sum, p) => sum + p.value, 0) /
      drawablePoints.length;
    const avgRatio = 1 - clamp(avgValue / maxRam, 0, 1);
    const fillColor = getMetricColor(avgRatio);
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw line
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 1; i < drawablePoints.length; i++) {
      const prev = drawablePoints[i - 1];
      const curr = drawablePoints[i];
      const ratio = 1 - clamp(curr.value / maxRam, 0, 1);
      ctx.strokeStyle = getMetricColor(ratio);
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }

  // Draw GC event markers (small downward triangles)
  const GC_MARKER_SIZE = 6;
  ctx.fillStyle = '#a78bfa'; // purple for GC events
  for (let i = 0; i < gcEventCounts.length; i++) {
    if (gcEventCounts[i] <= 0) continue;

    const x = mapX(i + offset);
    const y = chartTop - 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - GC_MARKER_SIZE / 2, y - GC_MARKER_SIZE);
    ctx.lineTo(x + GC_MARKER_SIZE / 2, y - GC_MARKER_SIZE);
    ctx.closePath();
    ctx.fill();

    // Draw vertical dashed line from marker to chart
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, chartBottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw current value label
  if (validValues.length > 0) {
    const currentValue = validValues[validValues.length - 1];
    const mbValue = (currentValue / (1024 * 1024)).toFixed(0);
    const ratio = 1 - clamp(currentValue / maxRam, 0, 1);
    ctx.fillStyle = getMetricColor(ratio);
    ctx.font = 'bold 14px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${mbValue} MB`, chartRight, 6);
  }

  ctx.restore();
};

export const MemoryTrend = ({
  ramValues,
  gcEventCounts,
  totalGcEvents,
}: MemoryTrendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = CHART_HEIGHT * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderMemoryTrend(ctx, ramValues, gcEventCounts, dpr, width, CHART_HEIGHT);
  }, [ramValues, gcEventCounts, width]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#111827' }}
    >
      <div className="flex items-center justify-between px-3 pt-1">
        <span />
        <span className="text-xs font-mono text-zinc-500">
          GC Events: <span className="text-purple-400">{totalGcEvents}</span>
        </span>
      </div>
      <div
        ref={containerRef}
        className="relative"
        style={{ height: CHART_HEIGHT }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};
