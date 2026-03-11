import { classifyContentType } from './classifyContentType';
import { arrayBufferToBase64 } from './arrayBufferToBase64';
import { formatBytes } from './formatBytes';

const MAX_TEXT_LENGTH = 50_000;
const MAX_BINARY_SIZE = 500_000;

export const parseResponseBody = async (
  response: Response,
): Promise<unknown> => {
  const clone = response.clone();
  const contentType = clone.headers.get('content-type') ?? undefined;
  const category = classifyContentType(contentType);

  try {
    switch (category) {
      case 'json': {
        const text = await clone.text();
        try {
          return JSON.parse(text);
        } catch {
          return text.length > MAX_TEXT_LENGTH
            ? text.slice(0, MAX_TEXT_LENGTH) + '...'
            : text;
        }
      }

      case 'image': {
        const buffer = await clone.arrayBuffer();
        if (buffer.byteLength > MAX_BINARY_SIZE) {
          return `[Binary: ${contentType ?? 'image'}, ${formatBytes(buffer.byteLength)}]`;
        }
        const base64 = arrayBufferToBase64(buffer);
        return `data:${contentType?.split(';')[0] ?? 'image/png'};base64,${base64}`;
      }

      case 'html':
      case 'text': {
        const text = await clone.text();
        return text.length > MAX_TEXT_LENGTH
          ? text.slice(0, MAX_TEXT_LENGTH) + '...'
          : text;
      }

      case 'pdf':
      case 'binary': {
        const buffer = await clone.arrayBuffer();
        return `[Binary: ${contentType ?? 'application/octet-stream'}, ${formatBytes(buffer.byteLength)}]`;
      }
    }
  } catch {
    return '[Could not read body]';
  }
};
