import { memo, useState } from 'react';
import { colorValues } from '@radar/design-system';
import { SYNTAX_COLORS } from './constants';

export type FunctionEntryProps = {
  name: string;
  length: number;
  params: string[];
};

const FunctionEntryInner = ({ name, length, params }: FunctionEntryProps) => {
  const [expanded, setExpanded] = useState(false);

  const signature = params.length > 0 ? params.join(', ') : '';

  const tag = (
    <span style={{ color: SYNTAX_COLORS.function }}>
      ƒ {name}({signature})
    </span>
  );

  if (expanded) {
    return (
      <div className="flex flex-col">
        <span
          onClick={() => setExpanded(false)}
          className="cursor-pointer select-none"
        >
          {tag}{' '}
          <span
            className="text-detail"
            style={{ color: colorValues['text-tertiary'] }}
          >
            ▼
          </span>
        </span>
        <div className="flex flex-col pl-[2ch]">
          <div>
            <span style={{ color: SYNTAX_COLORS.key }}>length</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <span style={{ color: SYNTAX_COLORS.number }}>{length}</span>
          </div>
          <div>
            <span style={{ color: SYNTAX_COLORS.key }}>name</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <span style={{ color: SYNTAX_COLORS.string }}>
              &quot;{name}&quot;
            </span>
          </div>
        </div>
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
      <span className="truncate">{tag}</span>
    </span>
  );
};

export const FunctionEntry = memo(FunctionEntryInner);
