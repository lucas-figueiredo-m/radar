const MAX_TEXT_LENGTH = 5000;

export const parseResponseBody = async (
  response: Response,
): Promise<unknown> => {
  const clone = response.clone();

  try {
    const text = await clone.text();
    try {
      return JSON.parse(text);
    } catch {
      return text.length > MAX_TEXT_LENGTH
        ? text.slice(0, MAX_TEXT_LENGTH) + '...'
        : text;
    }
  } catch {
    return '[Could not read body]';
  }
};
