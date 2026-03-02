import { colorValues } from '@radar/design-system';
import { MAX_RENDER_DEPTH, SYNTAX_COLORS } from './constants';
import { ErrorEntry } from './ErrorEntry';
import { ObjectEntry } from './ObjectEntry';
import { ArrayEntry } from './ArrayEntry';

export { SYNTAX_COLORS } from './constants';
export { ErrorEntry } from './ErrorEntry';
export type { ErrorEntryProps } from './ErrorEntry';
export { InlinePreview } from './InlinePreview';
export type { InlinePreviewProps } from './InlinePreview';
export { ObjectEntry } from './ObjectEntry';
export type { ObjectEntryProps } from './ObjectEntry';
export { ArrayEntry } from './ArrayEntry';
export type { ArrayEntryProps } from './ArrayEntry';

type MarkerObject = Record<string, unknown> & { __type: string };

const isMarker = (arg: object): arg is MarkerObject =>
  '__type' in arg && typeof (arg as MarkerObject).__type === 'string';

export type ValueRendererProps = {
  value: unknown;
  inline?: boolean;
  depth?: number;
  maxDepth?: number;
};

export const ValueRenderer = ({
  value,
  inline = true,
  depth = 0,
  maxDepth = MAX_RENDER_DEPTH,
}: ValueRendererProps) => {
  if (depth >= maxDepth)
    return (
      <span style={{ color: colorValues['text-tertiary'] }}>[max depth]</span>
    );

  if (value === null)
    return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined)
    return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;

  if (typeof value === 'string') {
    if (inline)
      return (
        <span style={{ color: colorValues['text-primary'] }}>{value}</span>
      );
    return (
      <span style={{ color: SYNTAX_COLORS.string }}>&quot;{value}&quot;</span>
    );
  }

  if (typeof value === 'number')
    return <span style={{ color: SYNTAX_COLORS.number }}>{value}</span>;
  if (typeof value === 'boolean')
    return (
      <span style={{ color: SYNTAX_COLORS.boolean }}>{String(value)}</span>
    );

  if (typeof value === 'object') {
    if (isMarker(value)) {
      switch (value.__type) {
        case 'Error':
          return (
            <ErrorEntry
              message={value.message as string}
              stack={value.stack as string | undefined}
            />
          );
        case 'Function':
          return (
            <span style={{ color: SYNTAX_COLORS.function }}>
              ƒ {value.name as string}()
            </span>
          );
        case 'Symbol':
          return (
            <span style={{ color: SYNTAX_COLORS.symbol }}>
              Symbol({value.description as string})
            </span>
          );
        case 'BigInt':
          return (
            <span style={{ color: SYNTAX_COLORS.number }}>
              {value.value as string}
            </span>
          );
        case 'Undefined':
          return (
            <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>
          );
        case 'Circular':
          return <span style={{ color: SYNTAX_COLORS.null }}>[Circular]</span>;
        case 'ReactElement':
          return (
            <span style={{ color: SYNTAX_COLORS.function }}>
              &lt;{value.name as string} /&gt;
            </span>
          );
        case 'Object':
          return (
            <span style={{ color: SYNTAX_COLORS.null }}>
              {value.preview as string}
            </span>
          );
        case 'Array':
          return (
            <span style={{ color: SYNTAX_COLORS.null }}>
              Array({value.length as number})
            </span>
          );
      }
    }

    if (Array.isArray(value))
      return <ArrayEntry value={value} depth={depth} maxDepth={maxDepth} />;
    return (
      <ObjectEntry
        value={value as Record<string, unknown>}
        depth={depth}
        maxDepth={maxDepth}
      />
    );
  }

  return (
    <span style={{ color: colorValues['text-primary'] }}>{String(value)}</span>
  );
};
