export const parseRawHeaders = (raw: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!raw) return result;

  const lines = raw.trim().split('\r\n');
  for (const line of lines) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    result[key] = value;
  }

  return result;
};
