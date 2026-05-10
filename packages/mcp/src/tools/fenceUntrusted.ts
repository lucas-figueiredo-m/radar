const TRUNCATION_CAP_BYTES = 16 * 1024;

const OPEN_TAG = '<<<UNTRUSTED_DATA';
const CLOSE_TAG = '<<<END>>>';

const sanitizeId = (id: string): string =>
  id.replace(/[^A-Za-z0-9._:/-]/g, '_');

const stripDelimiters = (input: string): string =>
  input
    .split(OPEN_TAG)
    .join('<<<UNTRUSTED_DATA_REDACTED')
    .split(CLOSE_TAG)
    .join('<<<END_REDACTED>>>');

export const fenceUntrusted = (value: unknown, id: string): string => {
  const stringified = typeof value === 'string' ? value : JSON.stringify(value);
  const safe = stripDelimiters(stringified ?? '');
  const safeId = sanitizeId(id);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(safe);

  if (bytes.length <= TRUNCATION_CAP_BYTES) {
    return `${OPEN_TAG} id="${safeId}">>>${safe}${CLOSE_TAG}`;
  }

  const decoder = new TextDecoder('utf-8');
  const truncated = decoder.decode(bytes.slice(0, TRUNCATION_CAP_BYTES));
  return `${OPEN_TAG} id="${safeId}">>>${truncated}<<<TRUNCATED original_length=${bytes.length}>>>${CLOSE_TAG}`;
};
