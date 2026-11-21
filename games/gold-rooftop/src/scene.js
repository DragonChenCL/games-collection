import { standing } from './market.js';

// Draws the pixel rooftop scene on `cv` and keeps animating while the page is visible.
// opts: players() -> [{ price, name }], price() -> yuan per gram or null, label(player, index),
// waiting (text shown before a price exists), height (canvas height in CSS pixels).
export function startScene(cv, opts) {
  const g = cv.getContext('2d');
  const H = opts.height || 560, GROUND = H - 60, SLOT = 104, U = 3;
  let pending = false;
  function schedule() { if (!pending && !document.hidden) { pending = true; requestAnimationFrame(draw); } }
  document.addEventListener('visibilitychange', schedule);
  /* ---------- 像素画面 ---------- */
  const SPRITE = ['..hhhh..', '.hhhhhh.', '.hsssss.', '.sesses.', '.ssssss.', '..cccc..', '.cccccc.', 'sccccccs', '.cccccc.', '..pppp..', '..p..p..', '..p..p..'];
  const SHIRTS = ['#ff5d5d', '#5db8ff', '#ffd23f', '#b56dff', '#5dff9b', '#ff9a3d', '#ff7ad1', '#7af0ff'];
  const BODIES = ['#2b2a5c', '#3a2a5c', '#243a66', '#2f3360', '#40305a'];
  const SAY_LOSS = ['风好大', '我就上来吹吹风', '再等等会涨回来的', '当初不如存银行', '这里风景真好', '谁劝我买的', '我不卖就不算亏'];
  const SAY_WIN = ['今晚加鸡腿', '还好买得早', '楼上的下来吃火锅'];
  const heights = new Map();
  let speaker = { i: -1, text: '', until: 0 };
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: rnd(i * 3 + 1), y: rnd(i * 3 + 2) * 0.6, s: rnd(i * 3 + 3) }));

  function rnd(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function px(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function text(s, x, y, c, size, align) {
    g.font = 'bold ' + (size || 13) + 'px "Courier New","Microsoft YaHei",monospace'; g.textAlign = align || 'center';
    g.fillStyle = '#000'; g.fillText(s, x + 2, y + 2); g.fillStyle = c; g.fillText(s, x, y);
  }
  function sprite(x, y, shirt, armsUp, sad) {
    SPRITE.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.') return;
      let yy = y + r * U;
      if (armsUp && r === 7 && (c === 0 || c === 7)) yy -= 3 * U;
      px(x + c * U, yy, U, U, ch === 'h' ? '#3b2416' : ch === 's' ? '#ffcf9e' : ch === 'e' ? '#1a1a1a' : ch === 'c' ? shirt : '#27315e');
    }));
    if (sad) px(x + 2 * U, y + 4 * U, U, U, '#7ad7ff');
  }

  function draw(t) {
    pending = false;
    const players = opts.players(), cur = opts.price(), label = opts.label;
    const calc = p => standing(p.price, cur);
    const W = Math.max(cv.parentElement.clientWidth, players.length * SLOT + 40);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const sky = g.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#0a0820'); sky.addColorStop(0.7, '#2a1b52'); sky.addColorStop(1, '#5a2a5e');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    stars.forEach(s => { if (Math.sin(t / 700 + s.s * 20) > -0.6) px(s.x * W, s.y * GROUND, U, U, s.s > 0.5 ? '#fff' : '#b9b5ff'); });
    // 月亮
    for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) if (a * a + b * b <= 26) px(W - 90 + a * 6, 70 + b * 6, 6, 6, (a + b) % 5 === 0 && a * a + b * b < 16 ? '#e8d48a' : '#fff3b0');
    // 远景楼群
    for (let i = 0; i * 46 < W; i++) { const h = 60 + rnd(i + 50) * 150; px(i * 46, GROUND - h, 44, h, '#17143a'); }
    // 地面
    px(0, GROUND, W, H - GROUND, '#1a1a26'); px(0, GROUND, W, 4, '#55537a');
    for (let x = (-(t / 30) % 60); x < W; x += 60) px(x, GROUND + 40, 30, 4, '#c9b23f');

    if (cur === null) { text(opts.waiting || '', W / 2, 250, '#ffd23f', 20); schedule(); return; }

    const cs = players.map(calc);
    const maxF = Math.max(12, ...cs.map(c => c.floors));
    const FH = Math.min(16, (GROUND - 150) / maxF);
    const x0 = (W - players.length * SLOT) / 2;

    if (t > speaker.until && players.length) {
      const i = Math.floor(Math.random() * players.length), pool = cs[i].floors ? SAY_LOSS : SAY_WIN;
      speaker = { i, text: pool[Math.floor(Math.random() * pool.length)], until: t + 3500 };
    }

    players.forEach((p, i) => {
      const c = cs[i], key = p.price + '|' + p.name, target = c.floors * FH;
      const prev = heights.get(key) ?? 0, h = Math.abs(target - prev) < 0.3 ? target : prev + (target - prev) * 0.08;
      heights.set(key, h);
      const bw = SLOT - 28, bx = x0 + i * SLOT + 14, top = GROUND - h, shirt = SHIRTS[i % SHIRTS.length];
      const cx = bx + bw / 2;
      if (h > 1) {
        px(bx - 3, top, bw + 6, h, '#000'); px(bx, top, bw, h, BODIES[i % BODIES.length]);
        const shown = Math.round(h / FH), ww = (bw - 14) / 4;
        for (let f = 0; f < shown; f++) for (let k = 0; k < 4; k++) {
          const lit = rnd(i * 977 + f * 31 + k * 7 + Math.floor(t / 4000 + rnd(f + k) * 9)) > 0.45;
          px(bx + 9 + k * ww, top + f * FH + FH * 0.25, ww - 5, FH * 0.5, lit ? '#ffd86b' : '#14122e');
        }
        px(bx - 6, top - 6, bw + 12, 6, '#55537a'); px(bx - 6, top - 6, bw + 12, 2, '#8a87b8');
        px(bx + bw - 12, top - 26, 3, 20, '#8a87b8'); px(bx + bw - 12, top - 28, 3, 3, Math.sin(t / 300) > 0 ? '#ff5d5d' : '#5a1f1f');
      }
      const sway = c.floors ? Math.round(Math.sin(t / 500 + i) * 2) : 0;
      const jump = c.floors ? 0 : Math.abs(Math.sin(t / 220 + i)) * 8;
      const sy = (h > 1 ? top - 6 : GROUND) - 12 * U - jump;
      sprite(cx - 4 * U + sway - (h > 1 ? 6 : 0), sy, shirt, !c.floors, c.floors > 20);
      if (c.floors) for (let k = 0; k < 3; k++) { const wx = (t / 6 + k * 40 + i * 17) % (SLOT - 10); px(bx - 10 + wx, sy + 6 + k * 9, 10, 2, 'rgba(255,255,255,.35)'); }
      else for (let k = 0; k < 2; k++) px(cx - 22 + k * 40, GROUND - 12 - Math.abs(Math.sin(t / 260 + k * 2 + i)) * 26, 6, 6, '#ffd23f');
      const ly = (h > 1 ? top - 6 : GROUND) - 12 * U - 18;
      text((c.pct >= 0 ? '+' : '') + c.pct.toFixed(1) + '%', cx, ly, c.pct < 0 ? '#5dff9b' : '#ff5d5d', 14);
      text(c.floors ? c.floors + 'F 天台' : '地面', cx, ly - 17, '#fff', 13);
      text('¥' + p.price + ' 买入', cx, ly - 33, '#ffd23f', 12);
      text(label(p, i), cx, GROUND + 24, '#cfcdf5', 12);
      if (speaker.i === i) {
        g.font = 'bold 13px "Microsoft YaHei",monospace';
        const tw = g.measureText(speaker.text).width + 16, bxx = Math.min(Math.max(cx - tw / 2, 4), W - tw - 4), by = ly - 80;
        px(bxx - 3, by - 3, tw + 6, 30, '#000'); px(bxx, by, tw, 24, '#fff'); px(cx - 3, by + 24, 6, 6, '#fff');
        g.fillStyle = '#111'; g.textAlign = 'left'; g.fillText(speaker.text, bxx + 8, by + 17);
      }
    });
    text('现价 ¥' + cur.toFixed(2) + '/克', 14, 26, '#ffd23f', 16, 'left');
    schedule();
  }

  schedule();
}
