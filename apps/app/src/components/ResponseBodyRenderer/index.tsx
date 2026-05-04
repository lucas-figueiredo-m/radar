import { ValueRenderer } from '../ValueRenderer';
import { ImagePreview } from './ImagePreview';
import { TextPreview } from './TextPreview';
import { BinaryIndicator } from './BinaryIndicator';

export { ImagePreview } from './ImagePreview';
export { TextPreview } from './TextPreview';
export { BinaryIndicator } from './BinaryIndicator';

type ResponseBodyRendererProps = {
  body: unknown;
  contentType: string | undefined;
};

const isDataUri = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('data:image/');

const isBinaryPlaceholder = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('[Binary:');

const isHtmlContent = (contentType: string | undefined): boolean =>
  contentType?.toLowerCase().includes('text/html') ?? false;

const isTextContent = (contentType: string | undefined): boolean => {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return (
    lower.startsWith('text/') ||
    lower.includes('xml') ||
    lower.includes('css') ||
    lower.includes('javascript')
  );
};

const getTextLanguage = (
  contentType: string | undefined,
): string | undefined => {
  if (!contentType) return undefined;
  const lower = contentType.toLowerCase();
  if (lower.includes('xml')) return 'xml';
  if (lower.includes('css')) return 'css';
  if (lower.includes('javascript')) return 'js';
  return undefined;
};

export const ResponseBodyRenderer = ({
  body,
  contentType,
}: ResponseBodyRendererProps) => {
  if (isDataUri(body)) {
    return <ImagePreview dataUri={body} />;
  }

  if (isBinaryPlaceholder(body)) {
    return <BinaryIndicator label={body} />;
  }

  if (isHtmlContent(contentType) && typeof body === 'string') {
    return <TextPreview text={body} language="html" />;
  }

  if (isTextContent(contentType) && typeof body === 'string') {
    return <TextPreview text={body} language={getTextLanguage(contentType)} />;
  }

  return <ValueRenderer value={body} inline={false} />;
};
