export const formatArg = (arg: unknown): string => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (
    typeof arg === 'object' &&
    arg !== null &&
    '__type' in (arg as Record<string, unknown>) &&
    (arg as Record<string, unknown>).__type === 'Error'
  ) {
    const err = arg as { message: string; stack?: string };
    return `Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};
