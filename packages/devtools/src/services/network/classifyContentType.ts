export type ResponseContentCategory =
  | 'json'
  | 'image'
  | 'html'
  | 'text'
  | 'pdf'
  | 'binary';

export const classifyContentType = (
  contentType: string | undefined,
): ResponseContentCategory => {
  if (!contentType) return 'json';

  const lower = contentType.toLowerCase();

  if (lower.includes('application/json') || lower.includes('+json'))
    return 'json';

  if (lower.startsWith('image/')) return 'image';

  if (lower.includes('text/html')) return 'html';

  if (lower.includes('application/pdf')) return 'pdf';

  if (
    lower.startsWith('text/') ||
    lower.includes('xml') ||
    lower.includes('css') ||
    lower.includes('javascript') ||
    lower.includes('ecmascript')
  )
    return 'text';

  if (
    lower.includes('application/octet-stream') ||
    lower.includes('application/zip') ||
    lower.includes('application/gzip') ||
    lower.includes('audio/') ||
    lower.includes('video/') ||
    lower.includes('font/')
  )
    return 'binary';

  return 'text';
};
