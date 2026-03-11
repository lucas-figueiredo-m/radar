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
          const size = formatBytes(buffer.byteLength);
          return `[Binary: ${contentType ?? 'image'}, ${size}]`;
        }
        const base64 = arrayBufferToBase64(buffer);
        const mime = contentType?.split(';')[0] ?? 'image/png';
        return `data:${mime};base64,${base64}`;
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
        const type = contentType ?? 'application/octet-stream';
        const size = formatBytes(buffer.byteLength);
        return `[Binary: ${type}, ${size}]`;
      }
    }
  } catch {
    return '[Could not read body]';
  }
};
