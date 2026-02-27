export const shortenPath = (filePath: string, segments: number = 2): string => {
  const parts = filePath.split('/');

  if (parts.length <= segments) {
    return filePath;
  }

  return parts.slice(-segments).join('/');
};
