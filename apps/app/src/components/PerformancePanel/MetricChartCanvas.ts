import { getMetricColor } from '../../utils';
import { MAX_DATA_POINTS, CHART_PADDING, CHART_COLORS } from './constants';

export type HoverInfo = {
  x: number;
  y: number;
  value: number;
  formattedValue: string;
} | null;

type RenderOptions = {
  values: (number | null)[];
  maxValue: number;
  minValue: number;
  title: string;
  currentValue: number | null;
  unit: string;
  invertColors: boolean;
  dpr: number;
  width: number;
  height: number;
  hoverX?: number | null;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const formatValue = (value: number, unit: string): string => {
  if (unit === 'MB') return `${(value / (1024 * 1024)).toFixed(0)} ${unit}`;
  if (unit === '%') return `${value.toFixed(1)} ${unit}`;
  return `${Math.round(value)} ${unit}`;
};

export const renderMetricChart = (
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
): HoverInfo => {
  const {
    values,
    maxValue,
    minValue,
    title,
    currentValue,
    unit,
    invertColors,
    dpr,
    width,
    height,
  } = options;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear and fill background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = CHART_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Compute chart area
  const chartLeft = CHART_PADDING.left;
  const chartRight = width - CHART_PADDING.right;
  const chartTop = CHART_PADDING.top;
  const chartBottom = height - CHART_PADDING.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const range = maxValue - minValue || 1;

  // X mapping: index relative to MAX_DATA_POINTS
  const mapX = (index: number): number =>
    chartLeft + (index / (MAX_DATA_POINTS - 1)) * chartWidth;

  // Y mapping: value range to chart area
  const mapY = (value: number): number =>
    chartBottom - ((value - minValue) / range) * chartHeight;

  // Draw horizontal grid lines (25%, 50%, 75%)
  ctx.strokeStyle = CHART_COLORS.gridLine;
  ctx.lineWidth = 1;
  for (const fraction of [0.25, 0.5, 0.75]) {
    const y = chartBottom - fraction * chartHeight;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
  }

  // Filter out null values and build drawable points
  const drawablePoints: { x: number; y: number; value: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null) {
      const offset = MAX_DATA_POINTS - values.length;
      drawablePoints.push({
        x: mapX(i + offset),
        y: mapY(v),
        value: v,
      });
    }
  }

  if (drawablePoints.length > 1) {
    // Draw filled area under the line
    ctx.beginPath();
    ctx.moveTo(drawablePoints[0].x, chartBottom);
    for (const point of drawablePoints) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(drawablePoints[drawablePoints.length - 1].x, chartBottom);
    ctx.closePath();

    // Use the average color at low opacity for fill
    const avgValue =
      drawablePoints.reduce((sum, p) => sum + p.value, 0) /
      drawablePoints.length;
    const avgRatio = clamp(avgValue / maxValue, 0, 1);
    const fillRatio = invertColors ? 1 - avgRatio : avgRatio;
    const fillColor = getMetricColor(fillRatio);
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw line with gradient color based on value quality
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 1; i < drawablePoints.length; i++) {
      const prev = drawablePoints[i - 1];
      const curr = drawablePoints[i];
      const ratio = clamp(curr.value / maxValue, 0, 1);
      const colorRatio = invertColors ? 1 - ratio : ratio;

      ctx.strokeStyle = getMetricColor(colorRatio);
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }

  // Draw current value indicator (dashed horizontal line)
  if (currentValue !== null) {
    const currentY = mapY(currentValue);
    const ratio = clamp(currentValue / maxValue, 0, 1);
    const colorRatio = invertColors ? 1 - ratio : ratio;
    const indicatorColor = getMetricColor(colorRatio);

    ctx.strokeStyle = indicatorColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(chartLeft, currentY);
    ctx.lineTo(chartRight, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Draw value label
  if (currentValue !== null) {
    const label = formatValue(currentValue, unit);
    const ratio = clamp(currentValue / maxValue, 0, 1);
    const colorRatio = invertColors ? 1 - ratio : ratio;
    const labelColor = getMetricColor(colorRatio);

    ctx.fillStyle = labelColor;
    ctx.font = `bold 16px ui-monospace, monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(label, chartRight, 6);
  }

  // Draw hover indicator
  let hoverResult: HoverInfo = null;
  const hoverX = options.hoverX;
  if (
    hoverX !== null &&
    hoverX !== undefined &&
    drawablePoints.length > 0 &&
    hoverX >= chartLeft &&
    hoverX <= chartRight
  ) {
    // Find closest data point to hover X
    let closest = drawablePoints[0];
    let closestDist = Math.abs(closest.x - hoverX);
    for (let i = 1; i < drawablePoints.length; i++) {
      const dist = Math.abs(drawablePoints[i].x - hoverX);
      if (dist < closestDist) {
        closest = drawablePoints[i];
        closestDist = dist;
      }
    }

    // Vertical line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(closest.x, chartTop);
    ctx.lineTo(closest.x, chartBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot on the data point
    const ratio = clamp(closest.value / maxValue, 0, 1);
    const colorRatio = invertColors ? 1 - ratio : ratio;
    const dotColor = getMetricColor(colorRatio);

    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(closest.x, closest.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(closest.x, closest.y, 4, 0, Math.PI * 2);
    ctx.stroke();

    hoverResult = {
      x: closest.x,
      y: closest.y,
      value: closest.value,
      formattedValue: formatValue(closest.value, unit),
    };
  }

  // Draw title top-left
  ctx.fillStyle = CHART_COLORS.titleText;
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, chartLeft, 6);

  ctx.restore();

  return hoverResult;
};
