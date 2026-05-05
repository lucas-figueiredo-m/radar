export const verifyOrigin = (
  origin: string,
  host: string | undefined,
): boolean => {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};
