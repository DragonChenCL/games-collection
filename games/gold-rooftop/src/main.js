import './style.css';
import { GRAMS_PER_OUNCE, standing, rank, createMarket } from './market.js';
import { startScene } from './scene.js';

const KEY = 'gold-rooftop-players';
const DEFAULTS = [700, 750, 800, 850, 900, 1000, 1100, 1200].map(p => ({ price: p, name: '' }));
const mock = parseFloat(new URLSearchParams(location.search).get('mock'));
let players = load();
let cur = null, lastDir = 0;

function load() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY)).filter(p => p && p.price > 0).map(p => ({ price: +p.price, name: String(p.name || '').slice(0, 6) }));
    return a;
  } catch (e) {}
  return DEFAULTS.map(d => ({ ...d }));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(players)); } catch (e) {} }

const quote = createMarket(async url => {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(url + ' -> ' + r.status);
  return r.json();
});

async function tick() {
  const st = document.getElementById('status');
  try {
    const d = isFinite(mock) ? { usdOz: mock * GRAMS_PER_OUNCE / 6.67, usdCny: 6.67, cnyGram: mock } : await quote();
    const cny = d.cnyGram;
    if (cur !== null && cny !== cur) lastDir = cny > cur ? 1 : -1;
    cur = cny;
    document.getElementById('usdOz').textContent = d.usdOz.toFixed(2);
    const el = document.getElementById('cnyG');
    el.textContent = cny.toFixed(2) + (lastDir > 0 ? ' ▲' : lastDir < 0 ? ' ▼' : '');
    el.className = 'v' + (lastDir > 0 ? ' up' : lastDir < 0 ? ' down' : '');
    document.getElementById('fx').textContent = d.usdCny.toFixed(4);
    st.className = 'v';
    st.textContent = (isFinite(mock) ? '模拟价格 ' : '实时 ') + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + ' 更新';
    renderTable();
  } catch (e) {
    st.className = 'v err';
    st.textContent = cur === null ? '行情获取失败，重试中…' : '行情中断，显示的是上次价格';
  }
}

function calc(p) { return standing(p.price, cur); }
function label(p, i) { return p.name || '玩家' + (i + 1); }

function renderTable() {
  const tb = document.getElementById('rows');
  tb.replaceChildren();
  if (cur === null) return;
  players.forEach((p, i) => {
    const c = calc(p), tr = document.createElement('tr'), cls = c.pct < 0 ? 'loss' : 'gain';
    const cells = [label(p, i), p.price.toFixed(2), (c.diff >= 0 ? '+' : '') + c.diff.toFixed(2),
      (c.pct >= 0 ? '+' : '') + c.pct.toFixed(2) + '%', c.floors ? c.floors + ' 层天台' : '地面', rank(c)];
    cells.forEach((t, k) => { const td = document.createElement('td'); td.textContent = t; if (k === 2 || k === 3) td.className = cls; tr.appendChild(td); });
    const td = document.createElement('td'), b = document.createElement('button');
    b.className = 'del'; b.textContent = '×'; b.title = '移除';
    b.onclick = () => { players.splice(i, 1); save(); renderTable(); };
    td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
  });
}

document.getElementById('add').onclick = () => {
  const v = Math.round(parseFloat(document.getElementById('price').value) * 100) / 100;
  if (!(v > 0)) { document.getElementById('price').focus(); return; }
  players.push({ price: v, name: document.getElementById('name').value.trim() });
  players.sort((a, b) => a.price - b.price);
  save(); renderTable();
  document.getElementById('price').value = ''; document.getElementById('name').value = '';
};
document.getElementById('price').onkeydown = e => { if (e.key === 'Enter') document.getElementById('add').click(); };
document.getElementById('reset').onclick = () => { players = DEFAULTS.map(d => ({ ...d })); save(); renderTable(); };

startScene(document.getElementById('cv'), { players: () => players, price: () => cur, label, waiting: '正在连接金价行情…' });

tick(); setInterval(tick, 10000);
