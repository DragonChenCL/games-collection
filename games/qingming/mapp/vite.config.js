import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the single IIFE app.js + app.css the Discourse micro-app loader expects.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  define: { localStorage: '__qingmingStorage' },
  plugins: [{
    name: 'mapp-adapt-game',
    enforce: 'pre',
    transform(code, id) {
      // The platform rejects URL fonts; entry.js loads the packaged font with FontFace instead.
      if (id.endsWith('/src/style.css')) return code.replace(/@font-face\{[^}]*\}/g, '');
      if (/\/src\/[^/]+\.js$/.test(id)) {
        // The platform enforces Trusted Types; html.js builds the nodes without an HTML sink.
        code = code.replace(/\.innerHTML\s*=(?!=)/g, '.mappHtml=');
        if (/innerHTML|outerHTML|insertAdjacentHTML/.test(code)) throw Error(`${id}: HTML sink the micro-app build cannot adapt`);
        if (!id.endsWith('/src/main.js')) return code;
        // An IIFE bundle runs every module at load, so the game body becomes a function that
        // entry.js calls once the save has been read from the platform.
        const imports = [], body = [];
        for (const line of code.split('\n')) (/^import\s/.test(line) ? imports : body).push(line);
        if (body.some(line => /^\s*(import|export)\s/.test(line))) throw Error('main.js: unexpected import/export in the game body');
        return `${imports.join('\n')}\nexport function startGame() {\n${body.join('\n')}\n}\n`;
      }
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
  },
});
