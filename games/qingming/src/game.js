export const SAVE_KEY = 'ruhua-save-v1';
export const QUESTS = [
  { id: 'bridge', title: '虹桥险渡', subtitle: '帮船工稳稳过桥', chapter: '虹桥', x: .505, y: .43, stamp: '济', role: '汴河船工', name: '周船头', text: '客官，前面便是虹桥！这一船货物可不能闪失。烦请搭把手，瞅准水势，三次都在青色区域内落篙，咱们就能平安过桥。', fact: '虹桥采用无桥墩的木拱结构，让满载货物的漕船得以从桥下通行。画中船只过桥的紧张场面，是整幅长卷的高潮。' },
  { id: 'tea', title: '一盏汴京茶', subtitle: '记下茶客的心头好', chapter: '街市', x: .285, y: .54, stamp: '茗', role: '街角茶坊主人', name: '沈茶娘', text: '远来是客，且坐下歇歇脚。今日茶客多，劳烦你帮我记一份茶点单。看清三样茶点，再按同样的顺序备好，便算你出师了。', fact: '宋代城市茶坊不仅供人饮茶，也是交友、谈生意和听说书的场所。游戏中的茶点搭配为创意设计，并非原画的考据复原。' },
  { id: 'kite', title: '春风寻纸鸢', subtitle: '替孩童找回春天', chapter: '郊野', x: .865, y: .66, stamp: '春', role: '踏青的孩童', name: '阿柳', text: '我的燕子纸鸢被风吹走啦！刚才往东边的柳树旁去了，挂得有些高。你能帮我找找吗？找到了，点一下它就好。', fact: '长卷自右向左展开，从郊外的疏林田野进入汴河，再走向繁盛的城市。踏青、出行与市井劳作，共同构成这幅春日风俗画。' },
];

export const CHAPTERS = [
  { name: '城阙', en: 'CITY GATE', x: .17, note: '车马辐辏，城门初开' },
  { name: '街市', en: 'MARKET STREET', x: .285, note: '一街烟火，半日闲情' },
  { name: '虹桥', en: 'RAINBOW BRIDGE', x: .505, note: '一桥飞架，千帆竞渡' },
  { name: '汴河', en: 'BIAN RIVER', x: .66, note: '舟楫往来，水运繁忙' },
  { name: '郊野', en: 'SPRING OUTSKIRTS', x: .865, note: '柳色新晴，春风入画' },
];

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const newGame = () => ({ version: 1, completed: [], visited: ['虹桥'], kiteAccepted: false, player: { x: .514, y: .72 }, camera: .505 });

export function restoreGame(raw) {
  const fresh = newGame();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return fresh;
    return {
      ...fresh,
      completed: [...new Set((Array.isArray(parsed.completed) ? parsed.completed : []).filter(id => QUESTS.some(q => q.id === id)))],
      visited: [...new Set(['虹桥', ...(Array.isArray(parsed.visited) ? parsed.visited : []).filter(n => CHAPTERS.some(c => c.name === n))])],
      kiteAccepted: parsed.kiteAccepted === true,
      player: {
        x: Number.isFinite(parsed.player?.x) ? clamp(parsed.player.x, .03, .97) : fresh.player.x,
        y: Number.isFinite(parsed.player?.y) ? clamp(parsed.player.y, .16, .9) : fresh.player.y,
      },
      camera: Number.isFinite(parsed.camera) ? clamp(parsed.camera, .03, .97) : fresh.camera,
    };
  } catch { return fresh; }
}

export function completeQuest(state, id) {
  if (!QUESTS.some(q => q.id === id) || state.completed.includes(id)) return state;
  return { ...state, completed: [...state.completed, id] };
}

export function nearestChapter(x) {
  return CHAPTERS.reduce((best, chapter) => Math.abs(chapter.x - x) < Math.abs(best.x - x) ? chapter : best);
}

export function isTimingHit(position) { return position >= .36 && position <= .64; }
export function checkTeaOrder(expected, actual) { return expected.length === actual.length && expected.every((v, i) => v === actual[i]); }
