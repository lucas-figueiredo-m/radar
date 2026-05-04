import { headersToRecord } from './headersToRecord';

export const parseHeaders = (
  headers: HeadersInit | undefined,
): Record<string, string> => {
  if (!headers) return {};

  if (headers instanceof Headers) {
    return headersToRecord(headers);
  }

  if (Array.isArray(headers)) {
    const result: Record<string, string> = {};
    for (const [key, value] of headers) {
      result[key] = value;
    }
    return result;
  }

  return { ...headers } as Record<string, string>;
};
