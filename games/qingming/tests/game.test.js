import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START, BRIDGE, POIS, SOUVENIRS, CARGO, nodes, edges, newGame, restoreGame, route, nearestRoad, walkable, riverY, roadY, bridgeLift, stampCount, distance, boatWithinRiver, clamp } from '../src/game.js';

test('new journeys are independent and start on a walkable road beside the bridge',()=>{
  const a=newGame();a.souvenirs.push('s0');a.player.x=100;
  assert.deepEqual(newGame().souvenirs,[]);assert.deepEqual(newGame().player,START);
  assert.ok(walkable(START));assert.equal(stampCount(newGame()),0);
});
test('every objective and souvenir is accessible by the road network',()=>{
  for(const target of [...POIS,...SOUVENIRS]){
    assert.ok(nearestRoad(target).distance<50,target.id);
    const path=route(START,target);assert.ok(path.length);
    assert.ok(distance(path.at(-1),target)<50,target.id);
    let previous=START;
    for(const p of path){
      for(let t=0;t<=1;t+=.1)assert.ok(walkable({x:previous.x+(p.x-previous.x)*t,y:previous.y+(p.y-previous.y)*t}),target.id);
      previous=p;
    }
  }
});
test('cross-bank routes use the actual bridge instead of walking through the river',()=>{
  const path=route({x:2000,y:roadY(2000)},{x:2400,y:roadY(2400,1)});
  assert.ok(path.some(p=>distance(p,BRIDGE.a)<1));assert.ok(path.some(p=>distance(p,BRIDGE.b)<1));
  assert.equal(walkable({x:2000,y:riverY(2000)}),false);
});
test('same-edge routes go directly to the projected target',()=>{
  const path=route({x:2010,y:roadY(2010)},{x:2100,y:roadY(2100)});
  assert.equal(path.length,1);assert.ok(walkable(path[0]));
});
test('road graph is connected and has no zero-length edges',()=>{
  const seen=new Set([0]);let changed=true;
  while(changed){changed=false;for(const [a,b] of edges){assert.ok(distance(nodes[a],nodes[b])>0);if(seen.has(a)&&!seen.has(b)){seen.add(b);changed=true;}if(seen.has(b)&&!seen.has(a)){seen.add(a);changed=true;}}}
  assert.equal(seen.size,nodes.length);
});
test('bridge visually lifts walkers while banks remain at ground level',()=>{
  assert.ok(bridgeLift({x:(BRIDGE.a.x+BRIDGE.b.x)/2,y:(BRIDGE.a.y+BRIDGE.b.y)/2})>75);
  assert.equal(bridgeLift({x:2000,y:roadY(2000)}),0);assert.ok(bridgeLift(BRIDGE.a)<.01);
});
test('cargo is reachable within the navigable river corridor',()=>{
  assert.equal(CARGO.length,5);for(const p of CARGO)assert.ok(boatWithinRiver(p));
  assert.equal(boatWithinRiver({x:3600,y:riverY(3600)+150}),false);
});
test('saved progress roundtrips, restoring position onto a safe road',()=>{
  const s={...newGame(),player:{x:2000,y:roadY(2000)},coins:42,delivered:2,courierStarted:true,boatWon:true,souvenirs:['s0'],pickedCoins:[1,3],visited:['tea','post']};
  const p=restoreGame(JSON.stringify(s));assert.deepEqual(p,s);
});
test('invalid, incompatible and missing saves start safely',()=>{
  for(const value of [null,undefined,'','{broken','null','[]','42','{"version":1}','{"version":999}'])assert.deepEqual(restoreGame(value),newGame());
});
test('untrusted saves are clamped, filtered, deduplicated and moved out of water',()=>{
  const p=restoreGame(JSON.stringify({version:2,player:{x:2000,y:riverY(2000)},coins:-100,delivered:Infinity,courierStarted:'true',boatWon:1,souvenirs:['s0','s0','bad'],pickedCoins:[1,1,999,'2'],visited:['post','post','bad']}));
  assert.equal(p.coins,0);assert.equal(p.delivered,0);assert.equal(p.courierStarted,false);assert.equal(p.boatWon,false);
  assert.deepEqual(p.souvenirs,['s0']);assert.deepEqual(p.pickedCoins,[1]);assert.deepEqual(p.visited,['post']);assert.ok(walkable(p.player));
  const huge=restoreGame('{"version":2,"player":{"x":-100000,"y":999999},"coins":999999,"delivered":40,"pickedCoins":{},"souvenirs":null}');
  assert.equal(huge.coins,9999);assert.equal(huge.delivered,3);assert.ok(walkable(huge.player));
});
test('each completed activity contributes exactly one stamp',()=>{
  const s=newGame();s.delivered=3;assert.equal(stampCount(s),1);s.boatWon=true;assert.equal(stampCount(s),2);s.souvenirs=SOUVENIRS.map(s=>s.id);assert.equal(stampCount(s),3);
});
test('numeric clamping respects both boundaries',()=>{assert.equal(clamp(-4,0,1),0);assert.equal(clamp(9,0,1),1);assert.equal(clamp(.4,0,1),.4);});
