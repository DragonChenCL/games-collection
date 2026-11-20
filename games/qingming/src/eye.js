import {WORLD,POIS,CARGO,SOUVENIRS,BRIDGES,riverY,roadY,bridgeLift,clamp} from './game.js';
import {drawFigure} from './figures.js';

export function relativeMotion(x,y,yaw){return{x:-y*Math.cos(yaw)-x*Math.sin(yaw),y:-y*Math.sin(yaw)+x*Math.cos(yaw)};}
export function viewPoint(p,camera){const x=p.x-camera.x,y=p.y-camera.y;return{s:-Math.sin(camera.yaw)*x+Math.cos(camera.yaw)*y,d:Math.cos(camera.yaw)*x+Math.sin(camera.yaw)*y,z:p.z||0};}
export function clipNear(points,near=4){
  const result=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],inside=a.d>=near,next=b.d>=near;
    if(inside)result.push(a);
    if(inside!==next){const f=(near-a.d)/(b.d-a.d);result.push({s:a.s+(b.s-a.s)*f,d:near,z:a.z+(b.z-a.z)*f});}
  }return result;
}
const point=(x,y,z=0)=>({x,y,z});
const shopNames=['米行','酒肆','香饮子','脚店','布庄','解库','炊饼铺','药铺'];
function buildings(){
  const out=[];
  const add=(x,y,w,d,h,name='',bank=0)=>out.push({x,y,w,d,h,name,bank});
  for(let x=700,i=0;x<4400;x+=163,i++){
    if(x>2820&&x<3700)continue;
    add(x,roadY(x)-165,105+(i%3)*12,88,73+(i%4)*16,shopNames[i%8]);
    if(i%2)add(x+18,roadY(x)-350,115,86,65);
  }
  for(let x=1000;x<4650;x+=235)add(x,roadY(x,1)+87,140,95,80,'茶肆',1);
  for(const [x,w,h,name] of [[740,163,160,'孙羊正店'],[1335,150,135,'锦绣绸庄'],[1920,165,145,'刘家茶坊'],[2790,130,100,'汴京驿站'],[3780,130,98,'漕运货栈']])add(x,roadY(x)-170,w,95,h,name);
  for(const [x,w,h,name] of [[6090,205,73,'船坞'],[6620,138,90,'木作'],[7290,268,78,''],[7770,95,110,''],[8160,120,75,''],[8420,170,145,'水磨'],[9520,170,80,''],[10170,83,60,''],[15740,144,80,''],[16450,135,95,''],[17200,182,100,'']])add(x,roadY(x)-180,w,100,h,name);
  add(11900,roadY(12000,1)+115,210,140,140,'古刹',1);add(11650,roadY(12000,1)+100,110,75,70,'',1);add(12220,roadY(12000,1)+130,110,85,78,'',1);
  for(let i=0;i<13;i++){const x=13130+i*170+Math.sin(i*4)*38;add(x,roadY(x)-130,70+(i%3)*15,54,35,i%4===0?'春集':'');}
  return out;
}

export class EyeScene {
  constructor(drawers){this.drawers=drawers;this.buildings=buildings();this.props=new Map();this.hits=[];}
  texture(key,draw,w=220,h=230){
    if(!this.props.has(key)){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'));this.props.set(key,canvas);}
    return this.props.get(key);
  }
  unproject(p,game){
    const depth=clamp(this.focal*this.camera.eye/Math.max(5,p.y-this.horizon),6,1600),side=(p.x-this.width/2)*depth/this.focal;
    return{x:game.player.x+Math.cos(game.yaw)*depth-Math.sin(game.yaw)*side,y:game.player.y+Math.sin(game.yaw)*depth+Math.cos(game.yaw)*side};
  }
  hit(p){return this.hits.filter(h=>p.x>=h.left&&p.x<=h.right&&p.y>=h.top&&p.y<=h.bottom).sort((a,b)=>a.depth-b.depth)[0]?.poi;}
  draw(game,scene){
    const c=scene.c,w=scene.width,h=scene.height,cam={...game.player,yaw:game.yaw,eye:34+(game.mode==='walk'?bridgeLift(game.player):0)};
    this.camera=cam;this.width=w;this.horizon=h*(.46+(game.pitch||0)*.5);this.focal=Math.min(w,h*1.7)*.85*(game.fov||1);this.hits=[];
    const horizon=this.horizon,f=this.focal;
    const project=v=>({x:w/2+v.s*f/v.d,y:horizon-(v.z-cam.eye)*f/v.d});
    const screen=p=>{const v=viewPoint(p,cam);return v.d>4?{...project(v),depth:v.d,scale:f/v.d}:null;};
    const polygon=(pts,fill,stroke='#6c684d',width=.8)=>{
      const clipped=clipNear(pts.map(p=>viewPoint(p,cam)));if(clipped.length<3)return;
      c.beginPath();clipped.forEach((v,i)=>{const p=project(v);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
    };
    const segment=(a,b,color='#766b4b',width=1)=>{
      const clipped=clipNear([viewPoint(a,cam),viewPoint(b,cam)]);if(clipped.length<2)return;const p=project(clipped[0]),q=project(clipped[1]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.strokeStyle=color;c.lineWidth=width;c.stroke();
    };
    const queue=[];
    const face=(pts,fill,stroke,width)=>{
      const center=pts.reduce((a,b)=>({x:a.x+b.x/pts.length,y:a.y+b.y/pts.length}),{x:0,y:0}),v=viewPoint(center,cam);
      if(v.d< -180||v.d>2400)return;queue.push({depth:v.d,run:()=>polygon(pts,fill,stroke,width)});
    };
    const stroke=(a,b,color,width=.8)=>{const depth=(viewPoint(a,cam).d+viewPoint(b,cam).d)/2;if(depth>0&&depth<1400)queue.push({depth:depth-.01,run:()=>segment(a,b,color,width)});};
    const billboard=(p,image,anchorX=110,anchorY=210,scale=1,poi=null)=>{
      const at=screen(p);if(!at||at.depth>2000||at.x< -500||at.x>w+500)return;
      const s=at.scale*scale;if(s>14)return;
      queue.push({depth:at.depth,run:()=>c.drawImage(image,at.x-anchorX*s,at.y-anchorY*s,image.width*s,image.height*s)});
      if(poi)this.hits.push({poi,depth:at.depth,left:at.x-18*at.scale,right:at.x+18*at.scale,top:at.y-63*at.scale,bottom:at.y+8*at.scale});
    };
    c.setTransform(scene.dpr,0,0,scene.dpr,0,0);c.fillStyle='#e9dfc4';c.fillRect(0,0,w,h);
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#c8ceb880');sky.addColorStop(.55,'#e9dfc400');c.fillStyle=sky;c.fillRect(0,0,w,h);
    for(let i=-1;i<8;i++){const x=i*w/6-((game.yaw*80)%(w/6));c.beginPath();c.moveTo(x-100,horizon+4);c.quadraticCurveTo(x+w/10,horizon-45-i%3*12,x+w/4,horizon+5);c.fillStyle='#a6af9228';c.fill();}
    polygon([point(cam.x-6000,cam.y-6000,-5),point(cam.x+6000,cam.y-6000,-5),point(cam.x+6000,cam.y+6000,-5),point(cam.x-6000,cam.y+6000,-5)],'#dcd0ac',null);
    const start=Math.max(0,Math.floor((cam.x-1900)/70)*70),end=Math.min(WORLD.width,cam.x+1900),ground=[];
    for(let x=start;x<end;x+=70){
      const xx=x+70,ry=riverY(x),next=riverY(xx);
      ground.push({depth:viewPoint(point(x+35,(ry+next)/2),cam).d,pts:[point(x,ry-141,-2),point(xx,next-141,-2),point(xx,next+141,-2),point(x,ry+141,-2)],fill:'#a4ad98'});
      for(const bank of [0,1]){const a=roadY(x,bank),b=roadY(xx,bank);ground.push({depth:viewPoint(point(x+35,(a+b)/2),cam).d,pts:[point(x,a-48,.1),point(xx,b-48,.1),point(xx,b+48,.1),point(x,a+48,.1)],fill:'#e3d4ae'});}
    }
    for(const q of ground.sort((a,b)=>b.depth-a.depth))polygon(q.pts,q.fill,null);
    for(let x=start;x<end;x+=84){const y=riverY(x);for(const offset of [-100,-35,55,115])segment(point(x,y+offset,-1.8),point(x+39,y+offset+Math.sin(x)*3,-1.8),'#d4d4b766',.8);}
    for(const b of this.buildings){
      if(Math.abs(b.x-cam.x)>1900)continue;
      const x=b.x,y=b.y,xx=x+b.w,yy=y+b.d,z=b.h,ridgeY=y+b.d/2,peak=z+30;
      face([point(x,y),point(xx,y),point(xx,y,z),point(x,y,z)],'#c8b88f');
      face([point(xx,y),point(xx,yy),point(xx,yy,z),point(xx,y,z)],'#b9a985');
      face([point(xx,yy),point(x,yy),point(x,yy,z),point(xx,yy,z)],'#d8c9a3');
      face([point(x,yy),point(x,y),point(x,y,z),point(x,yy,z)],'#c2b28d');
      face([point(x-16,y-12,z+12),point(x+8,y-15,z+3),point(xx-8,y-15,z+3),point(xx+16,y-12,z+12),point(xx+6,ridgeY,peak),point(x-6,ridgeY,peak)],'#7e856d');
      face([point(x-6,ridgeY,peak),point(xx+6,ridgeY,peak),point(xx+16,yy+12,z+12),point(xx-8,yy+15,z+3),point(x+8,yy+15,z+3),point(x-16,yy+12,z+12)],'#8c8b70');
      face([point(x,y,z),point(x,yy,z),point(x,ridgeY,peak)],'#b5a580');face([point(xx,yy,z),point(xx,y,z),point(xx,ridgeY,peak)],'#a69d7a');
      const front=b.bank?y-.3:yy+.3,fy=front+(b.bank?-.3:.3),mid=x+b.w*.5;
      for(let u=0;u<=b.w;u+=b.w/4)face([point(x+u-1,fy),point(x+u+2,fy),point(x+u+2,fy,z),point(x+u-1,fy,z)],'#84724f',null);
      face([point(mid-11,fy),point(mid+11,fy),point(mid+11,fy,40),point(mid-11,fy,40)],'#716b50');
      for(const fraction of [.2,.8]){const wx=x+b.w*fraction;face([point(wx-11,fy,20),point(wx+11,fy,20),point(wx+11,fy,49),point(wx-11,fy,49)],'#77765b');for(let j=0;j<4;j++)face([point(wx-8+j*5,fy+(b.bank?-.15:.15),20),point(wx-7+j*5,fy+(b.bank?-.15:.15),20),point(wx-7+j*5,fy+(b.bank?-.15:.15),49),point(wx-8+j*5,fy+(b.bank?-.15:.15),49)],'#c4b38c',null);}
      for(const fx of [x-.5,xx+.5]){
        for(const ty of [y+2,ridgeY,yy-2])face([point(fx,ty-1.5,2),point(fx,ty+1.5,2),point(fx,ty+1.5,z),point(fx,ty-1.5,z)],'#80704f',null);
        for(const tz of [5,54,z-4])face([point(fx,y,tz),point(fx,yy,tz),point(fx,yy,tz+2),point(fx,y,tz+2)],'#8b7955',null);
        for(const fraction of [.26,.74]){
          const wy=y+b.d*fraction;face([point(fx,wy-12,19),point(fx,wy+12,19),point(fx,wy+12,47),point(fx,wy-12,47)],'#727259');
          for(let i=0;i<5;i++)stroke(point(fx+(fx<x?-.1:.1),wy-10+i*5,20),point(fx+(fx<x?-.1:.1),wy-10+i*5,46),'#c3b58f',1);
          for(const wz of [25,35,44])stroke(point(fx+(fx<x?-.1:.1),wy-11,wz),point(fx+(fx<x?-.1:.1),wy+11,wz),'#b1a57e',.8);
        }
        stroke(point(fx,y,z),point(fx,ridgeY,peak-2),'#685f44',2);stroke(point(fx,yy,z),point(fx,ridgeY,peak-2),'#685f44',2);stroke(point(fx,ridgeY,z),point(fx,ridgeY,peak-2),'#75674a',2);
      }
      if(Math.hypot(x-cam.x,y-cam.y)<850){
        for(let i=1;i<9;i++){const ry=y+b.d*i/9,rz=peak-Math.abs(ry-ridgeY)/(b.d/2)*26+.5;stroke(point(x-5,ry,rz),point(xx+5,ry,rz),'#626b5780',.8);}
        for(let i=0;i<=Math.floor(b.w/13);i++){const rx=x+i*13;stroke(point(rx,y-10,z+7),point(rx,ridgeY,peak+.5),'#5d695359',.65);stroke(point(rx,ridgeY,peak+.5),point(rx,yy+10,z+7),'#626b5759',.65);}
        for(let i=0;i<5;i++){const tz=12+i*12;stroke(point(x+7,fy,tz),point(x+b.w*(.4+(i%3)*.12),fy,tz+1),'#97815d55',.7);}
      }
      if(b.name&&b.h<150){
        const direction=b.bank?-1:1,outer=front+direction*34,awning=b.x%3?'#939374':'#a28b6c';
        face([point(x+4,front,58),point(xx-4,front,58),point(xx+3,outer,46),point(x-3,outer,46)],awning);
        face([point(x-3,outer,46),point(xx+3,outer,46),point(xx+3,outer,41),point(x-3,outer,41)],'#8a8061');
        for(const px of [x+8,xx-8])face([point(px-1,outer,0),point(px+1,outer,0),point(px+1,outer,47),point(px-1,outer,47)],'#80714f');
        face([point(x+14,outer-direction*5,0),point(xx-14,outer-direction*5,0),point(xx-14,outer-direction*5,18),point(x+14,outer-direction*5,18)],'#9e8d65');
        face([point(x+12,outer-direction*5,18),point(xx-12,outer-direction*5,18),point(xx-12,front+direction*9,18),point(x+12,front+direction*9,18)],'#baa77d');
      }
      if(b.name&&(b.bank?cam.y<front:cam.y>front)){
        const at=screen(point(mid,fy,z*.76));if(at&&at.depth<1100)queue.push({depth:at.depth-.5,run:()=>{const size=clamp(at.scale*12,8,28);c.font=`${size}px Song,serif`;c.textAlign='center';const width=c.measureText(b.name).width+size;c.fillStyle='#5e5941';c.fillRect(at.x-width/2,at.y-size,width,size*1.5);c.fillStyle='#ebdfbb';c.fillText(b.name,at.x,at.y+size*.12);}});
      }
    }
    for(const bridge of BRIDGES){
      if(bridge.b.x<start||bridge.a.x>end)continue;const len=Math.hypot(bridge.b.x-bridge.a.x,bridge.b.y-bridge.a.y),nx=-(bridge.b.y-bridge.a.y)/len,ny=(bridge.b.x-bridge.a.x)/len,bw=bridge.kind==='rainbow'?54:33;
      const at=(t,side=0,z=0)=>point(bridge.a.x+(bridge.b.x-bridge.a.x)*t+nx*side,bridge.a.y+(bridge.b.y-bridge.a.y)*t+ny*side,Math.sin(t*Math.PI)*bridge.height+z);
      for(let i=0;i<32;i++){const a=i/32,b=(i+1)/32;face([at(a,-bw),at(a,bw),at(b,bw),at(b,-bw)],bridge.kind==='stone'?'#beb79a':i%2?'#c9b482':'#bba376');for(const side of [-bw,bw]){face([at(a,side),at(b,side),at(b,side,-27),at(a,side,-27)],bridge.kind==='stone'?'#a6a58c':'#8f7c51');face([at(a,side,17),at(b,side,17),at(b,side,20),at(a,side,20)],'#88764f');if(i%2===0)face([at(a,side,0),at(a+.003,side,0),at(a+.003,side,22),at(a,side,22)],'#796f4b');}}
    }
    for(let x=Math.floor(start/180)*180;x<end;x+=180){
      if(BRIDGES.some(b=>x>b.a.x-70&&x<b.b.x+70))continue;
      const bank=x%360===0?0:1,y=riverY(x)+(bank?194:-190),image=this.texture(`tree-${x%7}`,ctx=>this.drawers.tree(ctx,110,210,1.05,true));billboard(point(x,y),image);
    }
    const people=[...scene.npcs,...POIS.map(p=>({...p,seed:2,dir:1,moving:false,role:p.id==='grove'?'monk':p.id==='shipyard'?'farmer':'merchant'}))];
    for(const p of people){
      if(Math.abs(p.x-cam.x)>1500||Math.hypot(p.x-cam.x,p.y-cam.y)<12)continue;
      const at=screen(point(p.x,p.y,bridgeLift(p)));if(!at||at.depth>1500||at.x+35*at.scale<0||at.x-35*at.scale>w||at.y-65*at.scale>h||at.y+10*at.scale<0)continue;
      if(at.depth<650)queue.push({depth:at.depth,run:()=>{c.save();c.translate(at.x,at.y);c.scale(at.scale,at.scale);drawFigure(c,{...p,x:0,y:0},game.time);c.restore();}});
      else billboard(point(p.x,p.y,bridgeLift(p)),scene.figures.get(p,game.time),60,88);
      if(p.id)this.hits.push({poi:p,depth:at.depth,left:at.x-18*at.scale,right:at.x+18*at.scale,top:at.y-63*at.scale,bottom:at.y+8*at.scale});
    }
    for(const ship of scene.ships){if(Math.abs(ship.x-cam.x)>1600)continue;const frame=ship.hero?Math.floor((ship.mastAngle||0)*5):0,image=this.texture(`ship-${ship.seed}-${frame}`,ctx=>this.drawers.boat(ctx,{...ship,x:180,y:220,mastAngle:frame/5},0),360,280);billboard(point(ship.x,ship.y),image,180,220,1);}
    if(game.mode==='boat')for(const box of CARGO)if(!game.boatRun.collected.includes(box.id)){const x=box.x,y=box.y;face([point(x-7,y-7,0),point(x+7,y-7,0),point(x+7,y-7,12),point(x-7,y-7,12)],'#9a8258');face([point(x+7,y-7,0),point(x+7,y+7,0),point(x+7,y+7,12),point(x+7,y-7,12)],'#ad9567');face([point(x-7,y-7,12),point(x+7,y-7,12),point(x+7,y+7,12),point(x-7,y+7,12)],'#bca87b');}
    for(const item of SOUVENIRS)if(!game.state.souvenirs.includes(item.id)){const at=screen(point(item.x,item.y,18));if(at&&at.depth<800)queue.push({depth:at.depth,run:()=>{const r=clamp(at.scale*6,3,20);c.beginPath();c.moveTo(at.x,at.y-r);c.lineTo(at.x+r,at.y);c.lineTo(at.x,at.y+r);c.lineTo(at.x-r,at.y);c.closePath();c.fillStyle='#ac7052';c.fill();}});}
    for(const item of queue.sort((a,b)=>b.depth-a.depth)){c.globalAlpha=clamp(1-(item.depth-700)/1700,.15,1);item.run();}c.globalAlpha=1;
    if(game.mode==='boat'){c.beginPath();c.moveTo(w*.3,h);c.quadraticCurveTo(w*.47,h*.82,w*.5,h*.78);c.quadraticCurveTo(w*.53,h*.82,w*.7,h);c.fillStyle='#a18a61';c.fill();c.strokeStyle='#6c6247';c.lineWidth=3;c.stroke();}
    c.strokeStyle='#846e4d88';c.lineWidth=1;c.beginPath();c.moveTo(w/2-5,h/2);c.lineTo(w/2+5,h/2);c.moveTo(w/2,h/2-5);c.lineTo(w/2,h/2+5);c.stroke();
    for(const poi of this.hits){const at=screen(point(poi.poi.x,poi.poi.y,bridgeLift(poi.poi)+62));if(at&&at.depth<320){c.font='13px Song,serif';c.textAlign='center';c.fillStyle='#7c4935';c.fillText(poi.poi.name,at.x,at.y);}}
    if(game.mode==='boat'){
      const goal=CARGO.filter(p=>!game.boatRun.collected.includes(p.id)).sort((a,b)=>Math.hypot(a.x-cam.x,a.y-cam.y)-Math.hypot(b.x-cam.x,b.y-cam.y))[0];
      if(goal){const angle=Math.atan2(goal.y-cam.y,goal.x-cam.x)-game.yaw,x=w/2,y=h-130;c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,-18);c.lineTo(-10,10);c.lineTo(0,5);c.lineTo(10,10);c.closePath();c.fillStyle='#99563c';c.fill();c.restore();c.font='13px Song,serif';c.textAlign='center';c.fillStyle='#674f39';c.fillText(`货箱 · ${Math.ceil(Math.hypot(goal.x-cam.x,goal.y-cam.y)/20)} 步`,x,y+32);}
    }
  }
}
