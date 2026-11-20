import {RURAL_ACTIVITIES,clamp} from './game.js';
let generation=0;
export function startActivity(p,{state,showDialog,chime,save,updateHUD}){
  const activity=RURAL_ACTIVITIES[p.id],token=++generation,$=s=>document.querySelector(s);
  const track='<div class="activity-track"><span class="activity-zone">命中区</span><i id="activity-marker"></i></div>';
  const wheel='<button id="activity-wheel" aria-label="推动水轮一格"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="5"/><path d="M50 7V93M7 50H93M20 20L80 80M20 80L80 20" stroke="currentColor" stroke-width="4"/></svg></button>';
  const body=activity.kind==='wheel'?wheel:activity.kind==='bells'?'<p id="activity-sequence">宫 → 角 → 商 → 宫</p><div class="activity-buttons">'+['宫','商','角'].map((s,i)=>`<button class="secondary" data-bell="${i}">${s}</button>`).join('')+'</div><button id="activity-remind" class="secondary">再听一遍</button>':activity.kind==='cups'?'<div class="activity-cups">'+[0,1,2].map((n)=>`<button data-cup="${n}" aria-label="选择茶碗" disabled>盏${n===0?'<i id="activity-bean"></i>':''}</button>`).join('')+'</div><button id="activity-again" class="secondary" hidden>再看一回</button>':track+(activity.kind==='kite'?'<div class="activity-buttons"><button id="kite-left" class="secondary">← 收线</button><button id="kite-right" class="secondary">放线 →</button></div>':'<button id="activity-hit" class="primary">落锤</button>');
  showDialog(`${activity.npc} · ${activity.title}`,`<p>${activity.words}</p><div id="activity-root" tabindex="0">${body}<progress id="activity-progress" value="0" max="1" aria-label="活动完成进度"></progress><p id="activity-result" aria-live="polite">${state.rural.includes(p.id)?'已经完成过，重玩可得三文。':'完成后记入手记，酬谢十五文。'}</p></div>`,[{text:'暂别，继续游历',secondary:true}]);
  const active=()=>token===generation&&$('#dialog').open&&$('#activity-root');
  const result=text=>{if(active())$('#activity-result').textContent=text;};
  const progress=n=>{if(active())$('#activity-progress').value=n;};
  const complete=()=>{
    if(!active())return;generation++;const first=!state.rural.includes(p.id);if(first)state.rural.push(p.id);state.coins+=first?15:3;chime();save();updateHUD();
    showDialog(`${activity.title} · 成了！`,`<p>${activity.npc}向你道谢，递来<b>${first?15:3} 文</b>。${first?'这一段乡野相逢已记入手记。':'老朋友，再来玩！'}</p><p>乡野游艺：<b>${state.rural.length} / 5</b>。船坞、水磨、古刹、春集和远郊，各有一段小事等你亲手来做。</p>`);
  };
  let previous=performance.now(),elapsed=0,position=50,success=0,held=0,turn=0,stage=0,armed=true,resultGuard=()=>{};
  if(activity.kind==='timing')$('#activity-hit').onclick=()=>{if(!armed)return;armed=false;if(position>=42&&position<=62){success++;progress(success/3);chime();result(`好锤法！${success} / 3，等下一次指针经过。`);if(success===3)complete();}else{success=0;progress(0);result('这一锤偏了。等指针进入命中区，再落锤。');}};
  if(activity.kind==='wheel'){
    const button=$('#activity-wheel');let angle=null,dragged=false;
    const rotate=n=>{turn=Math.max(0,turn+n);button.querySelector('svg').style.transform=`rotate(${turn}rad)`;progress(turn/(Math.PI*4));if(turn>=Math.PI*4)complete();};
    const at=e=>{const r=button.getBoundingClientRect();return Math.atan2(e.clientY-r.y-r.height/2,e.clientX-r.x-r.width/2);};
    button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);angle=at(e);dragged=false;};
    button.onpointermove=e=>{if(angle===null)return;const next=at(e),delta=Math.atan2(Math.sin(next-angle),Math.cos(next-angle));if(Math.abs(delta)>.02)dragged=true;rotate(delta);angle=next;};
    button.onpointerup=button.onpointercancel=()=>{angle=null;};button.onclick=()=>{if(!dragged)rotate(Math.PI/3+.0001);};
  }
  if(activity.kind==='bells'){
    const pattern=Array.from({length:4},()=>Math.floor(Math.random()*3)),words=pattern.map(i=>['宫','商','角'][i]).join(' → ');let shownUntil=2.5,replayStarted=0,heard=0;
    $('#activity-sequence').textContent=words;
    document.querySelectorAll('[data-bell]').forEach(b=>b.onclick=()=>{if(elapsed<shownUntil){result('先记住四声，再按顺序点回。');return;}chime(+b.dataset.bell);if(+b.dataset.bell===pattern[success]){success++;progress(success/4);result(`第 ${success} 声对了。`);if(success===4)complete();}else{success=0;progress(0);result('这一声不对，重新从第一声试试；也可以再听一遍。');}});
    $('#activity-remind').onclick=()=>{replayStarted=elapsed;heard=0;shownUntil=elapsed+2.5;success=0;progress(0);$('#activity-sequence').textContent=words;};
    resultGuard=()=>{if(heard<4&&elapsed>=replayStarted+heard*.55){chime(pattern[heard]);heard++;}if(elapsed>=shownUntil)$('#activity-sequence').textContent='请按刚才的顺序点钟';};
  }
  if(activity.kind==='cups'){
    const positions=[0,1,2],buttons=[...document.querySelectorAll('[data-cup]')];let guessed=false;
    resultGuard=()=>{
      if(elapsed>1.2&&$('#activity-bean'))$('#activity-bean').hidden=true;
      if(elapsed>1.5+stage*.75&&stage<5){const a=stage%3,b=(a+1+Math.floor(Math.random()*2))%3;[positions[a],positions[b]]=[positions[b],positions[a]];stage++;buttons.forEach((b,i)=>b.style.transform=`translateX(${positions[i]*100}%)`);}
      if(elapsed>5.5&&!guessed)buttons.forEach(b=>b.disabled=false);
    };
    buttons.forEach((b,i)=>{b.style.transform=`translateX(${i*100}%)`;b.onclick=()=>{if(b.disabled||guessed)return;guessed=true;buttons.forEach(b=>b.disabled=true);if(i===0)complete();else{result('红豆溜走了，再看清一次换位吧。');$('#activity-again').hidden=false;}};});
    $('#activity-again').onclick=()=>startActivity(p,{state,showDialog,chime,save,updateHUD});
  }
  if(activity.kind==='kite'){
    document.querySelector('.activity-zone').textContent='安全区';document.querySelector('.activity-zone').style.cssText='left:35%;width:30%';
    for(const [id,direction] of [['#kite-left',-1],['#kite-right',1]]){const b=$(id);b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);held=direction;};b.onpointerup=b.onpointercancel=()=>{held=0;};b.onclick=()=>{position=clamp(position+direction*4,1,99);};}
    $('#activity-root').onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();position=clamp(position+(e.key==='ArrowLeft'?-5:5),1,99);}};
  }
  function frame(now){
    if(!active())return;const dt=Math.min(.1,(now-previous)/1000);previous=now;elapsed+=dt;
    if(activity.kind==='timing'){position=50+Math.sin(elapsed*2.3)*46;if(position<42||position>62)armed=true;$('#activity-marker').style.left=`${position}%`;}
    if(activity.kind==='kite'){position=clamp(position+(Math.sin(elapsed*1.6)*9+Math.cos(elapsed*.8)*6+held*35)*dt,1,99);success=clamp(success+(position>=35&&position<=65?dt:-dt*.4),0,8);progress(success/8);$('#activity-marker').style.left=`${position}%`;if(success>=8){complete();return;}}
    resultGuard();requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
}
