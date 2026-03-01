import type { FlamegraphBar } from './FlamegraphLayout';

const brightenColor = (hex: string, amount: number): string => {
  const r = Math.min(
    255,
    parseInt(hex.slice(1, 3), 16) + amount,
  );
  const g = Math.min(
    255,
    parseInt(hex.slice(3, 5), 16) + amount,
  );
  const b = Math.min(
    255,
    parseInt(hex.slice(5, 7), 16) + amount,
  );
  return `rgb(${r}, ${g}, ${b})`;
};

export const renderFlamegraph = (
  ctx: CanvasRenderingContext2D,
  bars: FlamegraphBar[],
  hoveredBar: FlamegraphBar | null,
  dpr: number,
): void => {
  const canvasWidth = ctx.canvas.width / dpr;
  const canvasHeight = ctx.canvas.height / dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const bar of bars) {
    const isHovered =
      hoveredBar !== null && hoveredBar.component.id === bar.component.id;

    ctx.fillStyle = isHovered ? brightenColor(bar.color, 40) : bar.color;
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

    if (isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.width - 1, bar.height - 1);
    }

    if (bar.width > 30) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.beginPath();
      ctx.rect(bar.x + 4, bar.y, bar.width - 8, bar.height);
      ctx.clip();
      ctx.fillText(bar.label, bar.x + 4, bar.y + bar.height / 2);
      ctx.restore();
    }
  }

  ctx.restore();
};
