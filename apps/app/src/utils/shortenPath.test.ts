import { describe, it, expect } from 'vitest';
import { shortenPath } from './shortenPath';

describe('shortenPath', () => {
  it('returns last 2 segments by default', () => {
    expect(shortenPath('src/components/App.tsx')).toBe('components/App.tsx');
  });

  it('returns full path when fewer segments than requested', () => {
    expect(shortenPath('App.tsx')).toBe('App.tsx');
  });

  it('returns full path when exactly the requested segments', () => {
    expect(shortenPath('src/App.tsx')).toBe('src/App.tsx');
  });

  it('supports custom segment count', () => {
    expect(shortenPath('src/components/screens/Home.tsx', 3)).toBe(
      'components/screens/Home.tsx',
    );
  });

  it('handles deeply nested paths', () => {
    expect(shortenPath('a/b/c/d/e/f.tsx')).toBe('e/f.tsx');
  });
});
