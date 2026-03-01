export const getDurationColor = (ms: number): string => {
  if (ms <= 1) return '#4ade80'; // green
  if (ms <= 5) return '#facc15'; // yellow
  if (ms <= 16) return '#fb923c'; // orange
  return '#f87171'; // red
};
