import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'ws',
                'bufferutil',
                'utf-8-validate',
                'better-sqlite3',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart: ({ reload }) => reload(),
      },
    ]),
  ],
});
