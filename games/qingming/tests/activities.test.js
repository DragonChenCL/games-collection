import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startActivity} from '../src/activities.js';

function activity(t,id){
  const originalDocument=globalThis.document,originalRAF=globalThis.requestAnimationFrame;
  let now=0,frame;
  const node=()=>({style:{},disabled:false,hidden:false,value:0,textContent:''});
  const elements=new Map(['dialog','activity-root','activity-result','activity-progress','activity-hit','activity-marker','activity-bean','activity-again'].map(id=>[`#${id}`,node()]));
  elements.get('#dialog').open=true;
  const cups=[node(),node(),node()],state={rural:[],coins:0};
  globalThis.document={querySelector:s=>elements.get(s),querySelectorAll:s=>s==='[data-cup]'?cups:[]};
  globalThis.requestAnimationFrame=callback=>{frame=callback;};
  t.mock.method(performance,'now',()=>now);
  t.after(()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;if(originalRAF===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=originalRAF;});
  startActivity({id},{state,showDialog:()=>{cups.forEach(b=>b.disabled=true);elements.get('#activity-again').hidden=true;},chime(){},save(){},updateHUD(){}});
  return {state,cups,get:id=>elements.get(`#${id}`),advance:seconds=>{for(let i=0;i<Math.round(seconds*20);i++){now+=50;const callback=frame;frame=null;callback?.(now);}}};
}

test('a wrong cup locks the round until the shuffle is replayed',t=>{
  const a=activity(t,'fair');
  a.advance(6);assert.ok(a.cups.every(b=>!b.disabled));
  a.cups[1].onclick();a.advance(1);
  assert.ok(a.cups.every(b=>b.disabled));assert.equal(a.get('activity-again').hidden,false);
  a.cups[0].onclick();assert.equal(a.state.coins,0);assert.deepEqual(a.state.rural,[]);
  a.get('activity-again').onclick();assert.ok(a.cups.every(b=>b.disabled));
  a.advance(6);a.cups[0].onclick();assert.equal(a.state.coins,15);assert.deepEqual(a.state.rural,['fair']);
});
