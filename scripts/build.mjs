import { access, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function buildCollection(root = new URL('../', import.meta.url)) {
  const dist = new URL('dist/', root);
  const manifest = JSON.parse(await readFile(new URL('games/qingming/.vite/manifest.json', dist), 'utf8'));
  const font = manifest['src/song.woff2']?.file;
  if (!font) throw new Error('Qingming build has no Song font');
  await access(new URL(`games/qingming/${font}`, dist));
  const template = await readFile(new URL('index.html', root), 'utf8');
  const source = './games/qingming/song.woff2';
  if (!template.includes(source)) throw new Error('Collection font reference not found');
  await writeFile(new URL('index.html', dist), template.replaceAll(source, `./games/qingming/${font}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildCollection();
