import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCollection } from './build.mjs';

test('collection uses the emitted game font under any project subdirectory', async t => {
  const path = await mkdtemp(join(tmpdir(), 'collection-build-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  const root = pathToFileURL(path + '/');
  await mkdir(new URL('dist/games/qingming/.vite/', root), { recursive: true });
  await mkdir(new URL('dist/games/qingming/assets/', root));
  await writeFile(new URL('index.html', root), "<style>@font-face{src:url('./games/qingming/song.woff2')}</style>");
  await writeFile(new URL('dist/games/qingming/assets/song-test.woff2', root), 'font');
  const manifest = new URL('dist/games/qingming/.vite/manifest.json', root);
  await writeFile(manifest, JSON.stringify({ 'src/song.woff2': { file: 'assets/song-test.woff2' } }));
  await buildCollection(root);
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  const ref = html.match(/url\('([^']+)'\)/)[1];
  assert.equal(new URL(ref, 'https://example.org/any-project/').pathname, '/any-project/games/qingming/assets/song-test.woff2');
  assert.equal(await readFile(new URL('dist/' + ref, root), 'utf8'), 'font');
  await writeFile(manifest, '{}');
  await assert.rejects(buildCollection(root), /no Song font/);
});
