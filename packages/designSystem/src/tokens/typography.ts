export const fontFamily = {
  mono: 'var(--font-mono)',
  ui: 'var(--font-ui)',
  display: 'var(--font-display)',
} as const;

export const fontFamilyValues = {
  mono: 'JetBrains Mono, SF Mono, Menlo, Monaco, monospace',
  ui: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  display: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

export const fontSize = {
  caption: 'var(--text-caption)',
  detail: 'var(--text-detail)',
  xs: 'var(--text-xs)',
  body: 'var(--text-body)',
  sm: 'var(--text-sm)',
  base: 'var(--text-base)',
} as const;

export const fontSizeValues = {
  caption: '10px',
  detail: '11px',
  xs: '0.75rem',
  body: '13px',
  sm: '0.875rem',
  base: '1rem',
} as const;

export const fontWeight = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
} as const;

export const fontWeightValues = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  relaxed: 'var(--leading-relaxed)',
} as const;

export const lineHeightValues = {
  relaxed: '1.625',
} as const;
