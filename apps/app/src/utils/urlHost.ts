export const urlHost = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};
