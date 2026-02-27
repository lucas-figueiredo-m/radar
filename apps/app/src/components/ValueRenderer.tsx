import { Fragment } from 'react';
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

const renderError = (arg: { message: string; stack?: string }) => (
  <span style={{ color: colorValues['status-error'] }}>
    Error: {arg.message}
    {arg.stack ? '\n' + arg.stack : ''}
  </span>
);

const isErrorObject = (arg: object): arg is { __type: 'Error'; message: string; stack?: string } =>
  '__type' in arg && (arg as Record<string, unknown>).__type === 'Error';

const renderObject = (value: object, inline: boolean) => {
  const entries = Object.entries(value as Record<string, unknown>);
  const displayEntries = inline ? entries.slice(0, 3) : entries;
  const overflow = inline && entries.length > 3;

  return (
    <span>
      <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
      {displayEntries.map(([k, v], i) => (
        <Fragment key={k}>
          {i > 0 && <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>}
          <span style={{ color: SYNTAX_COLORS.key }}>{k}</span>
          <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
          <ValueRenderer value={v} inline={false} />
        </Fragment>
      ))}
      {overflow && (
        <span style={{ color: SYNTAX_COLORS.bracket }}>, ...+{entries.length - 3}</span>
      )}
      <span style={{ color: SYNTAX_COLORS.bracket }}>{' }'}</span>
    </span>
  );
};

const renderArray = (value: unknown[]) => (
  <span>
    <span style={{ color: SYNTAX_COLORS.bracket }}>[</span>
    {value.map((item, i) => (
      <Fragment key={i}>
        {i > 0 && <span style={{ color: SYNTAX_COLORS.bracket }}>, </span>}
        <ValueRenderer value={item} inline={false} />
      </Fragment>
    ))}
    <span style={{ color: SYNTAX_COLORS.bracket }}>]</span>
  </span>
);

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
    if (isErrorObject(value)) return renderError(value);
    if (Array.isArray(value)) return renderArray(value);
    return renderObject(value, inline);
  }

  return <span style={{ color: colorValues['text-primary'] }}>{String(value)}</span>;
};
