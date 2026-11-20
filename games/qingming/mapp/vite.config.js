import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the single IIFE app.js + app.css the Discourse micro-app loader expects.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  define: { localStorage: '__qingmingStorage' },
  plugins: [{
    name: 'mapp-no-url-fonts',
    enforce: 'pre',
    // The platform rejects URL fonts; entry.js loads the packaged font with FontFace instead.
    transform(code, id) {
      if (id.endsWith('/src/style.css')) return code.replace(/@font-face\{[^}]*\}/g, '');
    },
  }],
  build: {
    outDir: '../../../dist/mapp/qingming/web',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: process.env.MINI_APP_DEBUG === '1' ? 'inline' : false,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./entry.js', import.meta.url)),
      name: 'QingmingMiniApp',
      formats: ['iife'],
      fileName: () => 'app.js',
      cssFileName: 'app',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
