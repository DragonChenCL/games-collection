// Discourse micro-app entry: routes saves, the font and fullscreen through the platform SDK, then starts the game.
import { SAVE_KEY } from '../src/game.js';

const sdk = globalThis.miniApp ?? null;
const has = permission => Boolean(sdk?.permissions.has(permission));
const within = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(Error('TIMEOUT')), ms))]);

async function loadSave() {
  if (!has('storage.read')) return null;
  try { return await within(sdk.localStorage.getItem(SAVE_KEY), 4000); } catch { return null; }
}

async function loadFont() {
  const bytes = await sdk.assets.readBytes('fonts/song.woff2');
  document.fonts.add(await new FontFace('Song', bytes, { weight: '400' }).load());
}

function installStorage(saved) {
  const values = new Map(saved === null ? [] : [[SAVE_KEY, saved]]);
  let pending = null, writing = false;
  async function flush() {
    if (writing) return;
    writing = true;
    while (pending) {
      const [key, value] = pending;
      pending = null;
      try { await sdk.localStorage.setItem(key, value); } catch (error) { console.warn('[qingming] save failed', error); }
    }
    writing = false;
  }
  globalThis.__qingmingStorage = {
    getItem: key => values.get(String(key)) ?? null,
    setItem(key, value) {
      if (!has('storage.write')) throw Error('STORAGE_UNAVAILABLE');
      values.set(String(key), String(value));
      pending = [String(key), String(value)];
      void flush();
    },
  };
}

function adaptPage() {
  // The collection home page does not exist inside the micro-app container.
  for (const link of document.querySelectorAll('a[href="../../"]')) link.remove();
  const button = document.querySelector('#fullscreen');
  if (!button) return;
  if (!has('fullscreen')) { button.hidden = true; return; }
  let full = false;
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) full = false; });
  button.onclick = async () => {
    try {
      if (full) { full = false; await sdk.fullscreen.exit(); }
      else { await sdk.fullscreen.request(); full = true; }
    } catch { full = false; }
  };
}

async function start() {
  let saved = null;
  if (sdk) {
    try { await sdk.ready; } catch (error) { console.warn('[qingming] SDK unavailable', error); }
    const font = loadFont().catch(error => console.warn('[qingming] font unavailable', error));
    [saved] = await Promise.all([loadSave(), within(font, 3000).catch(() => {})]);
  }
  installStorage(saved);
  try {
    await import('../src/main.js');
    adaptPage();
  } catch (error) {
    console.error(error);
    document.querySelector('#app').textContent = '游戏加载失败，请刷新后重试。';
  }
  try { await sdk?.lifecycle.ready(); } catch {}
}

start();
