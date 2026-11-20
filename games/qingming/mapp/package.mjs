// Packs the built micro-app into dist/mapp/qingming/package/app.zip with the linux-do SDK packer.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GUIDE_REPO = 'https://github.com/linux-do/mapp-developer-guide';
const GUIDE_COMMIT = '44141fbee68fd5f783f5c2bd0e662fad28cf3556';
const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const out = path('../../../dist/mapp/qingming/');

async function sdkDirectory() {
  if (process.env.MINI_APP_SDK_DIR) return process.env.MINI_APP_SDK_DIR;
  const cache = path(`../../../node_modules/.cache/mapp-developer-guide-${GUIDE_COMMIT.slice(0, 12)}`);
  if (!existsSync(`${cache}/sdk/pack.mjs`)) {
    await mkdir(cache, { recursive: true });
    const git = (...args) => execFileSync('git', ['-C', cache, ...args], { stdio: 'inherit' });
    git('init', '-q');
    git('fetch', '-q', '--depth', '1', GUIDE_REPO, GUIDE_COMMIT);
    git('checkout', '-q', 'FETCH_HEAD');
  }
  return `${cache}/sdk`;
}

const { pack } = await import(pathToFileURL(`${await sdkDirectory()}/pack.mjs`).href);
const manifest = JSON.parse(await readFile(path('./manifest.json'), 'utf8'));
manifest.id = process.env.MINI_APP_ID || manifest.id;
manifest.version = process.env.MINI_APP_VERSION || manifest.version;
const files = {
  'index.html': await readFile(path('./template.html')),
  'app.js': await readFile(`${out}web/app.js`),
  'app.css': await readFile(`${out}web/app.css`),
  'strings.json': await readFile(path('./strings.json')),
  'fonts/song.woff2': await readFile(path('../src/song.woff2')),
};
const result = await pack({ manifest, files, outputDirectory: `${out}package` });
console.log(`Created ${result.file} (${result.size} bytes), app ${manifest.id}, version ${manifest.version}`);
