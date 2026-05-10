export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  elevated: 'var(--shadow-elevated)',
} as const;

export const shadowValues = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.4)',
  md: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.4)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.6), 0 4px 6px -4px rgba(0,0,0,0.5)',
  elevated: '0 8px 24px rgba(0,0,0,0.7)',
} as const;
