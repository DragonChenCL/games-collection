import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));

// Builds the one classic script the Xiaohongshu mini-tool container accepts (no modules, Chrome 61).
export default defineConfig({
  root: here,
  publicDir: false,
  define: { __SNAPSHOT__: readFileSync(here + 'snapshot.json', 'utf8') },
  build: {
    outDir: '../../../dist/minitool/gold-rooftop/package',
    emptyOutDir: true,
    target: ['es2017', 'chrome61'],
    lib: { entry: here + 'entry.js', formats: ['iife'], name: 'GoldRooftop', fileName: () => 'main.js' },
  },
});
