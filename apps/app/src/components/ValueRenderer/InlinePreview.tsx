import { SYNTAX_COLORS } from './constants';

export type InlinePreviewProps = {
  value: unknown;
};

type MarkerObject = Record<string, unknown> & { __type: string };

const isMarker = (arg: object): arg is MarkerObject =>
  '__type' in arg && typeof (arg as MarkerObject).__type === 'string';

const renderMarker = (marker: MarkerObject) => {
  switch (marker.__type) {
    case 'Function': {
      const params = marker.params as string[] | undefined;
      const signature = params && params.length > 0 ? params.join(', ') : '';
      return (
        <span style={{ color: SYNTAX_COLORS.function }}>
          ƒ {marker.name as string}({signature})
        </span>
      );
    }
    case 'Symbol':
      return (
        <span style={{ color: SYNTAX_COLORS.symbol }}>
          Symbol({marker.description as string})
        </span>
      );
    case 'BigInt':
      return (
        <span style={{ color: SYNTAX_COLORS.number }}>
          {marker.value as string}
        </span>
      );
    case 'Undefined':
      return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;
    case 'Circular': {
      const keys = marker.keys as string[] | undefined;
      const keysPreview =
        keys && keys.length > 0 ? `: {${keys.join(', ')}}` : '';
      return (
        <span style={{ color: SYNTAX_COLORS.null }}>
          [Circular{keysPreview}]
        </span>
      );
    }
    case 'ReactElement':
      return (
        <span style={{ color: SYNTAX_COLORS.function }}>
          &lt;{marker.name as string} /&gt;
        </span>
      );
    case 'Error':
      return (
        <span style={{ color: SYNTAX_COLORS.null }}>
          Error: {marker.message as string}
        </span>
      );
    case 'Object':
      return (
        <span style={{ color: SYNTAX_COLORS.bracket }}>
          {marker.preview as string}
        </span>
      );
    case 'Array':
      return (
        <span style={{ color: SYNTAX_COLORS.bracket }}>
          Array({marker.length as number})
        </span>
      );
    default:
      return <span style={{ color: SYNTAX_COLORS.bracket }}>Object</span>;
  }
};

export const InlinePreview = ({ value }: InlinePreviewProps) => {
  if (value === null)
    return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined)
    return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;
  if (typeof value === 'string')
    return (
      <span style={{ color: SYNTAX_COLORS.string }}>&quot;{value}&quot;</span>
    );
  if (typeof value === 'number')
    return <span style={{ color: SYNTAX_COLORS.number }}>{value}</span>;
  if (typeof value === 'boolean')
    return (
      <span style={{ color: SYNTAX_COLORS.boolean }}>{String(value)}</span>
    );
  if (Array.isArray(value))
    return (
      <span style={{ color: SYNTAX_COLORS.bracket }}>
        Array({value.length})
      </span>
    );
  if (typeof value === 'function')
    return <span style={{ color: SYNTAX_COLORS.function }}>Function</span>;
  if (typeof value === 'object') {
    if (isMarker(value)) return renderMarker(value);
    return <span style={{ color: SYNTAX_COLORS.bracket }}>Object</span>;
  }
  return <span>{String(value)}</span>;
};
