import { Fragment, useState, useMemo } from 'react';
import { colorValues } from '@radar/design-system';

const SYNTAX_COLORS = {
  string: colorValues['syntax-string'],
  number: colorValues['syntax-number'],
  boolean: colorValues['syntax-boolean'],
  null: colorValues['syntax-null'],
  undefined: colorValues['syntax-null'],
  key: colorValues['syntax-key'],
  function: colorValues['syntax-function'],
  symbol: colorValues['syntax-symbol'],
  bracket: colorValues['syntax-bracket'],
};

interface ParsedFrame {
  functionName: string;
  fileName: string;
  line: number;
  column: number;
}

const parseStackTrace = (stack: string): ParsedFrame[] => {
  return stack
    .split('\n')
    .filter((line) => line.trimStart().startsWith('at '))
    .map((line) => {
      const trimmed = line.trim();
      // Pattern: "at functionName (file:line:col)"
      const withFn = trimmed.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
      if (withFn) {
        return {
          functionName: withFn[1],
          fileName: withFn[2],
          line: Number(withFn[3]),
          column: Number(withFn[4]),
        };
      }
      // Pattern: "at file:line:col"
      const withoutFn = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
      if (withoutFn) {
        return {
          functionName: '<anonymous>',
          fileName: withoutFn[1],
          line: Number(withoutFn[2]),
          column: Number(withoutFn[3]),
        };
      }
      return null;
    })
    .filter((frame): frame is ParsedFrame => frame !== null);
};

const ErrorEntry = ({ message, stack }: { message: string; stack?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const frames = useMemo(() => (stack ? parseStackTrace(stack) : []), [stack]);

  return (
    <span className="inline-flex flex-col">
      <span style={{ color: colorValues['status-error'] }}>Error: {message}</span>
      {frames.length > 0 && (
        <>
          <span
            onClick={() => setExpanded((prev) => !prev)}
            className="cursor-pointer select-none text-[11px]"
            style={{ color: colorValues['text-tertiary'] }}
          >
            {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} stack trace ({frames.length}{' '}
            {frames.length === 1 ? 'frame' : 'frames'})
          </span>
          {expanded && (
            <span className="flex flex-col pl-2 pt-0.5 text-[11px]">
              {frames.map((frame, i) => (
                <span key={i}>
                  <span style={{ color: colorValues['text-primary'] }}>{frame.functionName}</span>
                  <span style={{ color: colorValues['text-tertiary'] }} className="hover:underline">
                    {' '}
                    {frame.fileName}:{frame.line}:{frame.column}
                  </span>
                </span>
              ))}
            </span>
          )}
        </>
      )}
    </span>
  );
};

const isErrorObject = (arg: object): arg is { __type: 'Error'; message: string; stack?: string } =>
  '__type' in arg && (arg as Record<string, unknown>).__type === 'Error';

const ObjectEntry = ({ value }: { value: Record<string, unknown> }) => {
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
          <span className="text-[11px]" style={{ color: colorValues['text-tertiary'] }}>
            ▼ {entries.length} {entries.length === 1 ? 'key' : 'keys'}
          </span>
        </span>
        <div className="flex flex-col pl-[2ch]">
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span style={{ color: SYNTAX_COLORS.key }}>{k}</span>
              <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
              <ValueRenderer value={v} inline={false} />
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
      <span className="shrink-0 text-[11px] select-none" style={{ color: colorValues['text-tertiary'] }}>
        ▶
      </span>
      <span className="truncate">
        <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
        {entries.slice(0, 3).map(([k, v], i) => (
          <Fragment key={k}>
            {i > 0 && <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>}
            <span style={{ color: SYNTAX_COLORS.key }}>{k}</span>
            <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
            <ValueRenderer value={v} inline={false} />
          </Fragment>
        ))}
        {hasOverflow && (
          <span style={{ color: SYNTAX_COLORS.bracket }}>, ...+{entries.length - 3}</span>
        )}
        <span style={{ color: SYNTAX_COLORS.bracket }}>{' }'}</span>
      </span>
    </span>
  );
};

const InlinePreview = ({ value }: { value: unknown }) => {
  if (value === null) return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined) return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;
  if (typeof value === 'string') return <span style={{ color: SYNTAX_COLORS.string }}>"{value}"</span>;
  if (typeof value === 'number') return <span style={{ color: SYNTAX_COLORS.number }}>{value}</span>;
  if (typeof value === 'boolean') return <span style={{ color: SYNTAX_COLORS.boolean }}>{String(value)}</span>;
  if (Array.isArray(value))
    return <span style={{ color: SYNTAX_COLORS.bracket }}>Array({value.length})</span>;
  if (typeof value === 'function')
    return <span style={{ color: SYNTAX_COLORS.function }}>Function</span>;
  if (typeof value === 'object')
    return <span style={{ color: SYNTAX_COLORS.bracket }}>Object</span>;
  return <span>{String(value)}</span>;
};

const ArrayEntry = ({ value }: { value: unknown[] }) => {
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
          <span className="text-[11px]" style={{ color: colorValues['text-tertiary'] }}>
            ▼ {value.length} {value.length === 1 ? 'item' : 'items'}
          </span>
        </span>
        <div className="flex flex-col pl-[2ch]">
          {value.map((item, i) => (
            <div key={i}>
              <ValueRenderer value={item} inline={false} />
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
      <span className="shrink-0 text-[11px] select-none" style={{ color: colorValues['text-tertiary'] }}>
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
          <span style={{ color: SYNTAX_COLORS.bracket }}>, ...+{value.length - 3}</span>
        )}
        <span style={{ color: SYNTAX_COLORS.bracket }}>{']'}</span>
      </span>
    </span>
  );
};

interface ValueRendererProps {
  value: unknown;
  inline?: boolean;
}

export const ValueRenderer = ({ value, inline = true }: ValueRendererProps) => {
  if (value === null) return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined) return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;

  if (typeof value === 'string') {
    // Top-level inline strings (direct console.log args) stay default text color
    // Nested strings (inside objects/arrays) render in green with quotes
    if (inline) return <span style={{ color: colorValues['text-primary'] }}>{value}</span>;
    return <span style={{ color: SYNTAX_COLORS.string }}>"{value}"</span>;
  }

  if (typeof value === 'number') return <span style={{ color: SYNTAX_COLORS.number }}>{value}</span>;
  if (typeof value === 'boolean') return <span style={{ color: SYNTAX_COLORS.boolean }}>{String(value)}</span>;

  if (typeof value === 'object') {
    if (isErrorObject(value)) return <ErrorEntry message={value.message} stack={value.stack} />;
    if (Array.isArray(value)) return <ArrayEntry value={value} />;
    return <ObjectEntry value={value as Record<string, unknown>} />;
  }

  return <span style={{ color: colorValues['text-primary'] }}>{String(value)}</span>;
};
