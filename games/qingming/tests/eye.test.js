import test from 'node:test';
import assert from 'node:assert/strict';
import {relativeMotion,viewPoint,clipNear} from '../src/eye.js';
test('first-person forward and strafing follow the heading',()=>{
  assert.deepEqual(relativeMotion(0,-1,0),{x:1,y:0});
  assert.ok(Math.abs(relativeMotion(0,-1,Math.PI/2).y-1)<1e-9);
  assert.ok(Math.abs(relativeMotion(1,0,Math.PI).y+1)<1e-9);
});
test('perspective places points in front, beside, and behind the eye',()=>{
  const camera={x:100,y:50,yaw:0};
  assert.deepEqual(viewPoint({x:200,y:60,z:8},camera),{s:10,d:100,z:8});
  assert.ok(viewPoint({x:0,y:50},camera).d<0);
});
test('near-plane clipping prevents infinite and mirrored geometry',()=>{
  const polygon=[{s:-10,d:-5,z:0},{s:10,d:20,z:0},{s:0,d:20,z:8}];
  const clipped=clipNear(polygon);assert.ok(clipped.length>=3);
  assert.ok(clipped.every(v=>v.d>=4&&Number.isFinite(v.s)&&Number.isFinite(v.z)));
  assert.deepEqual(clipNear(polygon.map(v=>({...v,d:-5}))),[]);
});
