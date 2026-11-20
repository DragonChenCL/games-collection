import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Soundscape,soundRegion,AudioActivation} from '../src/audio.js';
function context(){
  const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({gain:parameter(),frequency:parameter(),connect(){},disconnect(){},start(){},stop(){}});
  const c={currentTime:0,sampleRate:8,destination:{},voices:0,createGain:node,createBiquadFilter:node,createBufferSource:node,createBuffer:()=>({getChannelData:()=>new Float32Array(16)}),createOscillator(){this.voices++;return node();}};
  return c;
}
test('districts choose different musical patterns',()=>{
  assert.deepEqual([3000,7000,9000,12000,14500,17000].map(soundRegion),['city','yard','fields','temple','fair','fields']);
});
test('muting stops scheduling and resuming never replays a hidden-tab backlog',()=>{
  const c=context(),s=new Soundscape(c);s.update(3000,false,false);s.cue();assert.equal(c.voices,0);assert.equal(s.output.gain.value,0);
  s.update(3000,true,true);assert.ok(c.voices>0);const first=c.voices;
  for(let i=0;i<60;i++)s.update(3000,true,true);assert.equal(c.voices,first);
  s.update(3000,false,true);assert.equal(s.music.gain.value,0);s.cue(2);assert.equal(c.voices,first+1);
  c.currentTime=100;s.update(3000,false,false);assert.equal(s.output.gain.value,0);
  const before=c.voices;s.update(12000,true,true);assert.ok(c.voices-before<=4);assert.equal(s.music.gain.value,1);
});
test('a blocked sound restore retries without toggling the saved preference',async()=>{
  let attempts=0,created=0;const changes=[];
  const c={state:'suspended',async resume(){if(++attempts===1)throw Error('gesture required');this.state='running';}};
  const a=new AudioActivation({preferred:true,createContext:()=>{created++;return c;},onChange:active=>changes.push(active)});
  assert.equal(await a.resume(),false);assert.equal(a.preferred,true);
  assert.equal(await a.resume(),true);assert.equal(a.preferred,true);assert.equal(created,1);assert.equal(attempts,2);assert.deepEqual(changes,[false,true]);
});
test('switching off while activation is pending cannot turn sound back on',async()=>{
  let finish;const changes=[],c={state:'suspended',resume:()=>new Promise(resolve=>finish=()=>{c.state='running';resolve();})};
  const a=new AudioActivation({createContext:()=>c,onChange:active=>changes.push(active)});
  const pending=a.set(true);await a.set(false);finish();
  assert.equal(await pending,false);assert.equal(a.preferred,false);assert.equal(a.active,false);assert.deepEqual(changes,[false,false]);
});
test('saved sound off does not create an audio context on a gesture',async()=>{
  const a=new AudioActivation({preferred:false,createContext:()=>{throw Error('must not be called');},onChange:()=>assert.fail('must not change')});
  assert.equal(await a.resume(),false);assert.equal(a.context,null);
});
