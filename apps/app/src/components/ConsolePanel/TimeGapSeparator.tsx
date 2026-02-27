import { colorValues } from '@radar/design-system';
import { formatGap } from '../../utils';

export type TimeGapSeparatorProps = {
  gapMs: number;
};

export const TimeGapSeparator = ({ gapMs }: TimeGapSeparatorProps) => (
  <div className="flex items-center gap-3 px-4 py-1">
    <div
      className="flex-1 h-px"
      style={{ background: colorValues['border-subtle'] }}
    />
    <span
      className="text-[10px] shrink-0"
      style={{ color: colorValues['text-disabled'] }}
    >
      — {formatGap(gapMs)} —
    </span>
    <div
      className="flex-1 h-px"
      style={{ background: colorValues['border-subtle'] }}
    />
  </div>
);
