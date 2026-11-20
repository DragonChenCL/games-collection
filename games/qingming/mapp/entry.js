// Discourse micro-app entry: routes saves, the font and fullscreen through the platform SDK, then starts the game.
import { SAVE_KEY } from '../src/game.js';
import { startGame } from '../src/main.js';

const sdk = globalThis.miniApp ?? null;
const has = permission => Boolean(sdk?.permissions.has(permission));
const within = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(Error('TIMEOUT')), ms))]);

// Resolves to { value, readable }; an unreadable save must never be overwritten by a fresh game.
async function loadSave() {
  if (!has('storage.read')) return { value: null, readable: true };
  try { return { value: await within(sdk.localStorage.getItem(SAVE_KEY), 8000), readable: true }; }
  catch (error) { console.warn('[qingming] save unreadable', error); return { value: null, readable: false }; }
}

async function loadFont() {
  const bytes = await sdk.assets.readBytes('fonts/song.woff2');
  document.fonts.add(await new FontFace('Song', bytes, { weight: '400' }).load());
}

function installStorage({ value, readable }) {
  const values = new Map(value === null ? [] : [[SAVE_KEY, value]]);
  const writable = readable && has('storage.write');
  let pending = null, writing = false, failed = false;
  async function flush() {
    if (writing) return;
    writing = true;
    while (pending) {
      const entry = pending;
      pending = null;
      try { await sdk.localStorage.setItem(...entry); failed = false; }
      catch (error) { console.warn('[qingming] save failed', error); failed = true; pending ??= entry; break; }
    }
    writing = false;
  }
  globalThis.__qingmingStorage = {
    getItem: key => values.get(String(key)) ?? null,
    // Throwing makes the game show its own "progress not saved" notice.
    setItem(key, value) {
      if (!writable) throw Error('STORAGE_UNAVAILABLE');
      values.set(String(key), String(value));
      pending = [String(key), String(value)];
      const lastWriteFailed = failed;
      void flush();
      if (lastWriteFailed) throw Error('STORAGE_WRITE_FAILED');
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
  let save = { value: null, readable: true };
  if (sdk) {
    try { await sdk.ready; } catch (error) { console.warn('[qingming] SDK unavailable', error); }
    const font = loadFont().catch(error => console.warn('[qingming] font unavailable', error));
    [save] = await Promise.all([loadSave(), within(font, 3000).catch(() => {})]);
  }
  installStorage(save);
  try {
    startGame();
    adaptPage();
  } catch (error) {
    console.error(error);
    document.querySelector('#app').textContent = '游戏加载失败，请刷新后重试。';
  }
  try { await sdk?.lifecycle.ready(); } catch {}
}

start();
