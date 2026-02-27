import type { SerializedEntry } from '@radar/types';
import { DetailSection } from '..';
import { SerializedValueRenderer } from './SerializedValueRenderer';
import { SYNTAX_COLORS } from '../ValueRenderer/constants';

export type PropsSectionProps = {
  props: SerializedEntry[];
};

export const PropsSection = ({ props }: PropsSectionProps) => (
  <DetailSection title="Props">
    {props.length === 0 ? (
      <span className="text-text-tertiary text-xs">No props</span>
    ) : (
      props.map(entry => (
        <div key={entry.key} className="py-0.5 text-xs">
          <span style={{ color: SYNTAX_COLORS.key }}>{entry.key}</span>
          <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
          <SerializedValueRenderer value={entry.value} />
        </div>
      ))
    )}
  </DetailSection>
);
