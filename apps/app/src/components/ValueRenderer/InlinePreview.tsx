import { SYNTAX_COLORS } from './constants';

export type InlinePreviewProps = {
  value: unknown;
};

export const InlinePreview = ({ value }: InlinePreviewProps) => {
  if (value === null) return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined) return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;
  if (typeof value === 'string') return <span style={{ color: SYNTAX_COLORS.string }}>&quot;{value}&quot;</span>;
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
