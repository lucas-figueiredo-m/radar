const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export const verifyMcpOrigin = (origin: string | undefined): boolean => {
  if (origin === undefined || origin === '') return true;
  if (origin === 'null') return true;
  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};
