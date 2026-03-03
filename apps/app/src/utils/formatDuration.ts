export const formatDuration = (ms?: number): string => {
  if (ms === undefined) return '...';
  if (ms < 1000) return `${ms.toFixed(3)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
};
