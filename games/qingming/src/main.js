import './style.css';
import { QUESTS, CHAPTERS, SAVE_KEY, clamp, newGame, restoreGame, completeQuest, nearestChapter, isTimingHit, checkTeaOrder } from './game.js';

const paths = {
  book: '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4zM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14"/>',
  mute: '<path d="M11 4 6 8H3v8h3l5 4zM16 9l6 6M22 9l-6 6"/>',
  full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2M12 17v.1"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
const avatar = `<svg viewBox="0 0 50 84" aria-hidden="true"><ellipse cx="25" cy="79" rx="18" ry="4" fill="#372a22" opacity=".2"/><path d="m21 65-3 14m12-14 4 14" stroke="#423b31" stroke-width="4"/><path d="m19 31-8 33q14 7 29-1L31 31Z" fill="#934331" stroke="#4b392b" stroke-width="1.6"/><path d="m18 35-10 18m23-18 11 16" stroke="#934331" stroke-width="7"/><path d="M21 33q4 13 10 0M15 53l21 2" fill="none" stroke="#d5b98a" stroke-width="2"/><circle cx="25" cy="23" r="8" fill="#d0ab79" stroke="#493b2c" stroke-width="1.4"/><path d="M17 23q-1-13 8-12t8 12M15 16q9-6 20 0" fill="#37372e" stroke="#37372e" stroke-width="3"/><path d="M19 10q5-7 12 0" fill="#37372e"/></svg>`;

let state;
try { state = restoreGame(localStorage.getItem(SAVE_KEY)); } catch { state = newGame(); }
let camera = state.camera;
let zoom = 1;
let target = { ...state.player };
let player = { ...target };
let worldWidth = 0;
let worldHeight = 0;
let offset = 0;
let cleanupGame = () => {};
let toastTimer;
let lastFrame = 0;
let lastSave = 0;
let keys = new Set();
let music = null;
let musicInterval;
let playing = false;
let pageHidden = document.hidden;
let welcomed = false;
try { welcomed = sessionStorage.getItem('ruhua-welcomed') === '1'; } catch {}

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a href="../../" class="brand" aria-label="游戏合集首页"><span class="brand-seal">入<br>画</span><span class="brand-name">清明上河图<small>A LIVING HANDSCROLL</small></span></a>
    <nav class="main-nav" aria-label="主导航"><button class="nav-active" id="explore">画卷漫游</button><button id="journal">汴京手记 <span id="nav-count">${state.completed.length}/3</span></button></nav>
    <div class="header-tools"><span class="era">北宋<span>·</span>汴京</span><button class="icon-button" id="sound" aria-label="开启环境音乐" title="环境音乐">${icon('mute')}</button><button class="icon-button" id="help" aria-label="游玩指南">${icon('help')}</button><button class="icon-button fullscreen-button" id="fullscreen" aria-label="切换全屏">${icon('full')}</button></div>
  </header>
  <main>
    <section id="stage" class="stage" aria-label="可拖动画卷。方向键或 WASD 漫游，点击人物互动。" tabindex="0">
      <div id="world" class="world">
        <img class="painting" src="./scroll.jpg" alt="北宋张择端清明上河图完整画卷" draggable="false" fetchpriority="high" />
        <div class="river-glimmer" style="left:51%;top:70%"></div>
        ${QUESTS.map((q, i) => `<button class="npc ${state.completed.includes(q.id) ? 'done' : ''}" data-quest="${q.id}" style="left:${q.x * 100}%;top:${q.y * 100}%" aria-label="与${q.name}交谈：${q.title}"><span class="npc-label">${q.name}</span><span class="npc-pin"><span>${state.completed.includes(q.id) ? '✓' : '!'}</span></span></button>`).join('')}
        <button class="landmark" data-landmark="gate" style="left:17%;top:38%" aria-label="查看城阙见闻">城阙<span>◇</span></button>
        <button class="landmark" data-landmark="river" style="left:66%;top:42%" aria-label="查看汴河见闻">汴河<span>◇</span></button>
        <button id="kite-item" class="kite-item" style="left:89.5%;top:30%" aria-label="树梢的纸鸢" ${state.kiteAccepted && !state.completed.includes('kite') ? '' : 'hidden'}><svg viewBox="0 0 64 90" aria-hidden="true"><path d="M32 6 57 31 32 52 7 31Z" fill="#a34b33" stroke="#f1ddae" stroke-width="2"/><path d="M7 31h50M32 6v46" stroke="#e9c97e" stroke-width="1.5"/><path d="M32 52q-22 15 0 25t-4 12" fill="none" stroke="#9d3b2d" stroke-width="2"/></svg></button>
        <div id="player" class="player">${avatar}<span>你</span></div>
        <div id="walk-target" class="walk-target"></div>
      </div>
      <div class="scene-vignette"></div>
      <div class="scene-heading"><span class="scene-number">卷中游 · 第<span id="chapter-num">三</span>景</span><div class="scene-title" id="scene-title">虹桥</div><p id="scene-note">一桥飞架，千帆竞渡</p><span class="little-seal">汴京<br>春日</span></div>
      <div class="scene-meta"><span class="live-dot"></span> 张择端笔下的一日<span class="meta-line"></span> 你正在画中</div>
      <aside class="quest-card" id="quest-card"><div class="quest-card-heading"><span class="eyebrow">今日奇遇</span><button id="toggle-quests" aria-label="收起奇遇" aria-expanded="true">−</button></div><h1>借一日，做个宋人。</h1><p class="quest-intro">走进人间烟火，收集三枚汴京印记。</p><div id="quest-list"></div><button class="journal-link" id="open-journal">翻开我的汴京手记 ${icon('arrow')}</button></aside>
      <div class="scene-controls"><button class="icon-button" id="zoom-out" aria-label="缩小画卷">−</button><span id="zoom-label">100%</span><button class="icon-button" id="zoom-in" aria-label="放大画卷">＋</button><span class="control-divider"></span><button class="icon-button" id="center-player" aria-label="回到我的位置" title="回到我的位置">${icon('pin')}</button></div>
      <div class="welcome" id="welcome" ${welcomed ? 'hidden' : ''}><span class="welcome-decoration">游</span><div><strong>千年汴京，等你入画。</strong><p>拖动画卷探索，点击红色标记，开启一段奇遇。</p></div><button id="dismiss-welcome" aria-label="开始漫游">入画 ${icon('arrow')}</button></div>
      <div class="loading" id="loading"><span class="loading-seal">入画</span><p>春色正徐徐展开…</p></div>
      <div class="asset-error" id="asset-error" hidden><h2>画卷暂未展开</h2><p>请检查网络后重新载入。</p><button class="primary" id="reload">重新载入</button></div>
    </section>
    <section class="scroll-nav" aria-label="画卷导航"><div class="chapter-row"><div class="scroll-label"><span>汴京舆图</span><small>点击地点，移步换景</small></div><div class="chapter-buttons">${CHAPTERS.map((c, i) => `<button data-chapter="${i}" class="${i === 2 ? 'active' : ''}"><span class="chapter-dot"></span>${c.name}<small>${c.en}</small></button>`).join('')}</div><span class="reading-direction">郊野入城 ←</span></div><div id="minimap" class="minimap" role="slider" tabindex="0" aria-label="画卷位置" aria-valuemin="0" aria-valuemax="100" aria-valuenow="51"><img src="./scroll-mini.jpg" alt="全卷导航缩略图" draggable="false"/><div class="minimap-shade"></div><div id="minimap-window" class="minimap-window"><span></span></div>${QUESTS.map(q => `<span class="map-point" style="left:${q.x * 100}%"></span>`).join('')}</div></section>
  </main>
  <footer><span class="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> / WASD 漫游 <i></i> 拖动画卷 <i></i> 点击人物互动 <i></i> <kbd>E</kbd> 与附近人物交谈</span><span class="mobile-hint">单指拖动探索 · 点击人物互动</span><span class="save-status" id="save-status">进度自动保存于本机</span><button id="about">关于此作 ${icon('arrow')}</button></footer>
  <dialog id="dialog" class="dialog"><button class="dialog-close icon-button" id="close-dialog" aria-label="关闭">${icon('close')}</button><div id="dialog-body"></div></dialog>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const $ = s => document.querySelector(s);
const stage = $('#stage');
const world = $('#world');
const dialog = $('#dialog');
const dialogBody = $('#dialog-body');

function save() {
  state.player = { ...player };
  state.camera = camera;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { $('#save-status').textContent = '当前浏览器无法保存进度'; }
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3600);
}

function renderProgress() {
  $('#nav-count').textContent = `${state.completed.length}/3`;
  $('#quest-list').innerHTML = QUESTS.map((q, i) => `<button class="quest-row ${state.completed.includes(q.id) ? 'complete' : ''}" data-locate="${q.id}"><span class="quest-index">${state.completed.includes(q.id) ? icon('check') : `0${i + 1}`}</span><span><strong>${q.title}</strong><small>${state.completed.includes(q.id) ? '已收入手记' : q.subtitle}</small></span><span class="quest-row-arrow">↗</span></button>`).join('');
  for (const q of QUESTS) {
    const el = $(`[data-quest="${q.id}"]`);
    el.classList.toggle('done', state.completed.includes(q.id));
    el.querySelector('.npc-pin span').textContent = state.completed.includes(q.id) ? '✓' : '!';
  }
  $('#kite-item').hidden = !state.kiteAccepted || state.completed.includes('kite');
}

function size() {
  worldHeight = stage.clientHeight * zoom;
  worldWidth = worldHeight * (38414 / 1800);
  world.style.width = `${worldWidth}px`;
  world.style.height = `${worldHeight}px`;
  world.style.top = `${(stage.clientHeight - worldHeight) / 2}px`;
  draw();
}

function draw() {
  offset = clamp(camera * worldWidth - stage.clientWidth / 2, 0, Math.max(0, worldWidth - stage.clientWidth));
  world.style.transform = `translate3d(${-offset}px,0,0)`;
  $('#player').style.left = `${player.x * 100}%`;
  $('#player').style.top = `${player.y * 100}%`;
  const chapter = nearestChapter(camera);
  $('#scene-title').textContent = chapter.name;
  $('#scene-note').textContent = chapter.note;
  $('#chapter-num').textContent = ['一', '二', '三', '四', '五'][CHAPTERS.indexOf(chapter)];
  document.querySelectorAll('[data-chapter]').forEach((el, i) => el.classList.toggle('active', CHAPTERS[i].name === chapter.name));
  const map = $('#minimap-window');
  map.style.width = `${Math.min(100, stage.clientWidth / worldWidth * 100)}%`;
  map.style.left = `${offset / worldWidth * 100}%`;
  $('#minimap').setAttribute('aria-valuenow', Math.round(camera * 100));
  $('#minimap').setAttribute('aria-valuetext', chapter.name);
  if (!state.visited.includes(chapter.name)) { state.visited.push(chapter.name); save(); }
}

function travel(x, y = .72) {
  camera = clamp(x, .03, .97);
  player = { x: camera, y };
  target = { ...player };
  draw(); save();
}

function openModal(content, wide = false) {
  cleanupGame(); cleanupGame = () => {};
  keys.clear();
  dialog.classList.toggle('wide', wide);
  dialogBody.innerHTML = content;
  if (!dialog.open) dialog.showModal();
}

function closeModal() { cleanupGame(); cleanupGame = () => {}; dialog.close(); keys.clear(); stage.focus({ preventScroll: true }); }
dialog.addEventListener('close', () => { cleanupGame(); cleanupGame = () => {}; });
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });
$('#close-dialog').onclick = closeModal;

function talk(id) {
  const q = QUESTS.find(q => q.id === id);
  player = { x: q.x + .004, y: Math.min(.88, q.y + .18) }; target = { ...player }; draw(); save();
  const done = state.completed.includes(id);
  openModal(`<div class="dialog-overline">${q.chapter}奇遇 · ${q.role}</div><div class="portrait portrait-${id}">${id === 'bridge' ? '舟' : id === 'tea' ? '茶' : '鸢'}</div><h2>${q.name}</h2><p class="npc-dialogue">「${done ? '多谢你的相助！这段汴京奇遇，已被好好收进你的手记。' : q.text}」</p><div class="dialog-fact"><span>画中见闻</span><p>${q.fact}</p></div><button class="primary" id="begin-quest">${done ? '翻开手记' : id === 'bridge' ? '搭把手，助船过桥' : id === 'tea' ? '好，我来记茶点单' : state.kiteAccepted ? '继续找纸鸢' : '我去帮你找'} ${icon('arrow')}</button>`);
  $('#begin-quest').onclick = () => {
    if (done) return openJournal();
    if (id === 'bridge') startBridge();
    if (id === 'tea') startTea();
    if (id === 'kite') { state.kiteAccepted = true; save(); renderProgress(); closeModal(); toast('往右边的柳树梢找找，看见红色纸鸢就点一下。'); }
  };
}

function reward(id) {
  const wasComplete = state.completed.includes(id);
  state = completeQuest(state, id); save(); renderProgress();
  const q = QUESTS.find(q => q.id === id);
  const all = state.completed.length === QUESTS.length;
  openModal(`<div class="dialog-overline">${all ? '三段奇遇 · 一卷人间' : '奇遇已完成'}</div><div class="reward-stamp">${q.stamp}<small>汴京印记</small></div><h2>${all ? '此心安处，是汴京。' : q.title + ' · 圆满'}</h2><p class="npc-dialogue">${all ? '你助过往来舟，奉过一盏茶，也寻回了一只春天的纸鸢。三个小小的善意，成了这座城里属于你的故事。' : id === 'bridge' ? '「好身手！船已稳稳过桥。这枚印记，留作你我今日相逢的纪念。」' : id === 'tea' ? '「一样不差！这一盏茶敬你，愿你在汴京常有闲情。」' : '「找到啦！谢谢你，我又能和春风一起跑了！」'}</p><div class="stamp-progress">${QUESTS.map(q => `<span class="${state.completed.includes(q.id) ? 'earned' : ''}">${q.stamp}</span>`).join('<i>·</i>')}</div><button class="primary" id="reward-next">${all ? '珍藏我的汴京手记' : '继续画中游'} ${icon('arrow')}</button>`);
  $('#reward-next').onclick = all ? openJournal : closeModal;
  if (!wasComplete) chime();
}

function startBridge() {
  openModal(`<div class="dialog-overline">虹桥险渡 · 协力行舟</div><h2>看准水势，再落篙。</h2><p class="mini-description">游标进入<span class="teal-text">青色区域</span>时，点击「落篙」或按空格。<br>成功三次，帮漕船平安过桥；失误可以接着来。</p><div class="boat-scene"><svg viewBox="0 0 440 140" aria-hidden="true"><path d="M30 98Q220-80 410 98M40 98Q220-35 400 98M66 69v17m42-48v29m45-49v29m45-38v31m44-29v30m44-20v31m45-8v27m44 0v18" fill="none" stroke="#76634b" stroke-width="3"/><path d="M20 118q30-12 60 0t60 0t60 0t60 0t60 0t60 0t40 0" fill="none" stroke="#78857a" opacity=".5"/><g class="little-boat"><path d="M135 105h127l-19 20h-85Z" fill="#66513b"/><path d="M166 100V77h62v23" fill="#b5a179" stroke="#66513b" stroke-width="2"/><path d="M196 77V39m0 4 37 27h-37Z" fill="#d8c49b" stroke="#66513b" stroke-width="2"/></g></svg></div><div class="timing-track"><div class="safe-zone"></div><div class="timing-cursor" id="timing-cursor"></div><span class="safe-label">落篙区</span></div><div class="timing-meta"><span>急流</span><span id="bridge-score">稳稳落篙 0 / 3</span><span>缓流</span></div><p class="game-feedback" id="bridge-feedback" aria-live="polite">听船头号子，一起使劲！</p><button class="primary" id="pole">落篙 <kbd>SPACE</kbd></button>`);
  let hits = 0, frame, position = 0, pausedUntil = 0, start = performance.now();
  const feedback = $('#bridge-feedback');
  const press = () => {
    if (performance.now() < pausedUntil) return;
    pausedUntil = performance.now() + 550;
    if (isTimingHit(position)) {
      hits++; $('#bridge-score').textContent = `稳稳落篙 ${hits} / 3`; feedback.textContent = ['很好！再来一次。', '船身稳住了，还差最后一下！', '过桥啦！'][hits - 1]; feedback.className = 'game-feedback success'; chime();
      if (hits === 3) { cleanupGame(); const timer = setTimeout(() => reward('bridge'), 650); cleanupGame = () => clearTimeout(timer); }
    } else { feedback.textContent = '水流有点急，瞅准青色区域再来！'; feedback.className = 'game-feedback'; }
  };
  const tick = now => { position = (Math.sin((now - start) / (620 - hits * 80)) + 1) / 2; $('#timing-cursor').style.left = `${position * 100}%`; frame = requestAnimationFrame(tick); };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); } };
  $('#pole').onclick = press; document.addEventListener('keydown', key); frame = requestAnimationFrame(tick);
  cleanupGame = () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', key); };
}

const foods = [ { name: '清茶', symbol: '茶', desc: '一盏清香' }, { name: '桂花糕', symbol: '糕', desc: '一点春甜' }, { name: '松子', symbol: '松', desc: '一碟酥香' }, { name: '蜜饯', symbol: '蜜', desc: '一味甘甜' } ];
function startTea() {
  const order = [...foods.keys()].sort(() => Math.random() - .5).slice(0, 3);
  openModal(`<div class="dialog-overline">一盏汴京茶 · 茶坊小试</div><h2>客官点了些什么？</h2><p class="mini-description">记住这三样茶点的先后顺序，备茶时照着选。</p><div class="tea-order">${order.map((v, i) => `<div><small>第${['一','二','三'][i]}样</small><span>${foods[v].symbol}</span><strong>${foods[v].name}</strong></div>`).join('')}</div><button class="primary" id="remember">记住了，开始备茶 ${icon('arrow')}</button>`);
  $('#remember').onclick = () => serveTea(order);
}

function serveTea(order) {
  openModal(`<div class="dialog-overline">一盏汴京茶 · 按顺序备好</div><h2>请为客官备茶。</h2><p class="mini-description">按刚才的顺序，依次点选三样茶点。</p><div class="tea-slots" id="tea-slots"><span>一</span><span>二</span><span>三</span></div><div class="food-options">${foods.map((f, i) => `<button data-food="${i}"><span>${f.symbol}</span><strong>${f.name}</strong><small>${f.desc}</small></button>`).join('')}</div><p id="tea-feedback" class="game-feedback" aria-live="polite">别着急，想想客官的吩咐。</p><button class="text-button" id="review-order">再看一次茶点单</button>`);
  let selected = [], timer;
  document.querySelectorAll('[data-food]').forEach(btn => btn.onclick = () => {
    if (selected.length >= 3) return;
    const n = Number(btn.dataset.food); selected.push(n); btn.disabled = true;
    $('#tea-slots').children[selected.length - 1].textContent = foods[n].name;
    $('#tea-slots').children[selected.length - 1].classList.add('filled');
    if (selected.length === 3) {
      if (checkTeaOrder(order, selected)) { $('#tea-feedback').textContent = '一样不差，客官请慢用！'; timer = setTimeout(() => reward('tea'), 700); }
      else { $('#tea-feedback').textContent = '顺序似乎不太对，再看一眼茶点单吧。'; $('#review-order').classList.add('primary'); }
    }
  });
  $('#review-order').onclick = () => showTeaAgain(order);
  cleanupGame = () => clearTimeout(timer);
}

function showTeaAgain(order) {
  openModal(`<div class="dialog-overline">茶娘的小提示</div><h2>慢慢记，不着急。</h2><div class="tea-order">${order.map((v, i) => `<div><small>第${['一','二','三'][i]}样</small><span>${foods[v].symbol}</span><strong>${foods[v].name}</strong></div>`).join('')}</div><button class="primary" id="retry-tea">再试一次 ${icon('arrow')}</button>`);
  $('#retry-tea').onclick = () => serveTea(order);
}

function openJournal() {
  openModal(`<div class="dialog-overline">我的汴京手记 · 已集 ${state.completed.length} / 3 枚印记</div><h2>人间有味，是清欢。</h2><p class="mini-description">你在画里留下的每一个小故事，都记在这里。</p><div class="journal-quests">${QUESTS.map(q => `<article class="journal-entry ${state.completed.includes(q.id) ? 'is-done' : ''}"><div class="journal-stamp">${state.completed.includes(q.id) ? q.stamp : '未'}</div><div><h3>${q.title}<small>${state.completed.includes(q.id) ? '奇遇圆满' : '等你相逢'}</small></h3><p>${state.completed.includes(q.id) ? q.fact : q.subtitle + '，在' + q.chapter + '与' + q.name + '相逢。'}</p><button class="text-button" data-journal-locate="${q.id}">${state.completed.includes(q.id) ? '重访故人' : '前往' + q.chapter} ${icon('arrow')}</button></div></article>`).join('')}</div><div class="visited-places"><span>足迹 · ${state.visited.length} / 5</span>${CHAPTERS.map(c => `<span class="${state.visited.includes(c.name) ? 'visited' : ''}">${c.name}</span>`).join('')}</div><div class="journal-bottom"><button class="text-button" id="continue-explore">继续漫游 ${icon('arrow')}</button><button class="reset-link" id="reset-game">重新开始</button></div>`, true);
  document.querySelectorAll('[data-journal-locate]').forEach(b => b.onclick = () => { closeModal(); locate(b.dataset.journalLocate); });
  $('#continue-explore').onclick = closeModal;
  $('#reset-game').onclick = () => { openModal(`<div class="dialog-overline">重新展开画卷</div><h2>再赴一场汴京之约？</h2><p class="npc-dialogue">这将清除本机上的奇遇进度、印记和足迹，无法撤销。</p><div class="button-pair"><button class="secondary" id="cancel-reset">保留手记</button><button class="primary" id="confirm-reset">确认重新开始</button></div>`); $('#cancel-reset').onclick = openJournal; $('#confirm-reset').onclick = () => { state = newGame(); travel(.505); renderProgress(); closeModal(); save(); toast('新的一日，春风依旧。'); }; };
}

function locate(id) { const q = QUESTS.find(q => q.id === id); travel(q.x); toast(`已到${q.chapter}，点击「${q.name}」开始交谈。`); }
function openHelp() {
  openModal(`<div class="dialog-overline">入画指南 · 慢慢走，不赶路</div><h2>一卷画，也是一座城。</h2><div class="help-list"><div><span>壹</span><p><strong>展开画卷</strong>单指或鼠标拖动，亦可使用方向键、WASD。点击下方地点可快速移步。</p></div><div><span>贰</span><p><strong>遇见画中人</strong>点击红色「!」人物标记交谈；或靠近后按 E。点击画面可让游人走过去。</p></div><div><span>叁</span><p><strong>收集汴京印记</strong>虹桥助舟、茶坊记单、郊野寻鸢，完成三段奇遇，在手记中珍藏。没有时间限制。</p></div></div><button class="primary" id="help-done">开始画中游 ${icon('arrow')}</button>`); $('#help-done').onclick = closeModal;
}

function openAbout() {
  openModal(`<div class="dialog-overline">关于此作</div><h2>入画 · 清明上河图</h2><p class="npc-dialogue">在张择端的笔墨之间，借一日，做个宋人。</p><div class="about-copy"><p>画卷：北宋张择端《清明上河图》，故宫博物院藏。原画及其忠实二维复制为公有领域作品。</p><p>本游戏为艺术启发的轻量互动创作。人物、对话、茶点与任务均为虚构，不代表原画情节或严谨历史复原。</p><p>素材：<a href="https://commons.wikimedia.org/wiki/File:Alongtheriver_QingMing.jpg" target="_blank" rel="noreferrer">Wikimedia Commons 公版原画</a>，经 Free-images 镜像获取，缩放后随游戏本地提供。字体为 Noto Serif SC（SIL OFL 1.1）。</p><p>无需账号；游玩进度仅保存在当前浏览器。音乐由浏览器合成，默认关闭。暂无离线缓存。</p><a class="text-button" href="https://app.devin.ai/sessions/db465cca40704cd0a609068c0d8c8bf2" target="_blank" rel="noreferrer">提出修改建议 ${icon('arrow')}</a></div>`);
}

function chime() {
  if (!playing || !music) return;
  tone(523.25, music.currentTime, .45, .035); tone(783.99, music.currentTime + .14, .6, .02);
}
function tone(freq, time, duration, volume) {
  const oscillator = music.createOscillator(), gain = music.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = freq; gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .025); gain.gain.exponentialRampToValueAtTime(.001, time + duration); oscillator.connect(gain); gain.connect(music.destination); oscillator.start(time); oscillator.stop(time + duration);
}
async function toggleSound() {
  try {
    music ??= new (window.AudioContext || window.webkitAudioContext)();
    playing = !playing;
    if (playing) {
      await music.resume();
      const scale = [261.63, 293.66, 329.63, 392, 440]; let note = 0;
      const play = () => { if (!pageHidden) { tone(scale[(note * 3) % scale.length], music.currentTime, 2.6, .024); note++; } };
      play(); musicInterval = setInterval(play, 2400);
    } else { clearInterval(musicInterval); await music.suspend(); }
    $('#sound').innerHTML = icon(playing ? 'sound' : 'mute'); $('#sound').setAttribute('aria-label', playing ? '关闭环境音乐' : '开启环境音乐');
  } catch { playing = false; toast('当前浏览器暂不支持环境音乐。'); }
}

$('#sound').onclick = toggleSound;
$('#journal').onclick = $('#open-journal').onclick = openJournal;
$('#help').onclick = openHelp;
$('#about').onclick = openAbout;
$('#explore').onclick = () => { if (dialog.open) closeModal(); stage.focus(); };
$('#reload').onclick = () => location.reload();
$('#fullscreen').onclick = async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch { toast('当前浏览器不支持全屏，可直接继续漫游。'); } };
$('#dismiss-welcome').onclick = () => { $('#welcome').hidden = true; try { sessionStorage.setItem('ruhua-welcomed', '1'); } catch {} stage.focus(); };
$('#toggle-quests').onclick = () => { const folded = $('#quest-card').classList.toggle('folded'); $('#toggle-quests').textContent = folded ? '+' : '−'; $('#toggle-quests').setAttribute('aria-expanded', !folded); $('#toggle-quests').setAttribute('aria-label', folded ? '展开奇遇' : '收起奇遇'); };
$('#center-player').onclick = () => { camera = player.x; draw(); save(); };
for (const [selector, change] of [['#zoom-in', .2], ['#zoom-out', -.2]]) $(selector).onclick = () => { zoom = clamp(Math.round((zoom + change) * 10) / 10, 1, 1.8); $('#zoom-label').textContent = Math.round(zoom * 100) + '%'; size(); };
document.addEventListener('click', e => {
  const q = e.target.closest('[data-quest]'); if (q) talk(q.dataset.quest);
  const l = e.target.closest('[data-locate]'); if (l) locate(l.dataset.locate);
  const c = e.target.closest('[data-chapter]'); if (c) travel(CHAPTERS[Number(c.dataset.chapter)].x);
  const landmark = e.target.closest('[data-landmark]'); if (landmark) { const gate = landmark.dataset.landmark === 'gate'; openModal(`<div class="dialog-overline">画中见闻 · ${gate ? '城阙' : '汴河'}</div><h2>${gate ? '城门之下，万象往来。' : '一河漕运，半城繁华。'}</h2><p class="npc-dialogue">${gate ? '城门附近，挑担的、赶车的、步行的，来来往往。张择端把繁忙城市里的普通人，也一一收入了长卷。' : '汴河是北宋都城的重要水运通道。画里密集的船只、船工与沿河商铺，留下了当年漕运繁忙的身影。'}</p><button class="primary" id="landmark-close">接着逛逛 ${icon('arrow')}</button>`); $('#landmark-close').onclick = closeModal; }
});
$('#kite-item').onclick = () => { if (state.kiteAccepted && !state.completed.includes('kite')) reward('kite'); };

let drag = null;
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('button, aside, .welcome, .scene-controls')) return;
  stage.focus({ preventScroll: true }); stage.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, camera, moved: false }; stage.classList.add('dragging');
});
stage.addEventListener('pointermove', e => { if (!drag) return; if (Math.abs(e.clientX - drag.x) > 5 || Math.abs(e.clientY - drag.y) > 5) drag.moved = true; if(drag.moved) { camera = clamp(drag.camera - (e.clientX - drag.x) / worldWidth, .03, .97); draw(); } });
stage.addEventListener('pointerup', e => {
  if (!drag) return;
  if (!drag.moved) { const rect = stage.getBoundingClientRect(); target = { x: clamp((e.clientX - rect.left + offset) / worldWidth, .03, .97), y: clamp((e.clientY - rect.top + (worldHeight - stage.clientHeight) / 2) / worldHeight, .16, .9) }; $('#walk-target').style.left = `${target.x * 100}%`; $('#walk-target').style.top = `${target.y * 100}%`; $('#walk-target').classList.remove('pulse'); void $('#walk-target').offsetWidth; $('#walk-target').classList.add('pulse'); }
  drag = null; stage.classList.remove('dragging'); save();
});
stage.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging'); });
const minimap = $('#minimap');
let mapDragging = false;
const mapMove = e => { const r = minimap.getBoundingClientRect(); camera = clamp((e.clientX - r.left) / r.width, .03, .97); draw(); save(); };
minimap.addEventListener('pointerdown', e => { mapDragging = true; minimap.setPointerCapture(e.pointerId); mapMove(e); });
minimap.addEventListener('pointermove', e => { if (mapDragging) mapMove(e); });
minimap.addEventListener('pointerup', () => { mapDragging = false; });
minimap.addEventListener('pointercancel', () => { mapDragging = false; });
minimap.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); travel(camera + (e.key === 'ArrowLeft' ? -.025 : .025)); } });

document.addEventListener('keydown', e => {
  if (dialog.open || e.target.closest('button, input, a, [role="slider"]')) return;
  const k = e.key.toLowerCase();
  if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(k)) { e.preventDefault(); keys.add(k); }
  if (k === 'e' && !e.repeat) { const q = QUESTS.find(q => Math.abs(q.x - player.x) < .03 && Math.abs(q.x - camera) < stage.clientWidth / worldWidth / 2); if (q) talk(q.id); else toast('走近红色人物标记，再按 E 交谈。'); }
});
document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); save(); });
document.addEventListener('visibilitychange', () => { pageHidden = document.hidden; keys.clear(); if(pageHidden)save(); });
window.addEventListener('pagehide', save);

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || .016, .05); lastFrame = now;
  let moving = false;
  if (!dialog.open) {
    const dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
    const dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
    if (dx || dy) { player.x = clamp(player.x + dx * dt * .028, .03, .97); player.y = clamp(player.y + dy * dt * .25, .16, .9); target = { ...player }; camera = player.x; moving = true; }
    else { const distanceX = target.x - player.x, distanceY = target.y - player.y; if (Math.abs(distanceX) > .00006 || Math.abs(distanceY) > .001) { const f = Math.min(1, dt * 3.5); player.x += distanceX * f; player.y += distanceY * f; moving = true; } }
    if (moving) { $('#player').classList.toggle('face-left', target.x < player.x || dx < 0); draw(); if(now - lastSave > 1500) { save(); lastSave = now; } }
  }
  $('#player').classList.toggle('walking', moving);
  requestAnimationFrame(frame);
}

const painting = $('.painting');
function loaded() { $('#loading').hidden = true; }
painting.addEventListener('load', loaded);
painting.addEventListener('error', () => { $('#loading').hidden = true; $('#asset-error').hidden = false; });
if (painting.complete && painting.naturalWidth) loaded();
renderProgress(); size(); new ResizeObserver(size).observe(stage); requestAnimationFrame(frame);
