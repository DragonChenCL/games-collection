import { standing, rank } from '../src/market.js';
import { startScene } from '../src/scene.js';
import { openStore } from './store.js';
import { aiAvailable, roast, rankAvailable, loadBoard } from './extras.js';

// __SNAPSHOT__ is the gold price written into the package at build time (see snapshot.json).
const SNAPSHOT = __SNAPSHOT__;
const DEFAULTS = [700, 750, 800, 850, 900, 1000, 1100, 1200];
const MAX_PRICE = 1e6;
const $ = id => document.getElementById(id);
const cents = v => Math.round(v * 100) / 100;
const validPrice = v => typeof v === 'number' && v > 0 && v <= MAX_PRICE;
const defaults = () => DEFAULTS.map(price => ({ price, name: '' }));

let players = defaults();
let cur = SNAPSHOT.cnyGram;
let store = null, canSave = false, writing = Promise.resolve();

function status(message, bad) { const el = $('status'); el.textContent = message; el.className = bad ? 'note err' : 'note'; }

function save() {
  if (!canSave) return;
  const value = { players, price: cur };
  writing = writing.then(() => store.write(value)).then(ok => {
    if (ok) status('已自动保存在本机。');
    else status('保存失败，本次修改可能不会保留。', true);
  });
}

function label(p, i) { return p.name || '玩家' + (i + 1); }

function render() {
  const el = $('cur'), d = cur - SNAPSHOT.cnyGram;
  el.textContent = cur.toFixed(2);
  el.className = d > 0 ? 'v up' : d < 0 ? 'v down' : 'v';
  const tb = $('rows');
  while (tb.firstChild) tb.removeChild(tb.firstChild);
  players.forEach((p, i) => {
    const c = standing(p.price, cur), tr = document.createElement('tr');
    const cells = [label(p, i), p.price.toFixed(2), (c.pct >= 0 ? '+' : '') + c.pct.toFixed(2) + '%', c.floors ? c.floors + ' 层天台' : '地面', rank(c)];
    cells.forEach((t, k) => { const td = document.createElement('td'); td.textContent = t; if (k === 2) td.className = c.pct < 0 ? 'loss' : 'gain'; tr.appendChild(td); });
    const td = document.createElement('td'), b = document.createElement('button');
    b.type = 'button'; b.className = 'del'; b.textContent = '×'; b.setAttribute('aria-label', '移除' + label(p, i));
    b.addEventListener('click', () => { players.splice(i, 1); save(); render(); });
    td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
  });
}

function setPrice(v) {
  v = cents(v);
  if (!validPrice(v)) return false;
  cur = v; save(); render();
  return true;
}

function bind() {
  Array.prototype.forEach.call(document.querySelectorAll('.step'), b => {
    b.addEventListener('click', () => { setPrice(Math.max(0.01, cur + Number(b.getAttribute('data-step')))); });
  });
  const applyPrice = () => { const input = $('curInput'); if (setPrice(parseFloat(input.value))) { input.value = ''; input.blur(); } else input.focus(); };
  $('setCur').addEventListener('click', applyPrice);
  $('curInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyPrice(); });
  const add = () => {
    const v = cents(parseFloat($('price').value));
    if (!validPrice(v)) { $('price').focus(); return; }
    players.push({ price: v, name: $('name').value.trim().slice(0, 6) });
    players.sort((a, b) => a.price - b.price);
    $('price').value = ''; $('name').value = ''; $('price').blur(); $('name').blur();
    save(); render();
  };
  $('add').addEventListener('click', add);
  $('price').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  $('name').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  $('reset').addEventListener('click', () => { players = defaults(); cur = SNAPSHOT.cnyGram; save(); render(); });
}

function showPanel(message, rows) {
  $('panel').hidden = false;
  $('panelText').textContent = message;
  const list = $('rankList');
  while (list.firstChild) list.removeChild(list.firstChild);
  (rows || []).forEach(r => {
    const li = document.createElement('li');
    [['span', '#' + r.rank], ['b', r.name], ['i', r.score + ' 层']].forEach(([tag, value]) => { const el = document.createElement(tag); el.textContent = value; li.appendChild(el); });
    list.appendChild(li);
  });
}

async function busy(button, work) {
  if (button.disabled) return;
  button.disabled = true;
  try { await work(); } finally { button.disabled = false; }
}

function bindExtras(version) {
  const xhs = window.xhs, roastButton = $('roast'), boardButton = $('board');
  const hide = button => { button.hidden = true; if (roastButton.hidden && boardButton.hidden) $('extras').hidden = true; };
  if (aiAvailable(xhs)) {
    roastButton.hidden = false; $('extras').hidden = false;
    roastButton.addEventListener('click', () => busy(roastButton, async () => {
      if (!players.length) { showPanel('先加一个买入价，才有得评。'); return; }
      showPanel('AI 正在组织语言…');
      const list = players.map((p, i) => { const c = standing(p.price, cur); return { label: label(p, i), buy: p.price, pct: c.pct, floors: c.floors }; })
        .sort((a, b) => b.floors - a.floors);
      try { showPanel(await roast(xhs, cur, list)); } catch (e) { showPanel(e.message); }
    }));
  }
  if (rankAvailable(xhs, version)) {
    boardButton.hidden = false; $('extras').hidden = false;
    boardButton.addEventListener('click', () => busy(boardButton, async () => {
      showPanel('正在打开天台高度榜…');
      const floors = players.reduce((m, p) => Math.max(m, standing(p.price, cur).floors), 0);
      try {
        const board = await loadBoard(xhs, floors);
        showPanel((floors ? '已提交你的最高楼层 ' + floors + ' 层。' : '') + board.mine + (board.rows.length ? '' : '。榜上还没有人'), board.rows);
      } catch (e) { showPanel(e.message); if (e.unauthorized) hide(boardButton); }
    }));
  }
}

// Keeps the title clear of the system status bar and the host's top buttons (client 9.49+).
async function avoidHostButtons(version) {
  const miniTool = window.xhs && window.xhs.miniTool;
  if (version === null || version < 9490 || !miniTool || typeof miniTool.getWindowInfo !== 'function') return;
  try {
    const info = await miniTool.getWindowInfo();
    const buttons = info.menuButtons || {};
    const visible = r => r && r.width > 0 && r.height > 0;
    const rects = visible(buttons.capsule) ? [buttons.capsule] : [buttons.back, buttons.me, buttons.share].filter(visible);
    const top = rects.reduce((m, r) => Math.max(m, r.bottom), (info.safeArea && info.safeArea.top) || 0);
    if (top > 0) document.documentElement.style.setProperty('--content-top', (top + 8) + 'px');
  } catch (e) { /* the CSS safe-area fallback stays in effect */ }
}

async function restore() {
  store = await openStore(window.xhs);
  avoidHostButtons(store.version);
  bindExtras(store.version);
  if (store.reason) {
    status(store.reason === 'old' ? '当前小红书版本较旧，名单和现价不会保存；升级后可保存。' : '当前环境无法保存，名单和现价关闭后不会保留。', true);
    return;
  }
  const saved = await store.read();
  if (saved.state === 'failed') { status('读取存档失败，本次修改不会保存，请退出后重新打开。', true); return; }
  canSave = true;
  if (saved.state === 'ok' && saved.data) {
    if (Array.isArray(saved.data.players)) {
      players = saved.data.players.filter(p => p && validPrice(p.price)).map(p => ({ price: p.price, name: String(p.name || '').slice(0, 6) }));
    }
    if (validPrice(saved.data.price)) cur = saved.data.price;
    render();
  }
  status('名单和现价会自动保存在本机。');
}

function start() {
  $('snap').textContent = '小工具不能联网，金价不会自动更新。默认是 ' + SNAPSHOT.date + ' 的国际金价折算价 ' + SNAPSHOT.cnyGram.toFixed(2) + ' 元/克，请自己改成最新价。';
  bind();
  render();
  startScene($('cv'), { players: () => players, price: () => cur, label, height: 420 });
  status('正在读取存档…');
  restore().catch(() => { status('读取存档失败，本次修改不会保存，请退出后重新打开。', true); });
}

start();
