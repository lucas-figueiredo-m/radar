import { memo, useState } from 'react';
import { colorValues } from '@radar/design-system';
import { MAX_RENDER_DEPTH, SYNTAX_COLORS } from './constants';
import { ValueRenderer } from './index';

export type ReactElementEntryProps = {
  name: string;
  props: Record<string, unknown>;
  keyProp: string | null;
  refProp: unknown;
  depth?: number;
  maxDepth?: number;
};

const ReactElementEntryInner = ({
  name,
  props,
  keyProp,
  refProp,
  depth = 0,
  maxDepth = MAX_RENDER_DEPTH,
}: ReactElementEntryProps) => {
  const [expanded, setExpanded] = useState(false);

  const tag = (
    <span style={{ color: SYNTAX_COLORS.function }}>&lt;{name} /&gt;</span>
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
            <span style={{ color: SYNTAX_COLORS.key }}>props</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <ValueRenderer
              value={props}
              inline={false}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          </div>
          <div>
            <span style={{ color: SYNTAX_COLORS.key }}>key</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <ValueRenderer
              value={keyProp}
              inline={false}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          </div>
          <div>
            <span style={{ color: SYNTAX_COLORS.key }}>ref</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <ValueRenderer
              value={refProp}
              inline={false}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
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
      <span className="truncate">
        {tag} <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
        <span style={{ color: SYNTAX_COLORS.key }}>key</span>
        <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
        <ValueRenderer
          value={keyProp}
          inline={false}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
        <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>
        <span style={{ color: SYNTAX_COLORS.key }}>ref</span>
        <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
        <ValueRenderer
          value={refProp}
          inline={false}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
        <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>
        <span style={{ color: SYNTAX_COLORS.key }}>props</span>
        <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
        <ValueRenderer
          value={props}
          inline={false}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
        <span style={{ color: SYNTAX_COLORS.bracket }}>{' }'}</span>
      </span>
    </span>
  );
};

export const ReactElementEntry = memo(ReactElementEntryInner);
