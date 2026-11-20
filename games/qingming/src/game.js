export const WORLD = { width: 18000, height: 1700 };
export const SAVE_KEY = 'ruhua-live-v2';
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const riverY = x => 920 + Math.sin(x / 880) * 95 + Math.sin(x / 410) * 24;
export const roadY = (x, bank = 0) => riverY(x) + (bank ? 300 : -270);
export const BRIDGE = { kind:'rainbow', height:150, a: { x: 2800, y: roadY(2800) }, b: { x: 3600, y: roadY(3600, 1) } };
export const BRIDGES = [BRIDGE, ...[9000,15000].map((x,i)=>({kind:i?'timber':'stone',height:i?0:52,a:{x,y:roadY(x)},b:{x:x+800,y:roadY(x+800,1)}}))];
export const BRIDGE_HEIGHT = 150;
export const DISTRICTS = [
  {x:480,name:'城阙晨声',note:'城门初开，商旅络绎。'},
  {x:1800,name:'汴京街市',note:'茶烟酒旆，一街人间。'},
  {x:3100,name:'虹桥渡口',note:'木拱如虹，百业过桥。'},
  {x:4200,name:'汴河舟影',note:'货船卸帆，渔火未眠。'},
  {x:5400,name:'柳陌春田',note:'村头春水，陌上新桑。'},
  {x:7100,name:'船坞匠作',note:'斧凿相和，巨木成舟。'},
  {x:9100,name:'水磨田庄',note:'水轮不歇，麦浪成行。'},
  {x:12000,bank:1,name:'竹林古刹',note:'疏钟入竹，曲径通幽。'},
  {x:14600,name:'村社春集',note:'布棚开市，百戏迎春。'},
  {x:17100,name:'远郊踏青',note:'牛羊缓行，纸鸢入云。'},
];
export const districtAt = x => DISTRICTS.reduce((best,d)=>Math.abs(d.x-x)<Math.abs(best.x-x)?d:best);
export const POIS = [
  { id: 'post', name: '汴京驿使', label: '接取跑腿', x: 3000, y: roadY(3000), color: '#a24d38', type: 'courier' },
  { id: 'tea', name: '刘家茶坊', label: '第一份 · 新茶', x: 2000, y: roadY(2000), color: '#617b69', type: 'shop' },
  { id: 'silk', name: '锦绣绸庄', label: '第二份 · 绸缎', x: 1400, y: roadY(1400), color: '#7a7685', type: 'shop' },
  { id: 'restaurant', name: '孙羊正店', label: '第三份 · 食盒', x: 800, y: roadY(800), color: '#a24d38', type: 'shop' },
  { id: 'dock', name: '汴河码头', label: '登舟拾货', x: 3600, y: roadY(3600) + 100, color: '#537d7b', type: 'boat' },
  { id: 'gate', name: '汴京城门', label: '入城瞧瞧', x: 480, y: roadY(480), color: '#8a7657', type: 'sight' },
  { id: 'fields', name: '郊外春田', label: '春风十里', x: 5250, y: roadY(5250), color: '#6e8152', type: 'sight' },
  { id: 'temple', name: '河畔小庙', label: '过桥寻幽', x: 2300, y: roadY(2300, 1), color: '#8a7657', type: 'sight' },
  { id: 'shipyard', name: '汴东船坞', label: '帮木匠落锤', x: 6900, y: roadY(6900), color: '#86724e', type: 'sight' },
  { id: 'mill', name: '河湾水磨', label: '推水轮磨麦', x: 8700, y: roadY(8700), color: '#6c826c', type: 'sight' },
  { id: 'grove', name: '竹林古刹', label: '记四声钟音', x: 12000, y: roadY(12000,1), color: '#6a7f65', type: 'sight' },
  { id: 'fair', name: '村社春集', label: '寻盏下红豆', x: 14500, y: roadY(14500), color: '#a16b4d', type: 'sight' },
  { id: 'outing', name: '远郊踏青', label: '借风放纸鸢', x: 17100, y: roadY(17100), color: '#74825d', type: 'sight' },
];
export const SOUVENIRS = [
  { id: 's0', x: 2480, y: roadY(2480, 1) - 18, name: '燕子纸鸢' },
  { id: 's1', x: 4300, y: roadY(4300) + 15, name: '春日花笺' },
  { id: 's2', x: 1150, y: roadY(1150) - 15, name: '如意香囊' },
];
export const COINS = Array.from({ length: 72 }, (_, i) => { const x = i<32?650+i*150:5750+(i-32)*300; return { id: i, x, y: roadY(x, i % 5 === 0 ? 1 : 0) + Math.sin(i * 3) * 22 }; });
export const CARGO = Array.from({ length: 5 }, (_, i) => ({ id: i, x: 3770 + i * 235, y: riverY(3770 + i * 235) + Math.sin(i * 2) * 65 }));
export const DELIVERY = ['tea', 'silk', 'restaurant'];
export const PARCELS = [
  {id:'tea',name:'竹纸包 · 一撮嫩叶',clue:'掌柜正在烧水，等着今年的头一茬新茶。',reply:'春茶到得正好！街角的说书人还没开讲，先替你留一盏。'},
  {id:'silk',name:'青布包 · 折好的细绢',clue:'掌柜拿着裁尺，要一匹能绣春燕的素绢。',reply:'细绢没有沾水，真是细心。等绣好春燕，送你看看手艺。'},
  {id:'restaurant',name:'双层盒 · 温热的春蔬',clue:'跑堂催着上菜，客人等一盒春蔬点心。',reply:'食盒还热着，恰好赶上开席。今日满楼客人，有你一份辛劳。'},
];
export function handOverParcel(state,shop,parcel) {
  const expected=DELIVERY[state.delivered];
  if(!state.courierStarted||!expected||expected!==shop||parcel!==expected)return false;
  state.delivered++;state.coins+=12;return true;
}
export function markGuide(game,target) {
  game.guide={...target};game.path=[];game.target=null;
}
export const RURAL_ACTIVITIES={
  shipyard:{npc:'造船木匠',title:'船坞落锤',kind:'timing',words:'木匠请你帮忙合拢船板。指针进入标出的命中区时落锤，连中三次。'},
  mill:{npc:'水磨庄主',title:'转轮磨麦',kind:'wheel',words:'顺时针划动水轮两圈，让磨石转起来。也可点按水轮十二下。'},
  grove:{npc:'古刹知客',title:'竹下听钟',kind:'bells',words:'记住钟声的四个音名，遮住后按原顺序点回。无需开启声音。'},
  fair:{npc:'春集艺人',title:'三盏藏豆',kind:'cups',words:'记住红豆藏在哪只碗下，看清茶碗交换位置，再选出藏豆的一盏。'},
  outing:{npc:'踏青牧童',title:'借风放鸢',kind:'kite',words:'风会把纸鸢吹偏。按住左右按钮收放风线，让纸鸢在中央标出的安全区停留八秒。'}
};
export const START = { x: 2920, y: roadY(2920) + 10 };
export function newGame() { return { version: 2, player: { ...START }, coins: 0, pickedCoins: [], souvenirs: [], delivered: 0, courierStarted: false, boatWon: false, visited: [],rural:[],travelPass:true }; }
export function restoreGame(raw) {
  const fresh = newGame();
  try {
    const p = JSON.parse(raw);
    if(p?.version !== 2) return fresh;
    return { ...fresh,
      player: Number.isFinite(p.player?.x) && Number.isFinite(p.player?.y) ? nearestRoad({ x: clamp(p.player.x, 200, WORLD.width-200), y: clamp(p.player.y, 0, WORLD.height) }).point : { ...START },
      coins: Number.isFinite(p.coins) ? clamp(Math.floor(p.coins), 0, 9999) : 0,
      pickedCoins: [...new Set((Array.isArray(p.pickedCoins) ? p.pickedCoins : []).filter(id => COINS.some(c => c.id === id)))],
      souvenirs: [...new Set((Array.isArray(p.souvenirs) ? p.souvenirs : []).filter(id => SOUVENIRS.some(c => c.id === id)))],
      visited: [...new Set((Array.isArray(p.visited) ? p.visited : []).filter(id => POIS.some(c => c.id === id)))],
      delivered: Number.isFinite(p.delivered) ? clamp(Math.floor(p.delivered), 0, 3) : 0,
      courierStarted: p.courierStarted === true,
      boatWon: p.boatWon === true,
      travelPass: p.travelPass !== false,
      rural:[...new Set((Array.isArray(p.rural)?p.rural:[]).filter(id=>Object.hasOwn(RURAL_ACTIVITIES,id)))],
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
export const BANK_NODES = (WORLD.width-400)/200+1;
for(let bank = 0; bank < 2; bank++) {
  for(let i=0;i<BANK_NODES;i++) {
    const x=200+i*200, n=nodes.length;
    nodes.push({x,y:roadY(x,bank)});
    if(i>0) edges.push([n-1,n]);
  }
}
for(const bridge of BRIDGES)edges.push([(bridge.a.x-200)/200,BANK_NODES+(bridge.b.x-200)/200]);
const dockNode=nodes.length;nodes.push({x:3600,y:roadY(3600)+100}); edges.push([17,dockNode]);
export function nearestRoad(point) {
  let best = { distance: Infinity };
  for (const edge of edges) { const p = project(point,nodes[edge[0]],nodes[edge[1]]); if(p.distance<best.distance)best={...p,edge}; }
  return best;
}
export function walkable(point) { return nearestRoad(point).distance <= 49; }
export function stepAlongRoad(from,dx,dy,amount) {
  const len=Math.hypot(dx,dy);if(!len)return {...from};
  const next={x:from.x+dx/len*amount,y:from.y+dy/len*amount};
  if(walkable(next))return next;
  const current=nearestRoad(from),projected=nearestRoad(next).point;
  // Slide around a bend instead of trapping horizontal input on the road edge.
  if(distance(from,projected)<=amount*1.5)return projected;
  const advance=distance(current.point,projected);
  if(advance<.01||advance>amount*1.2){
    const candidates=edges.map(([a,b])=>{
      const v={x:nodes[b].x-nodes[a].x,y:nodes[b].y-nodes[a].y},alignment=Math.abs(v.x*dx+v.y*dy)/Math.hypot(v.x,v.y)/len;
      const p=project(next,nodes[a],nodes[b]);return {...p,alignment};
    }).filter(p=>p.alignment>.5&&p.distance<140).sort((a,b)=>a.distance-b.distance);
    for(const p of candidates){const d=distance(from,p.point),f=Math.min(1,amount/d),slide={x:from.x+(p.point.x-from.x)*f,y:from.y+(p.point.y-from.y)*f};if(walkable(slide))return slide;}
    return {...from};
  }
  const offset={x:from.x-current.point.x,y:from.y-current.point.y},scale=47/Math.max(47,current.distance);
  return {x:projected.x+offset.x*scale,y:projected.y+offset.y*scale};
}
export function nearestSouvenir(from,owned) {
  return SOUVENIRS.filter(p=>!owned.includes(p.id)).map(p=>{
    let previous=from,length=0;for(const point of route(from,p)){length+=distance(previous,point);previous=point;}
    return {p,length};
  }).sort((a,b)=>a.length-b.length)[0]?.p;
}
export function restoreSession(raw) {
  const result={zoom:.75,sound:false,boat:null,view:'scroll',yaw:Math.PI};
  try{
    const p=JSON.parse(raw);if(p?.version!==2)return result;
    if(Number.isFinite(p.preferences?.zoom))result.zoom=clamp(p.preferences.zoom,.46,2.2);
    result.sound=p.preferences?.sound===true;
    result.view=p.preferences?.view==='eye'?'eye':'scroll';
    if(Number.isFinite(p.preferences?.yaw))result.yaw=p.preferences.yaw%(Math.PI*2);
    const b=p.activeBoat;
    if(b&&Number.isFinite(b.remaining)&&b.remaining>0&&Number.isFinite(b.player?.x)&&Number.isFinite(b.player?.y)&&boatWithinRiver(b.player)){
      result.boat={player:{x:b.player.x,y:b.player.y},remaining:clamp(b.remaining,0,90),collected:[...new Set((Array.isArray(b.collected)?b.collected:[]).filter(id=>CARGO.some(c=>c.id===id)))],cooldown:3,boost:0};
    }
  }catch{}
  return result;
}
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
  for(const bridge of BRIDGES){
    const projection=project(p,bridge.a,bridge.b);
    if(projection.distance<80)return Math.sin(projection.t*Math.PI)*(bridge.height??BRIDGE_HEIGHT);
  }
  return 0;
}
export function stampCount(s) { return Number(s.delivered===3)+Number(s.boatWon)+Number(s.souvenirs.length===3); }
export function boatWithinRiver(p) { return p.x >= 250 && p.x <= WORLD.width-250 && Math.abs(p.y-riverY(p.x)) <= 111; }
