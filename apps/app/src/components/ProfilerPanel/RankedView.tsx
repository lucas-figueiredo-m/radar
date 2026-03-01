import { useMemo } from 'react';
import type { ProfilerComponentData } from '@radar/types';
import {
  getDurationColor,
  flattenProfilerComponents,
  formatDuration,
} from '../../utils';
import type { FlatProfilerComponent } from '../../utils';

export type RankedViewProps = {
  components: ProfilerComponentData[];
};

const PHASE_STYLES = {
  mount: 'text-blue-400 bg-blue-400/20',
  update: 'text-purple-400 bg-purple-400/20',
  'did-not-render': 'text-gray-400 bg-gray-400/20',
} as const;

export const RankedView = ({ components }: RankedViewProps) => {
  const sortedComponents = useMemo(() => {
    const flat = flattenProfilerComponents(components);
    return flat.sort((a, b) => {
      const aDidNotRender = a.phase === 'did-not-render' ? 1 : 0;
      const bDidNotRender = b.phase === 'did-not-render' ? 1 : 0;
      if (aDidNotRender !== bDidNotRender) return aDidNotRender - bDidNotRender;
      return b.actualDuration - a.actualDuration;
    });
  }, [components]);

  if (sortedComponents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No component data for this commit.
      </div>
    );
  }

  const maxDuration = sortedComponents.find(c => c.phase !== 'did-not-render')?.actualDuration ?? 0;

  return (
    <div className="flex-1 overflow-auto">
      {sortedComponents.map((component: FlatProfilerComponent) => {
        const isDidNotRender = component.phase === 'did-not-render';
        const barWidth =
          isDidNotRender || maxDuration <= 0
            ? 0
            : (component.actualDuration / maxDuration) * 100;

        return (
          <div
            key={component.id}
            className={`flex items-center gap-3 px-4 py-1.5 border-b border-border-subtle ${isDidNotRender ? 'opacity-50' : ''}`}
          >
            {/* Duration bar */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="relative flex-1 h-5 bg-bg-surface rounded-sm overflow-hidden">
                {!isDidNotRender && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-sm"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: getDurationColor(
                        component.actualDuration,
                      ),
                      opacity: 0.7,
                    }}
                  />
                )}
                <span className="relative z-10 px-2 text-xs text-text-primary leading-5 truncate block">
                  {component.name}
                </span>
              </div>
            </div>

            {/* Phase badge */}
            <span
              className={`text-caption font-semibold px-1.5 py-[1px] rounded-sm shrink-0 ${PHASE_STYLES[component.phase]}`}
            >
              {isDidNotRender ? 'did not render' : component.phase}
            </span>

            {/* Triggers */}
            <span className="text-xs text-text-tertiary shrink-0 max-w-[180px] truncate">
              {component.triggers.length > 0
                ? component.triggers
                    .map(t => {
                      if (t.type === 'props')
                        return `props: ${t.changedKeys.join(', ')}`;
                      return t.type;
                    })
                    .join(', ')
                : ''}
            </span>

            {/* Duration value */}
            <span className="text-xs text-text-secondary tabular-nums shrink-0 w-[60px] text-right">
              {isDidNotRender ? 'Did not render' : formatDuration(component.actualDuration)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
