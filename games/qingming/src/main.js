import './style.css';
import { SAVE_KEY, POIS, SOUVENIRS, COINS, CARGO, DELIVERY, START, newGame, restoreGame, distance, clamp, riverY, roadY, route, walkable, bridgeLift, stampCount } from './game.js';
import { Scene } from './scene.js';

const $ = s => document.querySelector(s);
let stored=null;try{stored=localStorage.getItem(SAVE_KEY);}catch{}
const state=restoreGame(stored);
const game={ state, player:{...state.player}, camera:{x:state.player.x,y:state.player.y+90,zoom:innerWidth<700?.82:.86}, mode:'walk',boatRun:null,path:[],target:null,particles:[],facing:1,moving:false,following:true,paused:false,time:0 };
let stamina=100, keys=new Set(), near=null, scene, last=0, lastSave=0, lastHUD=0, toastTimer, ambient=null, audioContext=null, soundOn=false;
let stick={x:0,y:0}, sprint=false, dragging=null, dirty=false;

document.querySelector('#app').innerHTML=`
  <header class="topbar">
    <a class="brand" href="../../" aria-label="返回游戏合集"><span class="seal">入<br>画</span><span>清明上河图<small>A LIVING HANDSCROLL</small></span></a>
    <div class="era"><span class="live-dot"></span>汴京 · 清明<span class="era-detail">一城烟火，正待君来</span></div>
    <nav class="top-tools"><button id="sound" title="开启环境音" aria-label="开启环境音" aria-pressed="false">♫<span>环境音</span></button><button id="journal" title="游历手记">▤<span>手记</span></button><button id="help" title="操作指南">?<span>怎么玩</span></button><button id="fullscreen" title="全屏游玩" aria-label="全屏游玩">⛶</button></nav>
  </header>
  <main id="world" class="world">
    <canvas id="scene" tabindex="0" aria-label="实时绘制的汴京世界。方向键或 WASD 行走，E 互动，Shift 疾行。点击地面会沿道路寻路。"></canvas>
    <div class="world-caption"><span>北宋风物 · 实时绘制</span><h1 id="district">虹桥渡口</h1><p id="district-note">一桥飞架，舟楫往来。</p></div>
    <aside id="quests" class="quests parchment" aria-label="游历目标">
      <button id="quest-toggle" class="quest-heading"><span>今日游历<small>三枚印记，一日汴京</small></span><span id="stamp-count">0 / 3</span></button>
      <div class="quest-list">
        <button class="quest-row" id="courier-quest"><span class="quest-icon">信</span><span><b>街市跑腿</b><small id="courier-detail">与虹桥旁的驿使交谈</small></span><span class="quest-arrow">↗</span></button>
        <button class="quest-row" id="boat-quest"><span class="quest-icon">舟</span><span><b>汴河拾货</b><small id="boat-detail">去码头，亲手摇橹拾货</small></span><span class="quest-arrow">↗</span></button>
        <button class="quest-row" id="souvenir-quest"><span class="quest-icon">春</span><span><b>春日拾趣</b><small id="souvenir-detail">沿两岸寻找三件春日小物</small></span><span class="quest-arrow">↗</span></button>
      </div>
      <p class="quest-foot">点选目标，沿街寻路。到身边后按 E 互动。</p>
    </aside>
    <div class="view-tools parchment"><button id="zoom-in" aria-label="放大画面" title="放大">＋</button><button id="zoom-out" aria-label="缩小画面" title="缩小">−</button><span></span><button id="follow" title="镜头回到我" aria-label="镜头回到我">⌖</button><button id="pause" title="暂停 / 继续" aria-label="暂停游戏" aria-pressed="false">Ⅱ</button></div>
    <div class="purse parchment"><i>文</i><strong id="coins">0</strong><span>铜钱</span><div class="energy"><div id="energy-fill"></div></div><small>脚力</small></div>
    <div id="boat-hud" class="boat-hud parchment" hidden><span>汴河拾货 <b id="cargo-count">0 / 5</b></span><strong id="boat-time">60</strong><small>秒 · 避开漕船，靠近木箱拾取</small><button id="disembark">返回码头</button></div>
    <div id="welcome" class="welcome parchment" ${stored?'hidden':''}><span class="eyebrow">不是观画，是入画。</span><h2>千年烟火，等你入城。</h2><p>走过虹桥，穿行街市，再亲手摇一叶舟。<br>这里的每一片屋瓦、每一个行人，都由代码绘出。</p><button id="begin" class="primary">启程 · 走进汴京 <span>→</span></button><small>WASD 行走 · 点击地面寻路 · E 互动</small></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="pause-screen" class="pause-screen" hidden><span>稍 歇 片 刻</span><button id="resume" class="primary">继续游历</button></div>
    <div class="action-area"><button id="interact" class="interact" disabled><kbd>E</kbd><span>走近人物，与市井相逢</span></button><span class="move-hint">W A S D 行走 <i>·</i> Shift 疾行 <i>·</i> 点击寻路 / 拖动画面</span></div>
    <div class="touch-controls"><div class="dpad" aria-label="触屏方向控制"><button data-key="arrowup" aria-label="向上走">↑</button><button data-key="arrowleft" aria-label="向左走">←</button><span>行</span><button data-key="arrowright" aria-label="向右走">→</button><button data-key="arrowdown" aria-label="向下走">↓</button></div><button id="sprint" aria-label="按住疾行">疾<br>行</button></div>
    <div class="map-wrap parchment"><div class="map-title"><span>汴京舆图</span><small>点图寻路</small></div><canvas id="minimap" width="440" height="114" aria-label="点击舆图前往两岸道路"></canvas><div class="map-labels"><span>城阙</span><span>街市</span><span>虹桥</span><span>郊野</span></div></div>
  </main>
  <footer class="statusbar"><span><i class="live-dot"></i>一卷会呼吸的汴京</span><span id="journey">已探索 0 / 8 处风物</span><span id="save-status">进度自动留在此浏览器</span><a href="../../">← 返回闲游合集</a></footer>
  <dialog id="dialog" class="parchment"><button id="close-dialog" class="dialog-close" aria-label="关闭对话">×</button><span class="eyebrow">汴京 · 市井相逢</span><h2 id="dialog-title"></h2><div id="dialog-body"></div><div id="dialog-actions"></div></dialog>
`;

const canvas=$('#scene'),dialog=$('#dialog');
function save() {
  if(game.mode==='walk')state.player={...game.player};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('#save-status').textContent='游历进度已保存';}catch{$('#save-status').textContent='浏览器未允许保存，离开后进度会丢失';}
  dirty=false;
}
function toast(text) { $('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function showDialog(title,body,actions=[{text:'继续游历'}]) {
  keys.clear();stick={x:0,y:0};sprint=false;
  $('#dialog-title').textContent=title;$('#dialog-body').innerHTML=body;
  $('#dialog-actions').replaceChildren();
  for(const action of actions){const b=document.createElement('button');b.className=action.secondary?'secondary':'primary';b.textContent=action.text;b.onclick=()=>{dialog.close();action.run?.();updateHUD();};$('#dialog-actions').append(b);}
  dialog.showModal();
}
function burst(p) { for(let i=0;i<12;i++)game.particles.push({x:p.x,y:p.y-12,vx:(Math.random()-.5)*75,vy:-30-Math.random()*60,life:1}); }
function goto(p) {
  $('#welcome').hidden=true;game.following=true;
  if(game.mode==='boat'){game.target={x:clamp(p.x,250,5750),y:clamp(p.y,riverY(p.x)-100,riverY(p.x)+100)};return;}
  game.path=route(game.player,p);game.target=game.path.at(-1);dirty=true;
}
function goPOI(id) { if(game.mode==='boat'){toast('先在右上方返回码头，再步行游历。');return;}const p=POIS.find(p=>p.id===id);goto(p);toast(`正在前往${p.name}，到达后按 E 互动。`); }
function nearest() {
  const candidates=[...POIS.map(p=>({...p,kind:'person'})),...SOUVENIRS.filter(p=>!state.souvenirs.includes(p.id)).map(p=>({...p,kind:'item'}))];
  return candidates.map(p=>({...p,d:distance(p,game.player)})).filter(p=>p.d<(p.kind==='item'?72:103)).sort((a,b)=>a.d-b.d)[0]||null;
}
function interact() {
  if(dialog.open||game.paused)return;
  if(game.mode==='boat'){stamina=Math.max(0,stamina-12);game.boatRun.boost=1;return;}
  near=nearest();if(!near)return;
  game.path=[];game.target=null;game.moving=false;
  if(near.kind==='item'){
    state.souvenirs.push(near.id);state.coins+=8;burst(near);toast(`拾得${near.name} · +8 文${state.souvenirs.length===3?' · 「春」印已入手记':''}`);chime();save();updateHUD();checkEnding();return;
  }
  const p=near;
  if(p.id==='post'){
    if(state.delivered===3){showDialog('驿使 · 多谢这位好脚力', '<p>三家都捎话来了：你的东西送得又快又稳！城里城外，再去转转吧。</p><p class="fact">宋代的街市已相当繁盛，酒楼、茶坊与各色行铺相邻而立。</p>');return;}
    if(!state.courierStarted){
      showDialog('驿使 · 替我跑一趟街市？','<p>这位小哥，正好！请沿街往西，把新茶送去<b>刘家茶坊</b>，绸缎送去<b>锦绣绸庄</b>，最后把食盒送到<b>孙羊正店</b>。</p><p>三份都在你背篓里。每送到一家，走到掌柜身边按 <kbd>E</kbd>。送齐三家，酬你一枚「信」印。</p>',[{text:'接下委托 · 装好背篓',run:()=>{state.courierStarted=true;save();toast('沿北岸向西走：第一站，刘家茶坊。点击左侧任务可寻路。');}},{text:'我先四处走走',secondary:true}]);
    }else{goPOI(DELIVERY[state.delivered]);}
    return;
  }
  if(p.id==='dock'){
    showDialog('船头 · 这回，换你掌舵','<p>东边的货箱落了水。借你一叶小舟，<b>60 秒内拾起 5 个木箱</b>，便能换来「舟」印。</p><p><kbd>WASD</kbd> / 方向键划船，也可点击水面驶向目标；按住 <kbd>Shift</kbd> 加速。靠近货箱自动拾取，撞到漕船会损失 5 秒。</p><p class="fact">虹桥没有桥墩，河上大船可从拱下通行。试着从桥下摇过去。</p>',[{text:'登舟 · 我来试试',run:startBoat},{text:'暂不上船',secondary:true}]);return;
  }
  if(state.courierStarted&&DELIVERY[state.delivered]===p.id){
    state.delivered++;state.coins+=12;stamina=100;burst(p);chime();save();
    const next=POIS.find(p=>p.id===DELIVERY[state.delivered]);
    showDialog(`${p.name} · 送到了`, `<p>有劳你专程跑这一趟！这一份收下了，<b>酬谢 12 文</b>。坐下喝口茶，脚力也恢复了。</p><p>${next?`下一家是<b>${next.name}</b>，继续沿街往西。`:'三份委托全部送达，「信」印已记入手记。谢谢这位汴京好脚力！'}</p>`,[{text:next?'好，继续送下一家':'收下「信」印',run:()=>checkEnding()}]);return;
  }
  if(p.type==='shop'){
    showDialog(`${p.name} · 客官里边请`,'<p>街市再热闹，也别忘了歇歇脚。一盏茶 5 文，脚力立即回满。</p><p class="fact">茶坊既是休憩之处，也是听书、交游和做生意的地方。</p>',[{text:state.coins>=5?'花 5 文，喝盏茶':'铜钱不足，改日再来',run:()=>{if(state.coins>=5){state.coins-=5;stamina=100;save();toast('一盏清茶，脚力已回满。');}}},{text:'继续逛逛',secondary:true}]);return;
  }
  const words={gate:'城门下商旅往来，驴车驮货而入。长卷把城郊与市井相连，让寻常百姓的日子成为主角。',fields:'城外，春田水满，行人踏青。再往回望，汴河把田野与繁忙的城市连在一起。',temple:'走过虹桥，南岸忽然安静下来。你可以从这里沿河寻找遗落的燕子纸鸢。'};
  showDialog(p.name,`<p>${words[p.id]||'且听人声，且看流水。'}</p><p class="fact">本作是依据原画意象创作的互动小城，不是逐像素或建筑考古复原。</p>`);
}
function startBoat() {
  save();game.mode='boat';game.path=[];game.target=null;game.player={x:3650,y:riverY(3650)-65};game.boatRun={remaining:60,collected:[],cooldown:0,boost:0};game.following=true;stamina=100;game.facing=1;toast('向东出发！靠近发光木箱拾货，留意来往漕船。');updateHUD();
}
function finishBoat(won=false) {
  if(game.mode!=='boat')return;
  const first=!state.boatWon;
  if(won){state.boatWon=true;state.coins+=first?35:8;chime();}
  game.mode='walk';const dock=POIS.find(p=>p.id==='dock');game.player={x:dock.x,y:dock.y};game.path=[];game.target=null;game.boatRun=null;game.following=true;save();updateHUD();
  toast(won?`五箱货物平安打捞！+${first?35:8} 文${first?' · 获得「舟」印':''}`:'已回到码头。随时可以再借船一试。');checkEnding();
}
function checkEnding() {
  if(stampCount(state)===3){setTimeout(()=>{if(!dialog.open)showDialog('一日汴京 · 三印已集齐','<p>街市的一封信，河上的一叶舟，春日里的一次偶遇。你已经不只是看画的人，也是画中的过客。</p><div class="earned-stamps"><span>信</span><span>舟</span><span>春</span></div><p>这座小城仍在呼吸。继续漫游，或在手记里重新启程。</p>');},650);}
}
function updateHUD() {
  $('#coins').textContent=state.coins;$('#stamp-count').textContent=`${stampCount(state)} / 3`;
  $('#courier-detail').textContent=state.delivered===3?'三份送达 · 「信」印已得':state.courierStarted?`已送 ${state.delivered} / 3 · 前往${POIS.find(p=>p.id===DELIVERY[state.delivered]).name}`:'与虹桥旁的驿使交谈';
  $('#boat-detail').textContent=state.boatWon?'五箱归仓 · 「舟」印已得':'去码头，亲手摇橹拾货';
  $('#souvenir-detail').textContent=state.souvenirs.length===3?'三物收齐 · 「春」印已得':`已拾 ${state.souvenirs.length} / 3 · 两岸都有春日小物`;
  $('#courier-quest').classList.toggle('complete',state.delivered===3);$('#boat-quest').classList.toggle('complete',state.boatWon);$('#souvenir-quest').classList.toggle('complete',state.souvenirs.length===3);
  $('#journey').textContent=`已探索 ${state.visited.length} / 8 处风物`;
  near=game.mode==='walk'?nearest():null;
  $('#interact').disabled=!near&&game.mode!=='boat';
  $('#interact span').textContent=game.mode==='boat'?'用力划桨':near?near.kind==='item'?`拾起${near.name}`:near.id==='dock'?'登舟 · 汴河拾货':`与${near.name}交谈`:'走近人物，与市井相逢';
  $('#boat-hud').hidden=game.mode!=='boat';
  if(game.mode==='boat'){$('#cargo-count').textContent=`${game.boatRun.collected.length} / 5` ;$('#boat-time').textContent=Math.ceil(game.boatRun.remaining);}
  const x=game.camera.x, district=x<850?'城阙晨声':x<2400?'汴京街市':x<3400?'虹桥渡口':x<4500?'汴河舟影':'郊野春晴';
  const notes={'城阙晨声':'城门初开，商旅络绎。','汴京街市':'茶烟酒旆，一街人间。','虹桥渡口':'一桥飞架，舟楫往来。','汴河舟影':'水声橹声，向东而行。','郊野春晴':'柳色新晴，春风十里。'};
  $('#district').textContent=district;$('#district-note').textContent=notes[district];
  $('#follow').classList.toggle('active',game.following);$('#energy-fill').style.width=`${stamina}%`;
  drawMap();
}
function drawMap() {
  const m=$('#minimap'),c=m.getContext('2d'),sx=m.width/6000,sy=m.height/1700;c.clearRect(0,0,m.width,m.height);
  c.lineCap='round';c.beginPath();for(let x=0;x<=6000;x+=50)x?c.lineTo(x*sx,riverY(x)*sy):c.moveTo(0,riverY(0)*sy);c.strokeStyle='#91a68e88';c.lineWidth=19;c.stroke();
  for(const b of [0,1]){c.beginPath();for(let x=200;x<=5800;x+=100)x>200?c.lineTo(x*sx,roadY(x,b)*sy):c.moveTo(x*sx,roadY(x,b)*sy);c.lineWidth=1;c.strokeStyle='#a4936a88';c.stroke();}
  c.beginPath();c.moveTo(3000*sx,roadY(3000)*sy);c.lineTo(3200*sx,roadY(3200,1)*sy);c.lineWidth=3;c.strokeStyle='#9e8052';c.stroke();
  for(const p of POIS){c.fillStyle=p.color;c.fillRect(p.x*sx-2,p.y*sy-2,4,4);}
  for(const p of SOUVENIRS)if(!state.souvenirs.includes(p.id)){c.strokeStyle='#9f5842';c.strokeRect(p.x*sx-3,p.y*sy-3,6,6);}
  c.strokeStyle='#756f5144';c.lineWidth=1;c.strokeRect((game.camera.x-scene.width/2/game.camera.zoom)*sx,(game.camera.y-scene.height/2/game.camera.zoom)*sy,scene.width/game.camera.zoom*sx,scene.height/game.camera.zoom*sy);
  c.beginPath();c.arc(game.player.x*sx,game.player.y*sy,4,0,Math.PI*2);c.fillStyle='#9c4734';c.fill();c.strokeStyle='#f7edd3';c.lineWidth=1.5;c.stroke();
}
function walk(dx,dy,dt,speed) {
  const len=Math.hypot(dx,dy);if(!len)return;
  const next={x:game.player.x+dx/len*speed*dt,y:game.player.y+dy/len*speed*dt};
  if(walkable(next)){game.player=next;game.moving=true;}
  else{
    const xonly={x:next.x,y:game.player.y},yonly={x:game.player.x,y:next.y};
    if(walkable(xonly)){game.player=xonly;game.moving=true;}else if(walkable(yonly)){game.player=yonly;game.moving=true;}
  }
  if(dx)game.facing=Math.sign(dx);
}
function tick(dt) {
  game.time+=dt;scene.update(dt,game.time);game.moving=false;
  const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+stick.x;
  const dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))+stick.y;
  const running=(keys.has('shift')||keys.has(' ')||sprint||game.boatRun?.boost>0)&&stamina>1;
  let speed=game.mode==='boat'?170:205;if(running)speed*=1.65;
  const input=Math.hypot(dx,dy)>0;
  if(game.mode==='walk'){
    if(input){game.path=[];game.target=null;game.following=true;walk(dx,dy,dt,speed);dirty=true;}
    else if(game.path.length){
      let budget=speed*dt;
      while(game.path.length&&budget>0){const p=game.path[0],d=distance(p,game.player);if(d<=budget){game.player={...p};budget-=d;game.path.shift();}else{game.facing=Math.sign(p.x-game.player.x)||game.facing;game.player.x+=(p.x-game.player.x)/d*budget;game.player.y+=(p.y-game.player.y)/d*budget;budget=0;}game.moving=true;}
      if(!game.path.length)game.target=null;dirty=true;
    }
    for(const coin of COINS)if(!state.pickedCoins.includes(coin.id)&&distance(coin,game.player)<24){state.pickedCoins.push(coin.id);state.coins++;burst(coin);dirty=true;}
    for(const p of POIS)if(!state.visited.includes(p.id)&&distance(p,game.player)<130){state.visited.push(p.id);dirty=true;}
  }else{
    const run=game.boatRun;run.remaining-=dt;run.cooldown=Math.max(0,run.cooldown-dt);run.boost=Math.max(0,run.boost-dt);
    let vx=dx,vy=dy;
    if(input)game.target=null;
    else if(game.target){const d=distance(game.target,game.player);if(d<12)game.target=null;else{vx=(game.target.x-game.player.x)/d;vy=(game.target.y-game.player.y)/d;}}
    const len=Math.hypot(vx,vy);if(len){game.player.x=clamp(game.player.x+vx/len*speed*dt,250,5750);game.player.y+=vy/len*speed*dt;game.moving=true;game.facing=Math.sign(vx)||game.facing;}
    game.player.y=clamp(game.player.y,riverY(game.player.x)-110,riverY(game.player.x)+110);
    for(const ship of scene.ships)if(run.cooldown===0&&Math.abs(ship.x-game.player.x)<(ship.large?85:57)&&Math.abs(ship.y-game.player.y)<28){run.remaining-=5;run.cooldown=2;game.player.y=clamp(game.player.y+(game.player.y>ship.y?32:-32),riverY(game.player.x)-110,riverY(game.player.x)+110);toast('小心漕船！绕开它，损失了 5 秒。');}
    for(const cargo of CARGO)if(!run.collected.includes(cargo.id)&&distance(game.player,cargo)<42){run.collected.push(cargo.id);burst(cargo);chime();toast(`已拾起 ${run.collected.length} / 5 箱货物`);}
    if(run.collected.length===5)finishBoat(true);else if(run.remaining<=0)finishBoat(false);
  }
  stamina=clamp(stamina+(running&&game.moving?-20:12)*dt,0,100);
  if(game.following){const lift=game.mode==='walk'?bridgeLift(game.player):0;const f=1-Math.exp(-dt*5);game.camera.x+=(game.player.x-game.camera.x)*f;game.camera.y+=(game.player.y-lift+85-game.camera.y)*f;}
  game.camera.x=clamp(game.camera.x,350,5650);game.camera.y=clamp(game.camera.y,350,1390);
  for(const p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=85*dt;p.life-=dt;}game.particles=game.particles.filter(p=>p.life>0);
}
function frame(now) {
  const dt=Math.min((now-last)/1000||.016,.05);last=now;
  if(!game.paused&&!dialog.open)tick(dt);
  scene.draw(game);
  if(now-lastHUD>120){updateHUD();lastHUD=now;}
  if(now-lastSave>2500&&dirty){save();lastSave=now;}
  requestAnimationFrame(frame);
}

$('#begin').onclick=()=>{$('#welcome').hidden=true;canvas.focus({preventScroll:true});toast('你穿红衣、背竹篓，就在虹桥北端。走近驿使，按 E 接个差事吧。');};
$('#close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#interact').onclick=interact;$('#disembark').onclick=()=>finishBoat();
$('#courier-quest').onclick=()=>goPOI(state.courierStarted&&state.delivered<3?DELIVERY[state.delivered]:'post');
$('#boat-quest').onclick=()=>goPOI('dock');
$('#souvenir-quest').onclick=()=>{const p=SOUVENIRS.find(p=>!state.souvenirs.includes(p.id));if(!p){toast('三件春日小物已收入行囊。');return;}if(game.mode==='boat'){toast('先回码头，再去寻春日小物。');return;}goto(p);toast(`前往${p.name}附近，走近后按 E 拾取。`);};
$('#quest-toggle').onclick=()=>$('#quests').classList.toggle('expanded');
function zoom(delta) { game.camera.zoom=clamp(game.camera.zoom+delta,.46,1.4); }
$('#zoom-in').onclick=()=>zoom(.12);$('#zoom-out').onclick=()=>zoom(-.12);$('#follow').onclick=()=>{game.following=true;};
function pause() { game.paused=!game.paused;$('#pause-screen').hidden=!game.paused;$('#pause').setAttribute('aria-pressed',String(game.paused));$('#pause').setAttribute('aria-label',game.paused?'继续游戏':'暂停游戏');keys.clear(); }
$('#pause').onclick=pause;$('#resume').onclick=pause;
$('#help').onclick=()=>showDialog('初到汴京，怎样游历？','<div class="controls-guide"><p><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> 沿街行走；<kbd>Shift</kbd> 疾行。</p><p><b>点击地面</b>：沿道路自动寻路，过河会走虹桥。</p><p><kbd>E</kbd> / 底部互动按钮：与身边人物交谈、送货、拾取。</p><p><b>拖动画面</b>：自由看风景；<b>⌖</b> 镜头回到自己。</p><p><b>舆图 / 左侧任务</b>：前往目标，不会瞬间传送。</p><p><b>手机</b>：左下方向盘行走，按住「疾行」加速；点底部按钮互动。</p><p><b>乘船</b>：在码头登舟，60 秒内捞起 5 个木箱；碰到漕船会扣时。</p></div><p class="fact">进度保存在当前浏览器。重新打开会回到上次停留的道路；未完成的拾货挑战需从码头重新开始。</p>');
$('#journal').onclick=()=>showDialog('行囊 · 一日汴京',`<div class="earned-stamps"><span class="${state.delivered===3?'earned':''}">信</span><span class="${state.boatWon?'earned':''}">舟</span><span class="${state.souvenirs.length===3?'earned':''}">春</span></div><p>街市跑腿：${state.delivered} / 3 份送达<br>汴河拾货：${state.boatWon?'已完成':'待乘舟'}<br>春日拾趣：${state.souvenirs.length} / 3 件小物<br>探索风物：${state.visited.length} / 8 处<br>行囊铜钱：${state.coins} 文</p><p class="fact">这是对《清明上河图》市井意象的代码重绘，建筑布局与任务均为游戏创作，并非原画的精确测绘。</p>`,[{text:'合上手记'},{text:'重新启程',secondary:true,run:()=>showDialog('重新开始这一日？','<p>将清除这次游历的铜钱、印记与任务进度。此操作无法撤销。</p>',[{text:'保留进度，继续游历'},{text:'确认重新开始',secondary:true,run:()=>{Object.assign(state,newGame());game.mode='walk';game.boatRun=null;game.player={...START};game.path=[];game.target=null;game.following=true;stamina=100;save();toast('新的一日，从虹桥开始。');}}])}]);
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#app').requestFullscreen();}catch{toast('当前浏览器不支持全屏，仍可正常游玩。');}};
function chime() { if(!soundOn||!audioContext)return;const now=audioContext.currentTime;for(const [i,f] of [523.25,659.25,783.99].entries()){const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(audioContext.destination);g.gain.setValueAtTime(0,now+i*.08);g.gain.linearRampToValueAtTime(.035,now+i*.08+.02);g.gain.exponentialRampToValueAtTime(.001,now+i*.08+.7);o.start(now+i*.08);o.stop(now+i*.08+.8);}}
$('#sound').onclick=async()=>{
  try{
    soundOn=!soundOn;
    if(soundOn){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audioContext??=new Audio();await audioContext.resume();if(!ambient){ambient=audioContext.createGain();ambient.gain.value=.012;ambient.connect(audioContext.destination);for(const f of [130.81,196,261.63]){const o=audioContext.createOscillator();o.type='sine';o.frequency.value=f;o.connect(ambient);o.start();}}else ambient.gain.value=.012;chime();}else if(ambient)ambient.gain.value=0;
    $('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').classList.toggle('active',soundOn);$('#sound').setAttribute('aria-label',soundOn?'关闭环境音':'开启环境音');
  }catch{soundOn=false;toast('这个浏览器暂时不能播放声音，不影响游玩。');}
};
window.addEventListener('keydown',e=>{
  if(dialog.open)return;
  const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(key==='e'&&!e.repeat)interact();else if(key==='p'&&!e.repeat)pause();else if(key==='+'||key==='=')zoom(.1);else if(key==='-')zoom(-.1);
  keys.add(key);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))$('#welcome').hidden=true;
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();stick={x:0,y:0};sprint=false;save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();sprint=false;save();}last=performance.now();});
window.addEventListener('pagehide',save);
canvas.addEventListener('pointerdown',e=>{if(dialog.open||game.paused)return;canvas.setPointerCapture(e.pointerId);dragging={id:e.pointerId,x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false};});
canvas.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==dragging.id)return;if(Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>6)dragging.moved=true;if(dragging.moved){game.following=false;game.camera.x-=(e.clientX-dragging.px)/game.camera.zoom;game.camera.y-=(e.clientY-dragging.py)/game.camera.zoom;}dragging.px=e.clientX;dragging.py=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(!dragging)return;if(!dragging.moved){const r=canvas.getBoundingClientRect();goto(scene.world({x:e.clientX-r.left,y:e.clientY-r.top},game.camera));}dragging=null;});
canvas.addEventListener('pointercancel',()=>dragging=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.06:-.06);},{passive:false});
for(const b of document.querySelectorAll('[data-key]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);b.classList.add('held');$('#welcome').hidden=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{keys.delete(b.dataset.key);b.classList.remove('held');});
}
$('#sprint').addEventListener('pointerdown',e=>{e.preventDefault();$('#sprint').setPointerCapture(e.pointerId);sprint=true;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#sprint').addEventListener(event,()=>sprint=false);
$('#minimap').addEventListener('pointerdown',e=>{const r=e.currentTarget.getBoundingClientRect();goto({x:(e.clientX-r.left)/r.width*6000,y:(e.clientY-r.top)/r.height*1700});});

document.fonts.ready.then(()=>{
  scene=new Scene(canvas);scene.resize();new ResizeObserver(()=>scene.resize()).observe($('#world'));updateHUD();requestAnimationFrame(frame);
});
