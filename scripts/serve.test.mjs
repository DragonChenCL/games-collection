import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let child, base, sandbox;

before(async () => {
  sandbox = await mkdtemp(join(tmpdir(), 'games-server-test-'));
  await mkdir(join(sandbox, 'scripts'));
  await mkdir(join(sandbox, 'dist/games/example'), { recursive: true });
  await cp(new URL('./serve.mjs', import.meta.url), join(sandbox, 'scripts/serve.mjs'));
  await writeFile(join(sandbox, 'dist/index.html'), '<h1>游戏合集</h1>');
  await writeFile(join(sandbox, 'dist/games/example/index.html'), '<h1>游戏</h1>');
  await writeFile(join(sandbox, 'dist/games/example/icon.svg'), '<svg/>');
  await writeFile(join(sandbox, 'dist/games/example/manifest.webmanifest'), '{}');
  await writeFile(join(sandbox, 'private.txt'), 'not public');
  child = spawn(process.execPath, [join(sandbox, 'scripts/serve.mjs')], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 5000);
    child.on('error', e => { clearTimeout(timeout); reject(e); });
    child.stdout.on('data', data => { const match = data.toString().match(/ready on port (\d+)/); if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); } });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
});

after(async () => { child?.kill(); if(sandbox) await rm(sandbox, { recursive: true, force: true }); });

test('serves the collection and each game with UTF-8 HTML', async () => {
  for (const path of ['/', '/games/example/']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html; charset=utf-8/);
    assert.match(await response.text(), /游戏/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('normalizes directory URLs so relative game assets load', async () => {
  const response = await fetch(base + '/games/example', { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/games/example/');
});

test('encoded authority and dot segments cannot become an external redirect', async () => {
  const response = await fetch(base + '/%2fattacker.example%2f..%2fgames%2fexample', { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/games/example/');
  assert.equal(new URL(response.headers.get('location'), base).origin, base);
});

test('serves SVG and install manifests with correct MIME types', async () => {
  assert.equal((await fetch(base + '/games/example/icon.svg')).headers.get('content-type'), 'image/svg+xml');
  assert.equal((await fetch(base + '/games/example/manifest.webmanifest')).headers.get('content-type'), 'application/manifest+json');
});

test('returns 404 for missing assets and rejects encoded traversal', async () => {
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  const response = await fetch(base + '/..%2fprivate.txt');
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /not public/);
});

test('malformed paths do not terminate the server', async () => {
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 404);
  assert.equal((await fetch(base + '/')).status, 200);
});
