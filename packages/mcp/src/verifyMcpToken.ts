import crypto from 'node:crypto';

export const verifyMcpToken = (
  authorization: string | undefined,
  expected: string,
): boolean => {
  if (!authorization || !authorization.startsWith('Bearer ')) return false;
  const provided = authorization.slice('Bearer '.length);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
