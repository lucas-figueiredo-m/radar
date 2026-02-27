import type { HookInfo } from '@radar/types';
import { colorValues } from '@radar/design-system';
import { DetailSection } from '..';
import { SerializedValueRenderer } from './SerializedValueRenderer';
import { HOOK_TYPE_COLORS } from './constants';

export type HooksSectionProps = {
  hooks: HookInfo[];
};

export const HooksSection = ({ hooks }: HooksSectionProps) => (
  <DetailSection title="Hooks">
    {hooks.length === 0 ? (
      <span className="text-text-tertiary text-xs">No hooks</span>
    ) : (
      hooks.map(hook => (
        <div key={hook.index} className="py-0.5 text-xs">
          <span className="text-text-tertiary">{hook.index}</span>{' '}
          <span
            style={{
              color:
                HOOK_TYPE_COLORS[hook.type] ?? colorValues['text-secondary'],
            }}
          >
            {hook.type}
          </span>{' '}
          <SerializedValueRenderer value={hook.value} />
        </div>
      ))
    )}
  </DetailSection>
);
