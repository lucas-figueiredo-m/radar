import { defineConfig } from 'tsup';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { resolve: true },
  target: 'es2020',
  platform: 'node',
  clean: true,
  sourcemap: true,
  treeshake: true,
  async onSuccess() {
    // Metro only statically resolves literal `require("x")` calls. esbuild
    // wraps inline requires in a `__require` helper that Metro ignores, which
    // prevents optional peer deps (@react-native-async-storage/async-storage,
    // react-native-mmkv) from being bundled. Rewrite back to `require(`.
    for (const file of ['dist/index.js', 'dist/index.mjs']) {
      const full = join(process.cwd(), file);
      const src = await readFile(full, 'utf8');
      const out = src.replace(/__require\(/g, 'require(');
      await writeFile(full, out);
    }
  },
});
