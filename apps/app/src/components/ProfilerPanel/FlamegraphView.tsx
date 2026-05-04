import { useRef, useState, useEffect, useCallback } from 'react';
import type { ProfilerComponentData, RenderTrigger } from '@radar/types';
import { formatDuration } from '../../utils';
import {
  computeFlamegraphLayout,
  type FlamegraphBar,
} from './FlamegraphLayout';
import { renderFlamegraph } from './FlamegraphCanvas';
import { ZOOM_ANIMATION_DURATION } from './constants';

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

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const interpolateBars = (
  from: FlamegraphBar[],
  to: FlamegraphBar[],
  progress: number,
): FlamegraphBar[] => {
  const fromMap = new Map<string, FlamegraphBar>();
  for (const bar of from) {
    fromMap.set(bar.component.id, bar);
  }

  const toMap = new Map<string, FlamegraphBar>();
  for (const bar of to) {
    toMap.set(bar.component.id, bar);
  }

  const result: FlamegraphBar[] = [];

  for (const toBar of to) {
    const fromBar = fromMap.get(toBar.component.id);
    if (fromBar) {
      result.push({
        ...toBar,
        x: lerp(fromBar.x, toBar.x, progress),
        y: lerp(fromBar.y, toBar.y, progress),
        width: lerp(fromBar.width, toBar.width, progress),
        dimmed: progress < 0.5 ? fromBar.dimmed : toBar.dimmed,
      });
    } else {
      result.push({
        ...toBar,
        x: lerp(toBar.x + toBar.width / 2, toBar.x, progress),
        width: lerp(0, toBar.width, progress),
      });
    }
  }

  for (const fromBar of from) {
    if (!toMap.has(fromBar.component.id)) {
      result.push({
        ...fromBar,
        x: lerp(fromBar.x, fromBar.x + fromBar.width / 2, progress),
        width: lerp(fromBar.width, 0, progress),
      });
    }
  }

  return result;
};

export const FlamegraphView = ({ components }: FlamegraphViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBar, setHoveredBar] = useState<FlamegraphBar | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const barsRef = useRef<FlamegraphBar[]>([]);
  const prevSelectedRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const hoveredBarRef = useRef<FlamegraphBar | null>(null);

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

  // Layout effect: computes target bars, starts animation on zoom changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0 || containerSize.height === 0)
      return;

    const targetBars = computeFlamegraphLayout(
      components,
      containerSize.width,
      containerSize.height,
      selectedComponentId,
    );

    // Size canvas to fit all bars (may exceed container height for scrolling)
    const maxBarBottom = targetBars.reduce(
      (max, bar) => Math.max(max, bar.y + bar.height),
      0,
    );
    const contentHeight = Math.max(containerSize.height, maxBarBottom + 8);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = contentHeight * dpr;
    canvas.style.width = `${containerSize.width}px`;
    canvas.style.height = `${contentHeight}px`;

    const zoomChanged = prevSelectedRef.current !== selectedComponentId;
    prevSelectedRef.current = selectedComponentId;

    const fromBars = barsRef.current;
    const shouldAnimate = zoomChanged && fromBars.length > 0;

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!shouldAnimate) {
      barsRef.current = targetBars;
      isAnimatingRef.current = false;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderFlamegraph(ctx, targetBars, hoveredBarRef.current, dpr);
      }
      return;
    }

    isAnimatingRef.current = true;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / ZOOM_ANIMATION_DURATION, 1);
      const progress = easeOutCubic(rawProgress);

      const interpolated = interpolateBars(fromBars, targetBars, progress);
      barsRef.current = interpolated;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        renderFlamegraph(ctx, interpolated, hoveredBarRef.current, dpr);
      }

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        barsRef.current = targetBars;
        isAnimatingRef.current = false;
        animationRef.current = null;
        if (ctx) {
          renderFlamegraph(ctx, targetBars, hoveredBarRef.current, dpr);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [components, containerSize, selectedComponentId]);

  // Hover effect: re-renders with hover highlight, skipped during animation
  useEffect(() => {
    if (isAnimatingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0 || containerSize.height === 0)
      return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderFlamegraph(ctx, barsRef.current, hoveredBar, dpr);
    }
  }, [hoveredBar, containerSize]);

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

      const newHovered = hit ?? null;
      hoveredBarRef.current = newHovered;
      setHoveredBar(newHovered);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredBarRef.current = null;
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
