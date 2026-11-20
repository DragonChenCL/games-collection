export const WORLD = { width: 6000, height: 1700 };
export const SAVE_KEY = 'ruhua-live-v2';
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const riverY = x => 920 + Math.sin(x / 880) * 95 + Math.sin(x / 410) * 24;
export const roadY = (x, bank = 0) => riverY(x) + (bank ? 300 : -270);
export const BRIDGE = { a: { x: 3000, y: roadY(3000) }, b: { x: 3200, y: roadY(3200, 1) } };
export const POIS = [
  { id: 'post', name: '汴京驿使', label: '接取跑腿', x: 3000, y: roadY(3000), color: '#a24d38', type: 'courier' },
  { id: 'tea', name: '刘家茶坊', label: '第一份 · 新茶', x: 2000, y: roadY(2000), color: '#617b69', type: 'shop' },
  { id: 'silk', name: '锦绣绸庄', label: '第二份 · 绸缎', x: 1400, y: roadY(1400), color: '#7a7685', type: 'shop' },
  { id: 'restaurant', name: '孙羊正店', label: '第三份 · 食盒', x: 800, y: roadY(800), color: '#a24d38', type: 'shop' },
  { id: 'dock', name: '汴河码头', label: '登舟拾货', x: 3600, y: roadY(3600) + 100, color: '#537d7b', type: 'boat' },
  { id: 'gate', name: '汴京城门', label: '入城瞧瞧', x: 480, y: roadY(480), color: '#8a7657', type: 'sight' },
  { id: 'fields', name: '郊外春田', label: '春风十里', x: 5250, y: roadY(5250), color: '#6e8152', type: 'sight' },
  { id: 'temple', name: '河畔小庙', label: '过桥寻幽', x: 2300, y: roadY(2300, 1), color: '#8a7657', type: 'sight' },
];
export const SOUVENIRS = [
  { id: 's0', x: 2480, y: roadY(2480, 1) - 18, name: '燕子纸鸢' },
  { id: 's1', x: 4300, y: roadY(4300) + 15, name: '春日花笺' },
  { id: 's2', x: 1150, y: roadY(1150) - 15, name: '如意香囊' },
];
export const COINS = Array.from({ length: 32 }, (_, i) => { const x = 650 + i * 150; return { id: i, x, y: roadY(x, i % 5 === 0 ? 1 : 0) + Math.sin(i * 3) * 22 }; });
export const CARGO = Array.from({ length: 5 }, (_, i) => ({ id: i, x: 3770 + i * 235, y: riverY(3770 + i * 235) + Math.sin(i * 2) * 65 }));
export const DELIVERY = ['tea', 'silk', 'restaurant'];
export const START = { x: 2920, y: roadY(2920) + 10 };
export function newGame() { return { version: 2, player: { ...START }, coins: 0, pickedCoins: [], souvenirs: [], delivered: 0, courierStarted: false, boatWon: false, visited: [] }; }
export function restoreGame(raw) {
  const fresh = newGame();
  try {
    const p = JSON.parse(raw);
    if(p?.version !== 2) return fresh;
    return { ...fresh,
      player: Number.isFinite(p.player?.x) && Number.isFinite(p.player?.y) ? nearestRoad({ x: clamp(p.player.x, 200, 5800), y: clamp(p.player.y, 0, 1700) }).point : { ...START },
      coins: Number.isFinite(p.coins) ? clamp(Math.floor(p.coins), 0, 9999) : 0,
      pickedCoins: [...new Set((Array.isArray(p.pickedCoins) ? p.pickedCoins : []).filter(id => COINS.some(c => c.id === id)))],
      souvenirs: [...new Set((Array.isArray(p.souvenirs) ? p.souvenirs : []).filter(id => SOUVENIRS.some(c => c.id === id)))],
      visited: [...new Set((Array.isArray(p.visited) ? p.visited : []).filter(id => POIS.some(c => c.id === id)))],
      delivered: Number.isFinite(p.delivered) ? clamp(Math.floor(p.delivered), 0, 3) : 0,
      courierStarted: p.courierStarted === true,
      boatWon: p.boatWon === true,
    };
  } catch { return fresh; }
}
export function project(point, a, b) {
  const len = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = len ? clamp(((point.x-a.x)*(b.x-a.x)+(point.y-a.y)*(b.y-a.y))/len,0,1) : 0;
  const p = { x: a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t };
  return { point: p, t, distance: distance(point,p) };
}
export const nodes = [];
export const edges = [];
for(let bank = 0; bank < 2; bank++) {
  for(let i=0;i<29;i++) {
    const x=200+i*200, n=nodes.length;
    nodes.push({x,y:roadY(x,bank)});
    if(i>0) edges.push([n-1,n]);
  }
}
edges.push([14,44]);
nodes.push({x:3600,y:roadY(3600)+100}); edges.push([17,58]);
export function nearestRoad(point) {
  let best = { distance: Infinity };
  for (const edge of edges) { const p = project(point,nodes[edge[0]],nodes[edge[1]]); if(p.distance<best.distance)best={...p,edge}; }
  return best;
}
export function walkable(point) { return nearestRoad(point).distance <= 49; }
export function route(from, to) {
  const a = nearestRoad(from), b = nearestRoad(to);
  if(a.edge[0]===b.edge[0] && a.edge[1]===b.edge[1])return [b.point];
  const graph=nodes.map(()=>[]);
  for(const [i,j] of edges){ const w=distance(nodes[i],nodes[j]);graph[i].push([j,w]);graph[j].push([i,w]); }
  const dist=nodes.map(()=>Infinity), prev=nodes.map(()=>-1), done=new Set();
  for(const n of a.edge) dist[n]=distance(a.point,nodes[n]);
  for(let k=0;k<nodes.length;k++) {
    let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;
    if(u<0||!Number.isFinite(dist[u]))break;done.add(u);
    for(const [v,w] of graph[u])if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u;}
  }
  const end=b.edge.reduce((best,n)=>dist[n]+distance(nodes[n],b.point)<dist[best]+distance(nodes[best],b.point)?n:best);
  const path=[];for(let n=end;n!==-1;n=prev[n])path.unshift({...nodes[n]});
  return [a.point,...path,b.point];
}
export function bridgeLift(p) {
  const projection=project(p,BRIDGE.a,BRIDGE.b);
  return projection.distance<80 ? Math.sin(projection.t*Math.PI)*76 : 0;
}
export function stampCount(s) { return Number(s.delivered===3)+Number(s.boatWon)+Number(s.souvenirs.length===3); }
export function boatWithinRiver(p) { return p.x >= 250 && p.x <= 5750 && Math.abs(p.y-riverY(p.x)) <= 111; }
