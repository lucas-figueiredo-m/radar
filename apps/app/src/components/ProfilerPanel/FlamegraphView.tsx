import { useRef, useState, useEffect, useCallback } from 'react';
import type { ProfilerComponentData, RenderTrigger } from '@radar/types';
import { formatDuration } from '../../utils';
import {
  computeFlamegraphLayout,
  type FlamegraphBar,
} from './FlamegraphLayout';
import { renderFlamegraph } from './FlamegraphCanvas';

export type FlamegraphViewProps = {
  components: ProfilerComponentData[];
};

const formatTrigger = (trigger: RenderTrigger): string => {
  switch (trigger.type) {
    case 'props':
      return `Props: ${trigger.changedKeys.join(', ')}`;
    case 'state':
      return 'State change';
    case 'hooks':
      return 'Hooks change';
    case 'parent':
      return 'Parent re-render';
    case 'unknown':
      return 'Unknown';
  }
};

export const FlamegraphView = ({ components }: FlamegraphViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBar, setHoveredBar] = useState<FlamegraphBar | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const barsRef = useRef<FlamegraphBar[]>([]);

  useEffect(() => {
    setSelectedComponentId(null);
  }, [components]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0 || containerSize.height === 0)
      return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    canvas.style.width = `${containerSize.width}px`;
    canvas.style.height = `${containerSize.height}px`;

    const bars = computeFlamegraphLayout(
      components,
      containerSize.width,
      containerSize.height,
      selectedComponentId,
    );
    barsRef.current = bars;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderFlamegraph(ctx, bars, hoveredBar, dpr);
    }
  }, [components, containerSize, hoveredBar, selectedComponentId]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = barsRef.current.find(
        bar =>
          x >= bar.x &&
          x <= bar.x + bar.width &&
          y >= bar.y &&
          y <= bar.y + bar.height,
      );

      setHoveredBar(hit ?? null);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = barsRef.current.find(
        bar =>
          x >= bar.x &&
          x <= bar.x + bar.width &&
          y >= bar.y &&
          y <= bar.y + bar.height,
      );

      if (!hit) {
        setSelectedComponentId(null);
      } else {
        setSelectedComponentId(prev =>
          prev === hit.component.id ? null : hit.component.id,
        );
      }
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredBar(null);
  }, []);

  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No component data for this commit.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer"
      />
      {hoveredBar && (
        <div
          className="fixed z-50 px-3 py-2 rounded-md bg-bg-elevated border border-border-default shadow-lg text-xs pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
          }}
        >
          <div className="font-semibold text-text-primary mb-1">
            {hoveredBar.component.name}
          </div>
          {hoveredBar.component.phase === 'did-not-render' ? (
            <div className="text-text-tertiary">Did not render</div>
          ) : (
            <>
              <div className="text-text-secondary">
                Duration: {formatDuration(hoveredBar.component.actualDuration)}
              </div>
              <div className="text-text-secondary">
                Self: {formatDuration(hoveredBar.component.selfBaseDuration)}
              </div>
              <div className="text-text-secondary capitalize">
                Phase: {hoveredBar.component.phase}
              </div>
              {hoveredBar.component.triggers.length > 0 && (
                <div className="mt-1 text-text-tertiary">
                  {hoveredBar.component.triggers.map((trigger, i) => (
                    <div key={i}>{formatTrigger(trigger)}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
