import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,restoreGame,handOverParcel,markGuide,COINS,roadY,walkable} from '../src/game.js';
import {guideMarker} from '../src/navigation.js';

test('a guide cancels automation without moving or rewarding the player',()=>{
  const game={player:{x:3000,y:roadY(3000)},path:[{x:2000,y:600}],target:{x:2000,y:600},state:newGame()};
  const before=structuredClone(game.player),state=structuredClone(game.state),target={id:'tea',name:'茶坊',x:2000,y:roadY(2000)};
  markGuide(game,target);
  assert.deepEqual(game.player,before);assert.deepEqual(game.state,state);
  assert.deepEqual(game.path,[]);assert.equal(game.target,null);
  assert.deepEqual(game.guide,target);target.x=0;assert.equal(game.guide.x,2000);
});
test('courier rewards require the correct parcel at the correct current shop',()=>{
  const s=newGame();assert.equal(handOverParcel(s,'tea','tea'),false);
  s.courierStarted=true;
  for(const [shop,parcel] of [['tea','silk'],['silk','silk'],['tea',null]])assert.equal(handOverParcel(s,shop,parcel),false);
  assert.equal(s.delivered,0);assert.equal(s.coins,0);
  for(const shop of ['tea','silk','restaurant'])assert.equal(handOverParcel(s,shop,shop),true);
  assert.equal(s.delivered,3);assert.equal(s.coins,36);
  assert.equal(handOverParcel(s,'restaurant','restaurant'),false);assert.equal(handOverParcel(s,undefined,undefined),false);
  assert.equal(s.coins,36);
});
test('outer districts have reachable coins without renumbering old saves',()=>{
  assert.equal(COINS[0].x,650);assert.equal(COINS[31].x,5300);
  for(const coin of COINS)assert.ok(walkable(coin),coin.id);
  for(const x of [6900,8700,12000,14500,17100])assert.ok(COINS.some(c=>Math.abs(c.x-x)<500));
});
test('the first carriage pass persists and old saves receive one',()=>{
  assert.equal(newGame().travelPass,true);
  assert.equal(restoreGame('{"version":2}').travelPass,true);
  assert.equal(restoreGame(JSON.stringify({...newGame(),travelPass:false})).travelPass,false);
});
test('walking and first-person guide markers stay finite on compact screens',()=>{
  for(const [w,h] of [[320,450],[600,280],[740,240],[1280,600]])for(const view of ['scroll','eye']){
    const game={view,mode:'walk',yaw:0,player:{x:3000,y:700},camera:{x:3000,y:700,zoom:.46},guide:{x:17100,y:700}};
    const p=guideMarker(game,w,h);assert.ok(p.x>0&&p.x<w);assert.ok(p.y>0&&p.y<h);assert.ok(Number.isFinite(p.angle));assert.equal(p.steps,705);
    game.mode='boat';assert.equal(guideMarker(game,w,h),null);
  }
});
