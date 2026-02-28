import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/*.d.ts'],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
});
