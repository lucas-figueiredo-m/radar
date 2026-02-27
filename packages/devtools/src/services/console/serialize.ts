export const serialize = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;
  if (value instanceof Error)
    return { __type: 'Error', message: value.message, stack: value.stack };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};
