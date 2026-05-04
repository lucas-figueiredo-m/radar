import { colorValues } from '@radar/design-system';

export const statusColor = (status?: number): string => {
  if (!status || status === 0) return colorValues['status-error'];
  if (status < 300) return colorValues['status-success'];
  if (status < 400) return colorValues['status-warning'];
  return colorValues['status-error'];
};
