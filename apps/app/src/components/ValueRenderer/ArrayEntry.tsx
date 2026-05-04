import { Fragment, memo, useState } from 'react';
import { colorValues } from '@radar/design-system';
import { MAX_RENDER_DEPTH, SYNTAX_COLORS } from './constants';
import { InlinePreview } from './InlinePreview';
import { ValueRenderer } from './index';

export type ArrayEntryProps = {
  value: unknown[];
  depth?: number;
  maxDepth?: number;
};

const ArrayEntryInner = ({
  value,
  depth = 0,
  maxDepth = MAX_RENDER_DEPTH,
}: ArrayEntryProps) => {
  const [expanded, setExpanded] = useState(false);

  if (value.length === 0) {
    return <span style={{ color: SYNTAX_COLORS.bracket }}>[]</span>;
  }

  if (expanded) {
    return (
      <div className="flex flex-col">
        <span
          onClick={() => setExpanded(false)}
          className="cursor-pointer select-none"
        >
          <span style={{ color: SYNTAX_COLORS.bracket }}>{'[ '}</span>
          <span
            className="text-detail"
            style={{ color: colorValues['text-tertiary'] }}
          >
            ▼ {value.length} {value.length === 1 ? 'item' : 'items'}
          </span>
        </span>
        <div className="flex flex-col pl-[2ch]">
          {value.map((item, i) => (
            <div key={i}>
              <ValueRenderer
                value={item}
                inline={false}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
              {i < value.length - 1 && (
                <span style={{ color: SYNTAX_COLORS.bracket }}>,</span>
              )}
            </div>
          ))}
        </div>
        <span style={{ color: SYNTAX_COLORS.bracket }}>{']'}</span>
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
        <span style={{ color: SYNTAX_COLORS.bracket }}>{'['}</span>
        {value.slice(0, 3).map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>}
            <InlinePreview value={item} />
          </Fragment>
        ))}
        {value.length > 3 && (
          <span style={{ color: SYNTAX_COLORS.bracket }}>
            , ...+{value.length - 3}
          </span>
        )}
        <span style={{ color: SYNTAX_COLORS.bracket }}>{']'}</span>
      </span>
    </span>
  );
};

export const ArrayEntry = memo(ArrayEntryInner);
