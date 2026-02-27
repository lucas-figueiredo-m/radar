export const buildSearchRegex = (input: string): RegExp | null => {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const regexMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  if (regexMatch) {
    try {
      return new RegExp(regexMatch[1], regexMatch[2]);
    } catch {
      return null;
    }
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
};
