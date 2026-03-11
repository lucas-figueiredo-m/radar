const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  let value = Math.abs(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  const formatted = unitIndex === 0 ? value.toString() : value.toFixed(1);

  return `${formatted} ${UNITS[unitIndex]}`;
};
