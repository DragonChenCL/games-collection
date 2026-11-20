import {clamp,distance,bridgeLift} from './game.js';

export function guideMarker(game,w,h){
  const p=game.guide;if(!p||game.mode==='boat')return null;
  const angle=Math.atan2(p.y-game.player.y,p.x-game.player.x),eye=game.view==='eye';
  const top=Math.min(90,h*.3),bottom=Math.max(top,h-165);
  return {x:eye?w/2:clamp((p.x-game.camera.x)*game.camera.zoom+w/2,60,w-80),
    y:eye?Math.max(top,h-140):clamp((p.y-bridgeLift(p)-game.camera.y)*game.camera.zoom+h/2-65,top,bottom),
    angle:eye?angle-game.yaw-Math.PI/2:angle,steps:Math.ceil(distance(p,game.player)/20)};
}
export function drawGuide(c,game,w,h){
  const marker=guideMarker(game,w,h);if(!marker)return;
  const {x,y,angle,steps}=marker;c.save();c.translate(x,y);
  c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.fillStyle='#f4e7c7ed';c.fill();c.strokeStyle='#974f38';c.lineWidth=1.5;c.stroke();
  c.save();c.rotate(angle);c.beginPath();c.moveTo(11,0);c.lineTo(-7,-8);c.lineTo(-3,0);c.lineTo(-7,8);c.closePath();c.fillStyle='#974f38';c.fill();c.restore();
  c.font='12px Song,serif';c.textAlign='center';c.fillStyle='#684f39';c.fillText(`${steps} 步`,0,34);c.restore();
}
