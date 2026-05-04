import { Fragment, memo, useState } from 'react';
import { colorValues } from '@radar/design-system';
import { MAX_RENDER_DEPTH, SYNTAX_COLORS } from './constants';
import { ValueRenderer } from './index';

export type ObjectEntryProps = {
  value: Record<string, unknown>;
  depth?: number;
  maxDepth?: number;
};

const ObjectEntryInner = ({
  value,
  depth = 0,
  maxDepth = MAX_RENDER_DEPTH,
}: ObjectEntryProps) => {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(value);
  const hasOverflow = entries.length > 3;

  if (expanded) {
    return (
      <div className="flex flex-col">
        <span
          onClick={() => setExpanded(false)}
          className="cursor-pointer select-none"
        >
          <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
          <span
            className="text-detail"
            style={{ color: colorValues['text-tertiary'] }}
          >
            ▼ {entries.length} {entries.length === 1 ? 'key' : 'keys'}
          </span>
        </span>
        <div className="flex flex-col pl-[2ch]">
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span style={{ color: SYNTAX_COLORS.key }}>{k}</span>
              <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
              <ValueRenderer
                value={v}
                inline={false}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
              {i < entries.length - 1 && (
                <span style={{ color: SYNTAX_COLORS.bracket }}>,</span>
              )}
            </div>
          ))}
        </div>
        <span style={{ color: SYNTAX_COLORS.bracket }}>{'}'}</span>
      </div>
    );
  }

  return (
    <span
      className="inline-flex max-w-full cursor-pointer items-baseline gap-1"
      onClick={() => setExpanded(true)}
    >
      <span
        className="shrink-0 text-detail select-none"
        style={{ color: colorValues['text-tertiary'] }}
      >
        ▶
      </span>
      <span className="truncate">
        <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
        {entries.slice(0, 3).map(([k, v], i) => (
          <Fragment key={k}>
            {i > 0 && <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>}
            <span style={{ color: SYNTAX_COLORS.key }}>{k}</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <ValueRenderer
              value={v}
              inline={false}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          </Fragment>
        ))}
        {hasOverflow && (
          <span style={{ color: SYNTAX_COLORS.bracket }}>
            , ...+{entries.length - 3}
          </span>
        )}
        <span style={{ color: SYNTAX_COLORS.bracket }}>{' }'}</span>
      </span>
    </span>
  );
};

export const ObjectEntry = memo(ObjectEntryInner);
