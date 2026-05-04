export const parseRequestBody = (
  body: BodyInit | null | undefined,
): unknown => {
  if (!body) return undefined;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return '[Binary/FormData]';
};
