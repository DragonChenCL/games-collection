import './style.css';
import { WORLD, BRIDGES, DISTRICTS, districtAt, SAVE_KEY, POIS, SOUVENIRS, COINS, CARGO, DELIVERY, START, newGame, restoreGame, restoreSession, stepAlongRoad, nearestSouvenir, distance, clamp, riverY, roadY, route, bridgeLift, stampCount } from './game.js';
import { Scene } from './scene.js';
import { relativeMotion } from './eye.js';
import { RURAL_ACTIVITIES, PARCELS, handOverParcel, markGuide } from './game.js';
import { startActivity } from './activities.js';
import { Soundscape } from './audio.js';

const $ = s => document.querySelector(s);
let stored=null;try{stored=localStorage.getItem(SAVE_KEY);}catch{}
const state=restoreGame(stored);
const session=restoreSession(stored),touch=matchMedia('(pointer:coarse)').matches;
const game={ state, player:{...(session.boat?.player||state.player)}, camera:{x:state.player.x,y:state.player.y+30,zoom:!stored&&touch?1.05:session.zoom}, mode:session.boat?'boat':'walk',boatRun:session.boat,path:[],target:null,particles:[],facing:1,moving:false,following:true,paused:false,time:0 };
let stamina=100, keys=new Set(), near=null, scene, last=0, lastSave=0, lastHUD=0, toastTimer, soundscape=null, audioContext=null, soundOn=false;
let stick={x:0,y:0}, sprint=false, dragging=null, dirty=false,autoInteract=null,preferredSound=session.sound,blockedAt=-10;
Object.assign(game,{view:session.view||'scroll',yaw:session.yaw??Math.PI,pitch:0,fov:1,opening:true});

document.querySelector('#app').innerHTML=`
  <header class="topbar">
    <a class="brand" href="../../" aria-label="返回游戏合集"><span class="seal">入<br>画</span><span>清明上河图<small>A LIVING HANDSCROLL</small></span></a>
    <div class="era"><span class="live-dot"></span>汴京 · 清明<span class="era-detail">一城烟火，正待君来</span></div>
    <nav class="top-tools"><button id="sound" title="开启环境音" aria-label="开启环境音" aria-pressed="false">♫<span>环境音</span></button><button id="journal" title="游历手记" aria-label="游历手记">▤<span>手记</span></button><button id="help" title="操作指南" aria-label="操作指南">?<span>怎么玩</span></button><button id="fullscreen" title="全屏游玩" aria-label="全屏游玩">全屏</button></nav>
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
        <button class="quest-row" id="rural-quest"><span class="quest-icon">乡</span><span><b>乡野五艺</b><small id="rural-detail">船坞、水磨、古刹、春集与踏青</small></span><span class="quest-arrow">↗</span></button>
      </div>
      <p class="quest-foot">点选只标方向。亲手行走，到身边按 E。</p>
    </aside>
    <div id="guide-hud" class="guide-hud parchment" hidden><span id="guide-text"></span><button id="guide-route">辅助寻路</button><button id="guide-clear" aria-label="清除目标">×</button></div>
    <div class="view-tools parchment"><button id="zoom-in" aria-label="放大画面" title="放大">＋</button><button id="zoom-out" aria-label="缩小画面" title="缩小">−</button><span></span><button id="follow" title="镜头回到我" aria-label="镜头回到我">归位</button><button id="pause" title="暂停 / 继续" aria-label="暂停游戏" aria-pressed="false">Ⅱ</button></div>
    <div class="purse parchment"><i>文</i><strong id="coins">0</strong><span>铜钱</span><div class="energy"><div id="energy-fill"></div></div><small>脚力</small></div>
    <div id="boat-hud" class="boat-hud parchment" hidden><span>汴河拾货 <b id="cargo-count">0 / 5</b></span><strong id="boat-time">90</strong><small>秒 · 避船靠箱</small><button id="next-cargo">货箱指引 →</button><button id="disembark">返回码头</button></div>
    <div id="welcome" class="welcome parchment" ${stored?'hidden':''}><span class="eyebrow">不是观画，是入画。</span><h2>千年烟火，等你入城。</h2><p>走过虹桥，穿行街市，再亲手摇一叶舟。<br>这里的每一片屋瓦、每一个行人，都由代码绘出。</p><button id="begin" class="primary">启程 · 走进汴京 <span>→</span></button><small>WASD 行走 · 点击地面寻路 · E 互动</small></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="pause-screen" class="pause-screen" hidden><span>稍 歇 片 刻</span><button id="resume" class="primary">继续游历</button></div>
    <div class="action-area"><button id="interact" class="interact" disabled><kbd>E</kbd><span>走近人物，与市井相逢</span></button><span class="move-hint">W A S D 行走 <i>·</i> Shift 疾行 <i>·</i> 点击寻路 / 拖动画面</span></div>
    <div class="touch-controls"><div class="dpad" aria-label="触屏方向控制"><button data-key="arrowup" aria-label="向上走">↑</button><button data-key="arrowleft" aria-label="向左走">←</button><span>行</span><button data-key="arrowright" aria-label="向右走">→</button><button data-key="arrowdown" aria-label="向下走">↓</button></div><button id="sprint" aria-label="按住疾行">疾<br>行</button></div>
    <div class="map-wrap parchment"><div class="map-title"><span>汴京舆图</span><small>点图寻路</small></div><canvas id="minimap" width="600" height="114" aria-label="点击舆图前往两岸道路"></canvas><div class="map-labels"><span>城阙</span><span>虹桥</span><span>船坞</span><span>水磨</span><span>古刹</span><span>春集</span></div><button id="atlas-toggle">展开十景 · 选景漫游</button><div id="district-links" hidden>${DISTRICTS.map((d,i)=>`<button data-district="${i}">${d.name}</button>`).join('')}</div></div>
  </main>
  <footer class="statusbar"><span><i class="live-dot"></i>一卷会呼吸的汴京</span><span id="journey">已探索 0 / 8 处风物</span><span id="save-status">进度自动留在此浏览器</span><a href="../../">← 返回闲游合集</a></footer>
  <dialog id="dialog" class="parchment"><button id="close-dialog" class="dialog-close" aria-label="关闭对话">×</button><span class="eyebrow">汴京 · 市井相逢</span><h2 id="dialog-title"></h2><div id="dialog-body"></div><div id="dialog-actions"></div></dialog>
`;

const canvas=$('#scene'),dialog=$('#dialog');
const viewButton=document.createElement('button');viewButton.id='view-mode';viewButton.setAttribute('aria-label','切换第一人称视角');viewButton.setAttribute('aria-pressed','false');viewButton.innerHTML='<span>第一<br>人称</span>';$('.top-tools').append(viewButton);
function toggleView(){game.view=game.view==='eye'?'scroll':'eye';game.following=true;game.path=[];game.target=null;autoInteract=null;game.pitch=0;keys.clear();stick={x:0,y:0};syncView();save();canvas.focus({preventScroll:true});toast(game.view==='eye'?'已入画：拖动画面转头，WASD 或方向盘行走；左右方向键转向。':'已回到长卷俯瞰，同一位置、同一份进度。');}
function syncView(){$('#app').classList.toggle('eye-view',game.view==='eye');viewButton.setAttribute('aria-pressed',String(game.view==='eye'));viewButton.setAttribute('aria-label',game.view==='eye'?'切换长卷俯瞰视角':'切换第一人称视角');viewButton.innerHTML=game.view==='eye'?'<span>长卷<br>俯瞰</span>':'<span>第一<br>人称</span>';}
viewButton.onclick=toggleView;syncView();
function save() {
  if(game.mode==='walk')state.player={...game.player};
  const activeBoat=game.mode==='boat'?{...game.boatRun,player:{...game.player}}:null;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({...state,activeBoat,preferences:{zoom:game.camera.zoom,sound:preferredSound,view:game.view,yaw:game.yaw}}));$('#save-status').textContent='游历进度已保存';}catch{$('#save-status').textContent='浏览器未允许保存，离开后进度会丢失';}
  dirty=false;
}
function toast(text) { $('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200); }
function showDialog(title,body,actions=[{text:'继续游历'}]) {
  soundscape?.update(game.player.x,false,soundOn&&!game.paused&&!document.hidden);
  keys.clear();stick={x:0,y:0};sprint=false;
  if(touch)body=body.replaceAll('按 <kbd>E</kbd>','点右下互动按钮').replaceAll('按 E','点右下互动按钮');
  $('#dialog-title').textContent=title;$('#dialog-body').innerHTML=body;
  $('#dialog-actions').replaceChildren();
  for(const action of actions){const b=document.createElement('button');b.className=action.secondary?'secondary':'primary';b.textContent=action.text;b.onclick=()=>{dialog.close();action.run?.();updateHUD();};$('#dialog-actions').append(b);}
  dialog.showModal();$('#dialog-actions button')?.focus({preventScroll:true});dialog.scrollTop=0;
}
function burst(p) { for(let i=0;i<12;i++)game.particles.push({x:p.x,y:p.y-12,vx:(Math.random()-.5)*75,vy:-30-Math.random()*60,life:1}); }
function goto(p) {
  $('#welcome').hidden=true;game.following=true;autoInteract=null;$('#quests').classList.remove('expanded');$('#quests').classList.add('travelling');
  if(game.mode==='boat'){game.target={x:clamp(p.x,250,WORLD.width-250),y:clamp(p.y,riverY(p.x)-100,riverY(p.x)+100)};return;}
  game.path=route(game.player,p);game.target=game.path.at(-1);dirty=true;
}
function guideTo(p) {
  if(game.mode==='boat'){toast('先点击返回码头，再步行游历。');return;}
  $('#welcome').hidden=true;autoInteract=null;markGuide(game,p);game.following=true;
  $('#quests').classList.remove('expanded','travelling');
  toast(`已标记${p.name}。按方向行走；辅助寻路可选，但不会替你交谈或拾取。`);
}
function goPOI(id) { const p=POIS.find(p=>p.id===id);if(p)guideTo(p); }
function deliver(p) {
  const parcel=PARCELS.find(q=>q.id===p.id);
  showDialog(`${p.name} · 哪一份是本店的？`,`<p>${parcel.clue}</p><p>翻开背篓，亲手选一份递给掌柜。</p>`,PARCELS.map(q=>({text:q.name,secondary:true,run:()=>{
    if(!handOverParcel(state,p.id,q.id)){showDialog('掌柜 · 这份不是我的',`<p>${parcel.clue} 再看看包裹的模样。</p>`,[{text:'重新辨认包裹',run:()=>deliver(p)}]);return;}
    stamina=100;burst(p);chime();save();
    const next=POIS.find(q=>q.id===DELIVERY[state.delivered]);
    showDialog(`${p.name} · 送到了`,`<p>${parcel.reply}</p><p><b>酬谢 12 文</b>，脚力恢复。${next?`下一站是<b>${next.name}</b>，仍沿北岸向西。`:'三份已送达，「信」印收入手记。'}</p>`,[{text:next?'标记下一家 · 我自己走':'收下「信」印',run:()=>next?goPOI(next.id):checkEnding()}]);
  }})));
}
function nearest() {
  const candidates=[...POIS.map(p=>({...p,kind:p.type==='sight'&&!RURAL_ACTIVITIES[p.id]?'place':'person'})),...SOUVENIRS.filter(p=>!state.souvenirs.includes(p.id)).map(p=>({...p,kind:'item'}))];
  return candidates.map(p=>({...p,d:distance(p,game.player)})).filter(p=>p.d<(p.kind==='item'?72:103)).sort((a,b)=>a.d-b.d)[0]||null;
}
function interact() {
  if(dialog.open||game.paused)return;
  if(game.mode==='boat'){stamina=Math.max(0,stamina-12);game.boatRun.boost=1;return;}
  near=nearest();if(!near)return;
  if(game.guide?.id===near.id)game.guide=null;
  game.moving=false;autoInteract=null;
  if(near.kind==='item'){
    state.souvenirs.push(near.id);state.coins+=8;burst(near);toast(`拾得${near.name} · +8 文${state.souvenirs.length===3?' · 「春」印已入手记':''}`);chime();save();updateHUD();checkEnding();return;
  }
  const p=near;
  if(RURAL_ACTIVITIES[p.id]){startActivity(p,{state,showDialog,chime,save,updateHUD});return;}
  if(p.id==='post'){
    if(state.delivered===3){showDialog('驿使 · 多谢这位好脚力', '<p>三家都捎话来了：你的东西送得又快又稳！城里城外，再去转转吧。</p><p class="fact">宋代的街市已相当繁盛，酒楼、茶坊与各色行铺相邻而立。</p>');return;}
    if(!state.courierStarted){
      showDialog('驿使 · 替我跑一趟街市？','<p>这位小哥，正好！请沿街往西，把新茶送去<b>刘家茶坊</b>，绸缎送去<b>锦绣绸庄</b>，最后把食盒送到<b>孙羊正店</b>。</p><p>三份都在你背篓里。每送到一家，走到掌柜身边按 <kbd>E</kbd>。送齐三家，酬你一枚「信」印。</p>',[{text:'接下委托 · 装好背篓',run:()=>{state.courierStarted=true;save();toast('沿北岸向西走：第一站，刘家茶坊。点击左侧任务可寻路。');}},{text:'我先四处走走',secondary:true}]);
    }else{goPOI(DELIVERY[state.delivered]);}
    return;
  }
  if(p.id==='dock'){
    showDialog('船头 · 这回，换你掌舵',`<p>东边的货箱落了水。借你一叶小舟，<b>90 秒内拾起 5 个木箱</b>，便能换来「舟」印。</p><p>${touch?'左下方向盘划船，也可点水面驶向目标；按住「疾行」加速。':'WASD / 方向键划船，也可点击水面；Shift 加速。'} 靠近货箱自动拾取，碰船扣 3 秒。上方「货箱指引」会指引你前行。</p><p class="fact">虹桥无桥墩，大船需放倒桅杆才能穿过木拱。货箱在码头东边，船游结束后也可继续沿长卷漫步。</p>`,[{text:'登舟 · 我来试试',run:startBoat},{text:'暂不上船',secondary:true}]);return;
  }
  if(state.courierStarted&&DELIVERY[state.delivered]===p.id){
    deliver(p);return;
  }
  if(p.type==='shop'){
    if(state.courierStarted&&state.delivered<3){const next=POIS.find(q=>q.id===DELIVERY[state.delivered]);showDialog(`${p.name} · 掌柜提醒`,`<p>背篓里的货物还没轮到本店。请先送去<b>${next.name}</b>，再回来交给我。</p>`,[{text:`先去${next.name}`,run:()=>goPOI(next.id)},{text:'继续逛逛',secondary:true}]);return;}
    const goods=p.id==='tea'?{name:'清茶',cost:5,words:'煮水点茶，听一段街头说书。'}:p.id==='silk'?{name:'绣帕',cost:18,words:'柜前绫罗垂挂，掌柜替你挑了一方细绣手帕。'}:{name:'春日食盒',cost:12,words:'热饼、春蔬与蜜饯，装好一盒路上慢慢吃。'};
    showDialog(`${p.name} · 客官里边请`,`<p>${goods.words}</p><p><b>${goods.name} ${goods.cost} 文</b>，歇歇脚，脚力立即回满。</p>`,[{text:state.coins>=goods.cost?`花 ${goods.cost} 文，买${goods.name}`:'铜钱不足，改日再来',run:()=>{if(state.coins>=goods.cost){state.coins-=goods.cost;stamina=100;save();toast(`${goods.name}已收好，脚力恢复。`);}}},{text:'继续逛逛',secondary:true}]);return;
  }
  const words={gate:'城门下商旅往来，驴车驮货而入。长卷把城郊与市井相连，让寻常百姓的日子成为主角。',fields:'城外，春田水满，驴队踏青。再往东，还有船坞、水磨与村社春集。',temple:'走过虹桥，南岸忽然安静下来。你可以从这里沿河寻找遗落的燕子纸鸢。',shipyard:'木料堆岸，匠人凿木。船身还未铺板，肋骨已经一根根立起。河边的吊架正等下一根大梁。',mill:'河湾的水轮不停转动，带动屋里的磨石。田垄间的牛缓缓走过，岸上新麦渐青。',grove:'竹影掩着古刹，石塔层层。出了山门，沿南岸可到春集；过东边的桥也能回北岸。',fair:'鼓点一响，台上百戏开场。挑担小贩沿街叫卖，孩子追着风筝跑过。',outing:'长卷远端，茅舍、柳枝与驴队慢下来。点开舆图的十景菜单，可以选择下一段漫游。'};
  showDialog(p.name,`<p>${words[p.id]||'且听人声，且看流水。'}</p><p class="fact">本作是依据原画意象创作的互动小城，不是逐像素或建筑考古复原。</p>`);
}
function startBoat() {
  game.mode='boat';game.guide=null;game.yaw=0;game.path=[];autoInteract=null;game.target=null;game.player={x:3650,y:riverY(3650)-65};game.boatRun={remaining:90,collected:[],cooldown:6,boost:0};game.following=true;stamina=100;game.facing=1;toast('向东出发，靠近木箱拾货。可看货箱箭头方向，亲手掌舵。');save();updateHUD();
}
function finishBoat(won=false,timedOut=false) {
  if(game.mode!=='boat')return;
  const count=game.boatRun.collected.length;
  const first=!state.boatWon;
  if(won){state.boatWon=true;state.coins+=first?35:8;chime();}
  game.mode='walk';const dock=POIS.find(p=>p.id==='dock');game.player={x:dock.x,y:dock.y};game.path=[];game.target=null;game.boatRun=null;game.following=true;save();updateHUD();
  if(timedOut)showDialog('时间到了 · 货物还在河上',`<p>这回打捞了 <b>${count} / 5 箱</b>，还差 ${5-count} 箱。已平安回到码头，不扣铜钱。</p><p>下一回试试「货箱指引」，也可按住疾行加速；避开漕船能省下时间。</p>`,[{text:'再借一次船 · 重新挑战',run:startBoat},{text:'先在岸上歇歇',secondary:true}]);
  else toast(won?`五箱货物平安打捞！+${first?35:8} 文${first?' · 获得「舟」印':''}`:'已回到码头。随时可以再借船一试。');checkEnding();
}
function checkEnding() {
  if(stampCount(state)===3){setTimeout(()=>{if(!dialog.open)showDialog('一日汴京 · 三印已集齐','<p>街市的一封信，河上的一叶舟，春日里的一次偶遇。你已经不只是看画的人，也是画中的过客。</p><div class="earned-stamps"><span class="earned">信</span><span class="earned">舟</span><span class="earned">春</span></div><p>向东还有船坞、水磨、古刹与春集。铜钱可买食盒、绣帕，或在十景舆图里雇车远游。</p>');},650);}
}
function updateHUD() {
  $('#coins').textContent=state.coins;$('#stamp-count').textContent=`${stampCount(state)} / 3`;
  $('#courier-detail').textContent=state.delivered===3?'三份送达 · 「信」印已得':state.courierStarted?`已送 ${state.delivered} / 3 · 前往${POIS.find(p=>p.id===DELIVERY[state.delivered]).name}`:'与虹桥旁的驿使交谈';
  $('#boat-detail').textContent=state.boatWon?'五箱归仓 · 「舟」印已得':'去码头，亲手摇橹拾货';
  $('#souvenir-detail').textContent=state.souvenirs.length===3?'三物收齐 · 「春」印已得':`已拾 ${state.souvenirs.length} / 3 · 两岸都有春日小物`;
  $('#courier-quest').classList.toggle('complete',state.delivered===3);$('#boat-quest').classList.toggle('complete',state.boatWon);$('#souvenir-quest').classList.toggle('complete',state.souvenirs.length===3);
  $('#rural-detail').textContent=`已体验 ${state.rural.length} / 5 · 完成每项得十五文`;
  $('#rural-quest').classList.toggle('complete',state.rural.length===5);
  $('#guide-hud').hidden=!game.guide||game.mode==='boat';
  if(game.guide)$('#guide-text').textContent=`${game.guide.name} · ${Math.ceil(distance(game.player,game.guide)/20)} 步`;
  $('#journey').textContent=`已探索 ${state.visited.length} / ${POIS.length} 处风物`;
  near=game.mode==='walk'?nearest():null;
  $('#interact').disabled=!near&&game.mode!=='boat';
  $('#interact span').textContent=game.mode==='boat'?'用力划桨':near?near.kind==='item'?`拾起${near.name}`:near.id==='dock'?'登舟 · 汴河拾货':near.kind==='place'?`游赏${near.name}`:`与${RURAL_ACTIVITIES[near.id]?.npc||near.name}交谈`:'走近人物，与市井相逢';
  $('#boat-hud').hidden=game.mode!=='boat';
  $('#app').classList.toggle('boating',game.mode==='boat');
  $('.move-hint').textContent=game.mode==='boat'?'WASD 划船 · Shift 加速 · 点击水面掌舵':'WASD 行走 · Shift 疾行 · 点击寻路 / 拖动画面';
  if(game.mode==='boat'){$('#cargo-count').textContent=`${game.boatRun.collected.length} / 5` ;$('#boat-time').textContent=Math.ceil(game.boatRun.remaining);}
  const district=districtAt(game.camera.x);
  $('#district').textContent=district.name;$('#district-note').textContent=district.note;
  $('#follow').classList.toggle('active',game.following);$('#energy-fill').style.width=`${stamina}%`;
  drawMap();
}
function drawMap() {
  const m=$('#minimap'),c=m.getContext('2d'),sx=m.width/WORLD.width,sy=m.height/WORLD.height;c.clearRect(0,0,m.width,m.height);
  c.lineCap='round';c.beginPath();for(let x=0;x<=WORLD.width;x+=50)x?c.lineTo(x*sx,riverY(x)*sy):c.moveTo(0,riverY(0)*sy);c.strokeStyle='#9c9f7988';c.lineWidth=19;c.stroke();
  for(const b of [0,1]){c.beginPath();for(let x=200;x<=WORLD.width-200;x+=100)x>200?c.lineTo(x*sx,roadY(x,b)*sy):c.moveTo(x*sx,roadY(x,b)*sy);c.lineWidth=1;c.strokeStyle='#a4936a88';c.stroke();}
  for(const span of BRIDGES){c.beginPath();c.moveTo(span.a.x*sx,span.a.y*sy);c.lineTo(span.b.x*sx,span.b.y*sy);c.lineWidth=3;c.strokeStyle='#9e8052';c.stroke();}
  if(game.mode==='boat')for(const cargo of CARGO)if(!game.boatRun.collected.includes(cargo.id)){c.fillStyle='#8d553d';c.fillRect(cargo.x*sx-3,cargo.y*sy-3,6,6);}
  for(const p of POIS){c.fillStyle=p.color;c.fillRect(p.x*sx-2,p.y*sy-2,4,4);}
  for(const p of SOUVENIRS)if(!state.souvenirs.includes(p.id)){c.strokeStyle='#9f5842';c.strokeRect(p.x*sx-3,p.y*sy-3,6,6);}
  c.strokeStyle='#756f5144';c.lineWidth=1;c.strokeRect((game.camera.x-scene.width/2/game.camera.zoom)*sx,(game.camera.y-scene.height/2/game.camera.zoom)*sy,scene.width/game.camera.zoom*sx,scene.height/game.camera.zoom*sy);
  c.beginPath();c.arc(game.player.x*sx,game.player.y*sy,4,0,Math.PI*2);c.fillStyle='#9c4734';c.fill();c.strokeStyle='#f7edd3';c.lineWidth=1.5;c.stroke();
}
function walk(dx,dy,dt,speed) {
  const len=Math.hypot(dx,dy);if(!len)return;
  const next=stepAlongRoad(game.player,dx,dy,speed*dt);game.moving=distance(next,game.player)>.01;game.player=next;
  if(!game.moving&&game.time-blockedAt>3){blockedAt=game.time;toast('这里不通，沿浅色道路走，或点击目的地自动寻路。');}
  if(dx)game.facing=Math.sign(dx);
}
function tick(dt,elapsed=dt) {
  game.time+=elapsed;scene.update(dt,game.time);game.moving=false;
  let dx=Number(keys.has('d')||(game.view!=='eye'&&keys.has('arrowright')))-Number(keys.has('a')||(game.view!=='eye'&&keys.has('arrowleft')))+stick.x;
  let dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))+stick.y;
  if(game.view==='eye'){
    game.yaw+=(Number(keys.has('arrowright'))-Number(keys.has('arrowleft')))*dt*1.7;
    if(game.path.length&&!dx&&!dy){const next=game.path[0],angle=Math.atan2(next.y-game.player.y,next.x-game.player.x);game.yaw+=Math.atan2(Math.sin(angle-game.yaw),Math.cos(angle-game.yaw))*Math.min(1,dt*4);}
    ({x:dx,y:dy}=relativeMotion(dx,dy,game.yaw));
  }
  const running=(keys.has('shift')||keys.has(' ')||sprint||game.boatRun?.boost>0)&&stamina>1;
  let speed=game.mode==='boat'?170:205;if(running)speed*=1.65;
  const input=Math.hypot(dx,dy)>0;
  if(game.mode==='walk'){
    if(input){game.path=[];game.target=null;autoInteract=null;game.following=true;walk(dx,dy,dt,speed);dirty=true;}
    else if(game.path.length){
      let budget=speed*dt;
      while(game.path.length&&budget>0){const p=game.path[0],d=distance(p,game.player);if(d<=budget){game.player={...p};budget-=d;game.path.shift();}else{game.facing=Math.sign(p.x-game.player.x)||game.facing;game.player.x+=(p.x-game.player.x)/d*budget;game.player.y+=(p.y-game.player.y)/d*budget;budget=0;}game.moving=true;}
      if(!game.path.length){game.target=null;autoInteract=null;$('#quests').classList.remove('travelling');$('#quests').classList.add('expanded');toast('已经走到标记附近，按 E 或点互动按钮，亲手交谈或拾取。');}dirty=true;
    }
    for(const coin of COINS)if(!state.pickedCoins.includes(coin.id)&&distance(coin,game.player)<24){state.pickedCoins.push(coin.id);state.coins++;burst(coin);dirty=true;}
    for(const p of POIS)if(!state.visited.includes(p.id)&&distance(p,game.player)<130){state.visited.push(p.id);dirty=true;}
  }else{
    const run=game.boatRun;run.remaining-=elapsed;run.cooldown=Math.max(0,run.cooldown-elapsed);run.boost=Math.max(0,run.boost-elapsed);
    let vx=dx,vy=dy;
    if(input)game.target=null;
    else if(game.target){const d=distance(game.target,game.player);if(d<12)game.target=null;else{vx=(game.target.x-game.player.x)/d;vy=(game.target.y-game.player.y)/d;}}
    const len=Math.hypot(vx,vy);if(len){game.player.x=clamp(game.player.x+vx/len*speed*dt,250,WORLD.width-250);game.player.y+=vy/len*speed*dt;game.moving=true;game.facing=Math.sign(vx)||game.facing;}
    game.player.y=clamp(game.player.y,riverY(game.player.x)-110,riverY(game.player.x)+110);
    for(const ship of scene.ships)if(run.cooldown===0&&!CARGO.some(q=>distance(q,game.player)<85)&&Math.abs(ship.x-game.player.x)<(ship.large?75:48)&&Math.abs(ship.y-game.player.y)<24){run.remaining-=3;run.cooldown=3;game.player.y=clamp(game.player.y+(game.player.y>ship.y?32:-32),riverY(game.player.x)-110,riverY(game.player.x)+110);toast('小心漕船！绕开它，损失了 3 秒。');}
    for(const cargo of CARGO)if(!run.collected.includes(cargo.id)&&distance(game.player,cargo)<42){run.collected.push(cargo.id);burst(cargo);chime();toast(`已拾起 ${run.collected.length} / 5 箱货物`);}
    dirty=true;if(run.collected.length===5)finishBoat(true);else if(run.remaining<=0)finishBoat(false,true);
  }
  stamina=clamp(stamina+(running&&game.moving?-20:12)*dt,0,100);
  if(game.following){const lift=game.mode==='walk'?bridgeLift(game.player):0;const f=1-Math.exp(-dt*5);game.camera.x+=(game.player.x-game.camera.x)*f;game.camera.y+=(game.player.y-lift+30-game.camera.y)*f;}
  game.camera.zoom=Math.max(game.camera.zoom,scene.height/WORLD.height);
  const halfX=scene.width/2/game.camera.zoom,halfY=Math.min(WORLD.height/2,scene.height/2/game.camera.zoom);
  game.camera.x=clamp(game.camera.x,halfX,WORLD.width-halfX);game.camera.y=clamp(game.camera.y,halfY,WORLD.height-halfY);
  for(const p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=85*dt;p.life-=dt;}game.particles=game.particles.filter(p=>p.life>0);
}
function frame(now) {
  const elapsed=last?Math.max(0,(now-last)/1000):0,dt=Math.min(elapsed,.1);last=now;
  soundscape?.update(game.player.x,!game.paused&&!dialog.open&&!document.hidden&&!game.opening,soundOn&&!game.paused&&!document.hidden);
  if(!game.paused&&!dialog.open&&!document.hidden&&!game.opening)tick(dt,elapsed);
  scene.draw(game);
  if(now-lastHUD>120){updateHUD();lastHUD=now;}
  if(now-lastSave>2500&&dirty){save();lastSave=now;}
  requestAnimationFrame(frame);
}

$('#begin').onclick=()=>{$('#welcome').hidden=true;canvas.focus({preventScroll:true});toast(touch?'你穿红衣、背竹篓。点驿使走近交谈，或用左下方向盘行走。':'你穿红衣、背竹篓。点击驿使走近交谈，或按 E 互动。');};
$('#close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#interact').onclick=interact;$('#disembark').onclick=()=>finishBoat();
$('#next-cargo').onclick=()=>{toast('箭头只指方向，不会代你划船；用方向盘、WASD 或点击水面掌舵。');};
$('#courier-quest').onclick=()=>goPOI(state.courierStarted&&state.delivered<3?DELIVERY[state.delivered]:'post');
$('#boat-quest').onclick=()=>goPOI('dock');
$('#souvenir-quest').onclick=()=>{const p=nearestSouvenir(game.player,state.souvenirs);if(!p){toast('三件春日小物已收入行囊。');return;}guideTo(p);};
$('#rural-quest').onclick=()=>{const p=POIS.filter(p=>RURAL_ACTIVITIES[p.id]&&!state.rural.includes(p.id)).sort((a,b)=>distance(a,game.player)-distance(b,game.player))[0];if(p)guideTo(p);else toast('乡野五艺都已记入手记，仍可找老朋友重玩。');};
$('#guide-route').onclick=()=>{if(game.guide){goto(game.guide);toast('辅助行走已开启。到达后仍需按 E 亲手交谈或拾取。');}};
$('#guide-clear').onclick=()=>{game.guide=null;game.path=[];game.target=null;autoInteract=null;};
$('#quest-toggle').onclick=()=>{$('#district-links').hidden=true;$('#app').classList.remove('atlas-open');$('#quests').classList.remove('travelling');$('#quests').classList.toggle('expanded');};
function zoom(delta) { if(game.view==='eye')game.fov=clamp(game.fov+delta,.65,1.5);else game.camera.zoom=clamp(game.camera.zoom+delta,.46,2.2);dirty=true; }
$('#zoom-in').onclick=()=>zoom(.12);$('#zoom-out').onclick=()=>zoom(-.12);$('#follow').onclick=()=>{game.following=true;};
function pause() { game.paused=!game.paused;if(game.paused)soundscape?.update(game.player.x,false,false);$('#pause-screen').hidden=!game.paused;$('#pause').setAttribute('aria-pressed',String(game.paused));$('#pause').setAttribute('aria-label',game.paused?'继续游戏':'暂停游戏');keys.clear(); }
$('#pause').onclick=pause;$('#resume').onclick=pause;
$('#help').onclick=()=>showDialog('初到汴京，怎样游历？',`<div class="controls-guide"><p>${touch?'左下方向盘可斜向行走，松手停止；按住「疾行」加速。':'<kbd>WASD</kbd> / 方向键沿街行走；<kbd>Shift</kbd> 疾行。'}</p>
<p><b>任务只指方向</b>：点任务或远处人物，不会代你行走、交货或拾取。走近后按 E 或点互动按钮；送货时看线索，选对包裹。</p>
<p><b>辅助寻路可选</b>：点标记旁「辅助寻路」、地面或舆图，才会沿道路行走；到达仍需亲手互动。</p>
<p><b>拖动画面</b>看风景，「归位」回到自己；滚轮、双指或 + / − 缩放。第一人称拖动转头。</p>
<p><b>远郊五艺</b>：点「乡野五艺」标记下一项。船坞落锤、水磨转轮、古刹记钟、春集藏豆与远郊放鸢都能亲手玩，每项初次十五文。</p>
<p><b>展开十景</b>：可标方向自己走，也可雇车。首程车票免费，此后十二文一程。</p>
<p><b>乘船</b>：90 秒捞起 5 箱，碰船扣 3 秒。箭头只指方向，用方向盘、WASD 或点水面亲手掌舵；超时可重试。</p></div>
<p class="fact">进度自动保存在当前浏览器。声音在触摸后恢复；暂停、后台静音，对话时背景音静音，操作钟音仍可听见。</p>`);
$('#journal').onclick=()=>showDialog('行囊 · 一日汴京',`<div class="earned-stamps"><span class="${state.delivered===3?'earned':''}">信</span><span class="${state.boatWon?'earned':''}">舟</span><span class="${state.souvenirs.length===3?'earned':''}">春</span></div><p>街市跑腿：${state.delivered} / 3 份送达<br>汴河拾货：${state.boatWon?'已完成':'待乘舟'}<br>春日拾趣：${state.souvenirs.length} / 3 件小物<br>乡野游艺：${state.rural.length} / 5 项（${state.rural.map(id=>RURAL_ACTIVITIES[id].title).join('、')||'尚未体验'}）<br>探索风物：${state.visited.length} / ${POIS.length} 处<br>行囊铜钱：${state.coins} 文</p><p class="fact">这是对《清明上河图》市井意象的代码重绘，建筑布局与任务均为游戏创作，并非原画的精确测绘。</p>`,[{text:'合上手记'},{text:'重新启程',secondary:true,run:()=>showDialog('重新开始这一日？','<p>将清除这次游历的铜钱、印记与任务进度。此操作无法撤销。</p>',[{text:'保留进度，继续游历'},{text:'确认重新开始',secondary:true,run:()=>{Object.assign(state,newGame());game.mode='walk';game.boatRun=null;game.player={...START};game.path=[];game.target=null;autoInteract=null;game.following=true;stamina=100;save();toast('新的一日，从虹桥开始。');}}])}]);
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#app').requestFullscreen();}catch{toast('当前浏览器不支持全屏，仍可正常游玩。');}};
function chime(degree) { if(soundOn&&!game.paused&&!document.hidden)soundscape?.cue(degree); }
$('#sound').onclick=async()=>{
  try{
    soundOn=!soundOn;
    if(soundOn){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audioContext??=new Audio();await audioContext.resume();soundscape??=new Soundscape(audioContext);soundscape.update(game.player.x,!dialog.open&&!game.opening,true);chime();}else soundscape?.update(game.player.x,false,false);
    preferredSound=soundOn;save();$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').classList.toggle('active',soundOn);$('#sound').setAttribute('aria-label',soundOn?'关闭环境音':'开启环境音');
  }catch{soundOn=false;toast('这个浏览器暂时不能播放声音，不影响游玩。');}
};
window.addEventListener('keydown',e=>{
  if(dialog.open||game.opening)return;
  const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(key==='e'&&!e.repeat)interact();else if(key==='p'&&!e.repeat)pause();else if(key==='+'||key==='=')zoom(.1);else if(key==='-')zoom(-.1);
  keys.add(key);if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))$('#welcome').hidden=true;
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();stick={x:0,y:0};sprint=false;save();});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){keys.clear();stick={x:0,y:0};sprint=false;soundscape?.update(game.player.x,false,false);save();}last=performance.now();});
window.addEventListener('pagehide',save);
const pointers=new Map();let pinch=null;
canvas.addEventListener('pointerdown',e=>{
  if(dialog.open||game.paused)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={length:distance(a,b),zoom:game.view==='eye'?game.fov:game.camera.zoom};dragging=null;}
  else if(pointers.size===1)dragging={id:e.pointerId,x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false};
});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];if(game.view==='eye')game.fov=clamp(pinch.zoom*distance(a,b)/Math.max(1,pinch.length),.65,1.5);else game.camera.zoom=clamp(pinch.zoom*distance(a,b)/Math.max(1,pinch.length),.46,2.2);dirty=true;return;}
  if(!dragging||e.pointerId!==dragging.id)return;if(Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>6)dragging.moved=true;
  if(dragging.moved){if(game.view==='eye'){game.yaw+=(e.clientX-dragging.px)*.005;game.pitch=clamp(game.pitch+(e.clientY-dragging.py)*.001,-.35,.35);}else{game.following=false;game.camera.x-=(e.clientX-dragging.px)/game.camera.zoom;game.camera.y-=(e.clientY-dragging.py)/game.camera.zoom;}}dragging.px=e.clientX;dragging.py=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
  pointers.delete(e.pointerId);if(pinch){if(!pointers.size)pinch=null;dragging=null;return;}
  if(!dragging)return;
  if(!dragging.moved){
    const r=canvas.getBoundingClientRect(),screenPoint={x:e.clientX-r.left,y:e.clientY-r.top};
    if(game.view==='eye'){const person=scene.eye.hit(screenPoint);if(person&&game.mode==='walk'){if(distance(person,game.player)<103)interact();else goPOI(person.id);}else if(screenPoint.y>scene.eye.horizon)goto(scene.eye.unproject(screenPoint,game));dragging=null;return;}
    const point=scene.world(screenPoint,game.camera);
    const npc=POIS.find(p=>distance({x:p.x,y:p.y-bridgeLift(p)-25},point)<36/game.camera.zoom);
    if(npc&&game.mode==='walk'){if(distance(npc,game.player)<103)interact();else guideTo(npc);}else goto(point);
  }
  dragging=null;
});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pinch=null;dragging=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.06:-.06);},{passive:false});
const pad=$('.dpad');let padPointer=null;
function movePad(e){const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2),len=Math.hypot(dx,dy);stick=len<.15?{x:0,y:0}:{x:dx/Math.max(1,len),y:dy/Math.max(1,len)};for(const b of pad.querySelectorAll('button'))b.classList.toggle('held',b.dataset.key==='arrowleft'?stick.x<-.25:b.dataset.key==='arrowright'?stick.x>.25:b.dataset.key==='arrowup'?stick.y<-.25:stick.y>.25);}
pad.addEventListener('pointerdown',e=>{e.preventDefault();padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);movePad(e);$('#welcome').hidden=true;});
pad.addEventListener('pointermove',e=>{if(e.pointerId===padPointer)movePad(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,()=>{padPointer=null;stick={x:0,y:0};pad.querySelectorAll('button').forEach(b=>b.classList.remove('held'));});
$('#sprint').addEventListener('pointerdown',e=>{e.preventDefault();$('#sprint').setPointerCapture(e.pointerId);sprint=true;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#sprint').addEventListener(event,()=>sprint=false);
$('#minimap').addEventListener('pointerdown',e=>{const r=e.currentTarget.getBoundingClientRect();goto({x:(e.clientX-r.left)/r.width*WORLD.width,y:(e.clientY-r.top)/r.height*WORLD.height});});
function setAtlas(open){$('#district-links').hidden=!open;$('#app').classList.toggle('atlas-open',open);$('#atlas-toggle').setAttribute('aria-expanded',String(open));$('#atlas-toggle').textContent=open?'收起十景 · 返回长卷':'展开十景 · 选景漫游';$('#quests').classList.remove('expanded');}
$('#atlas-toggle').setAttribute('aria-expanded','false');$('#atlas-toggle').setAttribute('aria-controls','district-links');
$('#atlas-toggle').onclick=()=>setAtlas($('#district-links').hidden);
for(const b of document.querySelectorAll('[data-district]'))b.onclick=()=>{
  if(game.mode==='boat'){toast('请先回码头，再游历城郊。');return;}
  const district=DISTRICTS[Number(b.dataset.district)],p={x:district.x,y:roadY(district.x,district.bank||0)};
  setAtlas(false);
  showDialog(`远游 · ${district.name}`,`<p>${district.note}</p><p>沿街步行可自由看风景；雇车能直接到达这一景，${state.travelPass?'<b>首程车票免费</b>，之后每程十二文。':'每程 <b>12 文</b>。'}船坞、水磨、古刹、春集和远郊都有可亲手体验的游艺。</p>`,[{text:'标记方向 · 自己走',run:()=>guideTo({...p,name:district.name})},{text:state.travelPass?'使用首程车票 · 免费':state.coins>=12?'雇车前往 · 12 文':'雇车需 12 文',secondary:true,run:()=>{if(!state.travelPass&&state.coins<12){toast('铜钱不足，沿街步行不花钱。');return;}if(state.travelPass)state.travelPass=false;else state.coins-=12;game.player={...p};game.guide=null;game.path=[];game.target=null;autoInteract=null;game.following=true;game.camera.x=p.x;game.camera.y=p.y+30;save();toast(`车马已到${district.name}。`);}}]);
};
if(touch){$('#welcome>small').textContent='方向盘行走 · 点人物交谈 · 双指缩放';$('.quest-foot').textContent='上下滑动看目标 · 只指路，不代走或拾取';}
if(session.boat)toast('已恢复上次的拾货挑战，剩余时间与货箱已保留。');
document.addEventListener('pointerdown',e=>{if(preferredSound&&!soundOn&&e.target.closest('#sound')===null)$('#sound').click();},{once:true});

scene=new Scene(canvas);scene.resize();new ResizeObserver(()=>scene.resize()).observe($('#world'));updateHUD();requestAnimationFrame(frame);
const intro=document.createElement('dialog');intro.id='scroll-intro';intro.setAttribute('aria-label','清明上河图展卷入场');intro.innerHTML='<button class="intro-skip" type="button">跳过展卷</button><div class="scroll-sheet"><div class="scroll-painting"><canvas width="1600" height="700" aria-hidden="true"></canvas><div class="scroll-title"><small>一卷千年 · 此刻入画</small><h2>清明上河图</h2><p>把脚步交给汴京，把春日收入长卷。</p></div></div></div><button class="intro-enter primary" type="button">展开入画 · 走进汴京</button>';document.body.append(intro);
function enterWorld(){if(intro.open)intro.close();game.opening=false;$('#begin').click();last=performance.now();}
intro.querySelectorAll('button').forEach(b=>b.onclick=enterWorld);intro.addEventListener('cancel',e=>{e.preventDefault();enterWorld();});
requestAnimationFrame(()=>{intro.querySelector('canvas').getContext('2d').drawImage(canvas,0,0,1600,700);intro.showModal();intro.querySelector('.intro-enter').focus({preventScroll:true});});
document.fonts.ready.then(()=>scene.tiles.clear());
