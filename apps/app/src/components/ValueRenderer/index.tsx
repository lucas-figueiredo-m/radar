import { colorValues } from '@radar/design-system';
import { SYNTAX_COLORS } from './constants';
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

const isErrorObject = (arg: object): arg is { __type: 'Error'; message: string; stack?: string } =>
  '__type' in arg && (arg as Record<string, unknown>).__type === 'Error';

export type ValueRendererProps = {
  value: unknown;
  inline?: boolean;
};

export const ValueRenderer = ({ value, inline = true }: ValueRendererProps) => {
  if (value === null) return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  if (value === undefined) return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;

  if (typeof value === 'string') {
    // Top-level inline strings (direct console.log args) stay default text color
    // Nested strings (inside objects/arrays) render in green with quotes
    if (inline) return <span style={{ color: colorValues['text-primary'] }}>{value}</span>;
    return <span style={{ color: SYNTAX_COLORS.string }}>&quot;{value}&quot;</span>;
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
