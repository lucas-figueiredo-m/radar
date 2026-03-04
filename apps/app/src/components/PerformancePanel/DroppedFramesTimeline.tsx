import { useRef, useEffect, useCallback, useState } from 'react';
import { MAX_DATA_POINTS, CHART_COLORS } from './constants';

export type DroppedFramesTimelineProps = {
  droppedFramesCounts: number[];
  totalDroppedFrames: number;
};

const TIMELINE_HEIGHT = 80;
const BAR_COLOR = '#f87171';
const BAR_COLOR_FILL = 'rgba(248, 113, 113, 0.15)';

const renderDroppedFrames = (
  ctx: CanvasRenderingContext2D,
  droppedFramesCounts: number[],
  dpr: number,
  width: number,
  height: number,
): void => {
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = CHART_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 24, right: 12, bottom: 8, left: 12 };
  const chartLeft = padding.left;
  const chartRight = width - padding.right;
  const chartTop = padding.top;
  const chartBottom = height - padding.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const maxCount = Math.max(...droppedFramesCounts, 1);
  const barWidth = Math.max(1, chartWidth / MAX_DATA_POINTS - 1);
  const offset = MAX_DATA_POINTS - droppedFramesCounts.length;

  // Draw title
  ctx.fillStyle = CHART_COLORS.titleText;
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('DROPPED FRAMES', chartLeft, 6);

  // Draw grid line at 50%
  ctx.strokeStyle = CHART_COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop + chartHeight * 0.5);
  ctx.lineTo(chartRight, chartTop + chartHeight * 0.5);
  ctx.stroke();

  // Draw bars
  for (let i = 0; i < droppedFramesCounts.length; i++) {
    const count = droppedFramesCounts[i];
    if (count <= 0) continue;

    const x =
      chartLeft + ((i + offset) / (MAX_DATA_POINTS - 1)) * chartWidth - barWidth / 2;
    const barHeight = (count / maxCount) * chartHeight;
    const y = chartBottom - barHeight;

    // Fill area
    ctx.fillStyle = BAR_COLOR_FILL;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Bar outline
    ctx.fillStyle = BAR_COLOR;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x, y, barWidth, Math.min(barHeight, 2));
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
};

export const DroppedFramesTimeline = ({
  droppedFramesCounts,
  totalDroppedFrames,
}: DroppedFramesTimelineProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    const observer = new ResizeObserver((entries) => {
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
    canvas.height = TIMELINE_HEIGHT * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderDroppedFrames(ctx, droppedFramesCounts, dpr, width, TIMELINE_HEIGHT);
  }, [droppedFramesCounts, width]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#111827' }}>
      <div className="flex items-center justify-between px-3 pt-1">
        <span />
        <span className="text-xs font-mono text-zinc-500">
          Total: <span className="text-zinc-400">{totalDroppedFrames}</span>
        </span>
      </div>
      <div ref={containerRef} className="relative" style={{ height: TIMELINE_HEIGHT }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
