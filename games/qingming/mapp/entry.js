// Discourse micro-app entry: routes saves, the font and fullscreen through the platform SDK, then starts the game.
import { SAVE_KEY } from '../src/game.js';
import { startGame } from '../src/main.js';
import './mapp.css';

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
      catch (error) {
        console.warn('[qingming] save failed', error);
        failed = true;
        // A newer save queued meanwhile is tried right away; otherwise keep this one for the next save.
        if (!pending) { pending = entry; break; }
      }
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

// The platform page hides the console from players, so the failure screen carries the error itself.
function showFailure(error) {
  const where = String(error?.stack ?? '').split('\n').find(line => /:\d+:\d+/.test(line))?.trim() ?? '';
  const box = document.querySelector('#app') ?? document.body;
  box.textContent = `游戏加载失败，请刷新后重试。\n${error?.name ?? 'Error'}: ${error?.message ?? error}\n${where}`;
  box.classList.add('load-failure');
}

// The game builds its UI from HTML strings; where the host enforces Trusted Types this lets them through.
function allowHtmlStrings() {
  try {
    if (globalThis.trustedTypes && !trustedTypes.defaultPolicy) trustedTypes.createPolicy('default', { createHTML: html => html });
  } catch (error) { console.warn('[qingming] trusted types policy unavailable', error); }
}

async function start() {
  let save = { value: null, readable: true };
  if (sdk) {
    try { await sdk.ready; } catch (error) { console.warn('[qingming] SDK unavailable', error); }
    const font = loadFont().catch(error => console.warn('[qingming] font unavailable', error));
    [save] = await Promise.all([loadSave(), within(font, 3000).catch(() => {})]);
  }
  installStorage(save);
  allowHtmlStrings();
  try {
    startGame();
    adaptPage();
  } catch (error) {
    console.error(error);
    showFailure(error);
  }
  try { await sdk?.lifecycle.ready(); } catch {}
}

start();
