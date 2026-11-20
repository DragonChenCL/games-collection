import { WORLD, riverY, roadY, BRIDGE, BRIDGES, BRIDGE_HEIGHT, POIS, SOUVENIRS, COINS, CARGO, bridgeLift, clamp } from './game.js';
import { drawFigure, drawDonkey, drawSedan, OCCUPATIONS, FigureCache } from './figures.js';
import { drawScenery, drawLivingScenery } from './scenery.js';
import { EyeScene } from './eye.js';

const INK = '#655e4b';
const COLORS = ['#7b8976', '#a46e58', '#6b7c7e', '#b19a70', '#817185', '#c0ac87'];
function random(seed = 43) { return () => { seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296; }; }
function poly(c, points, fill, stroke=INK, width=1) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c, points, color=INK, width=1) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function ellipse(c,x,y,rx,ry,fill,stroke) {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
function label(c,text,x,y,size=14,color=INK) { c.font=`${size}px Song, serif`;c.textAlign='center';c.fillStyle=color;c.fillText(text,x,y); }

function roof(c,x,y,w,h,d,shade='#77786a') {
  poly(c,[[x-17,y+5],[x+w+18,y+5],[x+w+d+16,y-d*.55],[x+w*.46+d,y-h-d*.55],[x+w*.46,y-h]],shade);
  poly(c,[[x+w*.46,y-h],[x+w*.46+d,y-h-d*.55],[x+w+d+16,y-d*.55],[x+w+18,y+5]],'#62695e');
  c.save();c.globalAlpha=.43;
  for(let i=1;i<9;i++){
    const t=i/9;line(c,[[x-17+(w*.46+17)*(1-t),y+5-(h+5)*(1-t)],[x+w*.46+(w*.54+18)*t,y-h+(h+5)*t]],'#d9d0ad',1);
  }
  for(let i=0;i<w;i+=13)line(c,[[x+w*.46+(i-w*.46)*.1,y-h+5],[x+i,y+1]],'#454f47',.8);
  c.restore();
  c.beginPath();c.moveTo(x-22,y-5);c.quadraticCurveTo(x-12,y+8,x+12,y+6);c.lineTo(x+w-8,y+6);c.quadraticCurveTo(x+w+16,y+7,x+w+23,y-7);c.strokeStyle='#514f40';c.lineWidth=3;c.stroke();
  line(c,[[x+w*.46-5,y-h],[x+w*.46+d+8,y-h-d*.55]],'#565747',4);
}
function house(c,x,y,w=120,h=95,d=36,name='',seed=0) {
  const r=random(seed+102); const tall=h>135;
  ellipse(c,x+w*.55+d/2,y+8,w*.63+d*.5,15,'#73694720');
  poly(c,[[x+w,y],[x+w+d,y-d*.55],[x+w+d,y-h-d*.55],[x+w,y-h]],'#b4a17e');
  poly(c,[[x,y],[x+w,y],[x+w,y-h],[x,y-h]],'#ded0ad');
  for(let i=0;i<=w;i+=w/4)line(c,[[x+i,y],[x+i,y-h]],'#847451',5);
  line(c,[[x,y-h],[x+w,y-h]],'#81704e',5);
  if(tall){
    line(c,[[x-4,y-75],[x+w+7,y-75]],'#847451',5);
    for(let i=12;i<w-20;i+=34){c.fillStyle='#746f57';c.fillRect(x+i,y-h+20,23,37);for(let j=0;j<3;j++)line(c,[[x+i+j*8,y-h+20],[x+i+j*8,y-h+57]],'#d1be93',1.5);line(c,[[x+i,y-h+38],[x+i+23,y-h+38]],'#d1be93',1.5);}
  }
  for(let i=13;i<w-20;i+=36){
    poly(c,[[x+i,y-7],[x+i+24,y-7],[x+i+24,y-60],[x+i,y-60]],'#766e53');
    for(let j=1;j<4;j++)line(c,[[x+i+j*6,y-58],[x+i+j*6,y-7]],'#b8a278',1);
    line(c,[[x+i,y-33],[x+i+24,y-33]],'#b8a278');
  }
  roof(c,x,y-h-4,w,47+tall*13,d,['#7d8071','#8e8169','#68766c'][Math.floor(r()*3)]);
  if(name){
    const awning=['#95745a','#8d9a87','#a67d61','#687e7b'][Math.floor(r()*4)];
    poly(c,[[x-10,y-58],[x+w+11,y-58],[x+w+7,y-35],[x-14,y-35]],awning);
    for(let i=0;i<w;i+=33)line(c,[[x+i,y-57],[x+i-3,y-35]],'#d4c5a355',.6);
    line(c,[[x-12,y-36],[x-12,y+5]],'#7e6b4b',2);line(c,[[x+w+8,y-36],[x+w+8,y+5]],'#7e6b4b',2);
    c.fillStyle='#554d38';c.fillRect(x+w*.2,y-88,w*.6,24);label(c,name,x+w*.5,y-71,13,'#e6d2a4');
    for(let i=8;i<w;i+=26){ellipse(c,x+i,y-20,10,6,'#8a7f51',INK);ellipse(c,x+i,y-23,8,4,['#b6a15f','#b27850','#d1bc7b'][Math.floor(r()*3)]);}
  }
}
function stall(c,x,y,color,seed) {
  const r=random(seed);ellipse(c,x+27,y+3,39,9,'#75684d20');
  for(const dx of [0,58])line(c,[[x+dx,y],[x+dx,y-60]],'#7f7052',3);
  poly(c,[[x-6,y-59],[x+63,y-59],[x+70,y-34],[x-11,y-34]],color);
  for(let i=0;i<6;i++)line(c,[[x+i*12,y-58],[x+i*13,y-34]],'#615a3b44',.7);
  poly(c,[[x-3,y-17],[x+65,y-17],[x+65,y-7],[x-3,y-7]],'#8b7958');
  for(let i=0;i<8;i++)ellipse(c,x+4+i*7,y-22,4,4,['#ac7551','#9f9c60','#d4b16b'][Math.floor(r()*3)]);
  line(c,[[x,y-8],[x,y+3]],INK,3);line(c,[[x+59,y-8],[x+59,y+3]],INK,3);
}
function tree(c,x,y,s=1,willow=false) {
  c.save();c.translate(x,y);c.scale(s,s);ellipse(c,10,4,42,10,'#636d4620');
  const r=random(Math.floor(x+y));
  c.beginPath();c.moveTo(-5,0);c.bezierCurveTo(-18,-37,12,-64,1,-102);c.strokeStyle='#747453';c.lineWidth=7;c.stroke();
  line(c,[[-5,-3],[-11,-36],[4,-75]],'#b7af82',1.3);
  for(let i=0;i<7;i++){
    const dx=(i-3)*18+r()*14,dy=-98-r()*42;
    c.beginPath();c.moveTo(0,-64);c.quadraticCurveTo(dx*.45,-110,dx,dy);c.strokeStyle='#777b56';c.lineWidth=1.5+r()*1.4;c.stroke();
    if(willow){
      for(let k=0;k<5;k++){
        const bx=dx+(k-2)*6,by=dy+Math.abs(k-2)*2,len=40+r()*58,sweep=-18+r()*34;
        c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+sweep,by+len*.58,bx+sweep*.8,by+len);c.strokeStyle='#87915d99';c.lineWidth=.65;c.stroke();
        for(let j=1;j<9;j++){const f=j/9,px=bx+2*(1-f)*f*sweep+f*f*sweep*.8,py=by+len*(1.16*(1-f)*f+f*f);line(c,[[px-2,py-3],[px+2,py+1]],'#8d995f99',.8);}
      }
    }else for(let k=0;k<23;k++){
      const a=r()*Math.PI*2,rad=r()*23,px=dx+Math.cos(a)*rad,py=dy+Math.sin(a)*rad*.65;
      c.beginPath();c.moveTo(px-6,py+3);c.quadraticCurveTo(px-9,py-6,px-2,py-5);c.quadraticCurveTo(px+2,py-10,px+6,py-3);c.quadraticCurveTo(px+11,py+2,px+3,py+5);c.fillStyle=k%2?'#8d98634a':'#a4ab7860';c.fill();
      if(k%3===0)line(c,[[px-3,py],[px+2,py-3],[px+5,py+1]],'#697b5459',.55);
    }
  }
  c.restore();
}
function gate(c,x,y) {
  poly(c,[[x-230,y-5],[x-70,y-5],[x-70,y-186],[x-230,y-186]],'#b5ad8c');
  poly(c,[[x+70,y-5],[x+210,y-5],[x+210,y-186],[x+70,y-186]],'#b5ad8c');
  roof(c,x-235,y-190,165,15,16,'#8f8e75');roof(c,x+65,y-190,150,15,16,'#8f8e75');
  poly(c,[[x-76,y],[x-76,y-191],[x+76,y-191],[x+76,y]],'#c3b690');
  c.fillStyle='#5c604f';c.beginPath();c.moveTo(x-43,y);c.lineTo(x-43,y-61);c.arc(x,y-61,43,Math.PI,0);c.lineTo(x+43,y);c.fill();
  for(let yy=y-180;yy<y;yy+=16)for(let xx=x-222;xx<x+208;xx+=32){if(Math.abs(xx-x)<65&&yy>y-106)continue;line(c,[[xx+(yy%32?0:15),yy],[xx+27+(yy%32?0:15),yy]],'#827e653e');}
  house(c,x-82,y-190,164,75,28,'',22);roof(c,x-99,y-245,195,55,28);label(c,'汴京',x,y-145,20,'#5c503a');
}
function temple(c,x,y) {
  house(c,x-95,y,190,95,45,'',43);roof(c,x-110,y-108,220,75,45,'#808169');
  house(c,x-44,y-161,88,55,30,'',42);roof(c,x-56,y-219,110,50,30,'#7c826b');
  line(c,[[x+11,y-286],[x+11,y-307]],'#787354',3);ellipse(c,x+11,y-292,6,4,'#a69465');
  for(const dx of [-115,125]){poly(c,[[x+dx-8,y],[x+dx+8,y],[x+dx+5,y-40],[x+dx-5,y-40]],'#a79d7b');roof(c,x+dx-12,y-40,24,17,7);}
}

const TILE_WIDTH=2000;
function makeLand(tileX) {
  const canvas=document.createElement('canvas');canvas.width=TILE_WIDTH;canvas.height=WORLD.height;
  const c=canvas.getContext('2d'),r=random(121);
  c.translate(-tileX,0);
  c.fillStyle='#e4d8b8';c.fillRect(0,0,WORLD.width,1700);
  for(let i=0;i<31;i++){
    c.beginPath();c.moveTo(i*630-330,220);for(let j=0;j<12;j++)c.lineTo(i*630-330+j*78,210-Math.sin(j/11*Math.PI)*(75+r()*95));c.lineTo(i*630+600,330);c.closePath();c.fillStyle=i%2?'#b7b99a25':'#a2ab9324';c.fill();
  }
  // Paths and embankments follow the same centerline used by navigation.
  for(const bank of [0,1]){
    c.beginPath();for(let x=0;x<=WORLD.width;x+=20){const y=roadY(x,bank);x?c.lineTo(x,y):c.moveTo(x,y);}c.lineWidth=92;c.strokeStyle='#c2ae7c25';c.stroke();c.lineWidth=79;c.strokeStyle='#d9c69b55';c.stroke();
    for(let i=0;i<450;i++){const x=r()*6000,y=roadY(x,bank)+(r()-.5)*90;line(c,[[x,y],[x+2+r()*8,y-1]],'#a99c7845',.7);}
  }
  c.beginPath();for(let x=0;x<=WORLD.width;x+=16){const y=riverY(x)-141-Math.sin(x/140)*10;x?c.lineTo(x,y):c.moveTo(x,y);}for(let x=WORLD.width;x>=0;x-=16)c.lineTo(x,riverY(x)+141+Math.sin(x/210)*13);c.closePath();c.fillStyle='#b3b49a';c.fill();c.strokeStyle='#8b906942';c.lineWidth=9;c.stroke();c.lineWidth=1.1;c.strokeStyle='#777b594f';c.stroke();
  for(let i=0;i<1300;i++){
    const x=r()*WORLD.width,y=riverY(x)+(r()-.5)*270;line(c,[[x,y],[x+5+r()*42,y]],'#7f886633',.65);
  }
  for(let x=tileX-100;x<tileX+TILE_WIDTH+100;x+=97){
    const rr=random(x+31),y=riverY(x)-90+rr()*180;
    for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-25,y+i*3);c.bezierCurveTo(x+2,y-8+i*3,x+31,y+10+i*3,x+68,y+i*3-2);c.strokeStyle=i%2?'#d3cfab33':'#76846222';c.lineWidth=i===0?3:.55;c.stroke();}
  }
  for(let x=45;x<WORLD.width;x+=63){const y=riverY(x)-155;ellipse(c,x,y,5,2,'#99946e66');line(c,[[x-7,y-3],[x+3,y-3]],'#6f795b55');}
  for(let i=0;i<650;i++){
    const x=r()*6000,y=r()*1700;if(Math.abs(y-riverY(x))<190||Math.abs(y-roadY(x))<80||Math.abs(y-roadY(x,1))<80)continue;
    c.save();c.globalAlpha=.14;ellipse(c,x,y,8+r()*32,3+r()*9,'#7b8c5c');c.restore();
    if(i%3===0)line(c,[[x,y],[x-3,y-8],[x+1,y-3],[x+4,y-11]],'#89915c55',.8);
  }
  for(let i=0;i<38;i++){const x=650+r()*3650;tree(c,x,270+r()*110,.5+r()*.35);}
  for(let i=0;i<12;i++){
    const rr=random(i*632+87),x=4740+rr()*1040,y=250+rr()*208,w=74+rr()*127,h=35+rr()*41;
    poly(c,[[x,y],[x+w,y+9],[x+w+31,y-h],[x+19,y-h-13]],i%3?'#b5b58744':'#adb48a66','#9c9f7155');
    for(let j=8;j<w-10;j+=11)line(c,[[x+j,y-2],[x+j+22,y-h+5]],'#83965b55',.8);
  }
  for(let x=700;x<4300;x+=163){
    if(Math.abs(x-3000)<220||Math.abs(x-3600)<100)continue;
    const h=90+r()*68,w=100+r()*35;
    house(c,x,roadY(x)-72,w,h,32,['米行','酒肆','香饮子','脚店','布庄','解库','炊饼铺','药铺'][Math.floor(r()*8)],x);
    if(x%2)house(c,x+37,roadY(x)-290,95,70,30,'',x+12);
  }
  for(let x=1000;x<4650;x+=205){
    if(x>2920&&x<3420)continue;
    house(c,x,roadY(x,1)+245,110+r()*40,75+r()*45,35,['茶肆','客栈','木作','船坊'][Math.floor(r()*4)],x+2);
  }
  house(c,740,roadY(800)-66,163,193,43,'孙羊正店',1);
  house(c,1335,roadY(1400)-68,150,162,40,'锦绣绸庄',2);
  house(c,1920,roadY(2000)-66,165,167,44,'刘家茶坊',3);
  house(c,2755,roadY(2800)-65,130,106,38,'汴京驿站',8);
  house(c,3780,roadY(3800)-70,130,118,32,'漕运货栈',7);
  house(c,4540,roadY(4560)-70,112,78,30,'郊野茶棚',9);
  gate(c,440,roadY(440)-47);temple(c,2290,roadY(2300,1)+399);
  for(let x=2200;x<2820;x+=93)stall(c,x,roadY(x)-54,['#9e7761','#7e9280','#b19568'][Math.floor(r()*3)],x);
  for(let x=2950;x<3400;x+=114)stall(c,x,roadY(x,1)+100,['#7e9280','#ac8062'][Math.floor(r()*2)],x);
  for(let i=0;i<24;i++){
    const x=180+r()*5550,bank=i%2,y=riverY(x)+(bank?198:-191);if(x>2920&&x<3290||Math.abs(x-3600)<100)continue;
    tree(c,x,y,.65+r()*.3,true);
  }
  for(const x of [4760,5090,5480,5720])tree(c,x,roadY(x)-80,1.2);
  for(const x of [610,1260,1720,3970,4470,4890,5350])tree(c,x,roadY(x,1)+180,1.1);
  // A usable dock projects into the river from the north-bank footpath.
  const dy=roadY(3600);poly(c,[[3560,dy-10],[3640,dy-10],[3640,dy+160],[3560,dy+160]],'#bba47a');
  for(let y=dy;y<dy+160;y+=12)line(c,[[3560,y],[3640,y]],'#837554',1);
  for(const x of [3558,3642])for(const y of [dy+20,dy+150]){line(c,[[x,y+10],[x,y-18]],'#7c7352',6);ellipse(c,x,y-18,4,3,'#b4a47c',INK);}
  drawScenery(c,{house,roof,tree,temple,stall,poly,line,ellipse,label},tileX,TILE_WIDTH);
  // Fine cross-grain gives flat color the irregular surface of aged silk.
  c.globalAlpha=.12;
  for(let y=0;y<WORLD.height;y+=3)line(c,[[tileX,y],[tileX+TILE_WIDTH,y+r()*.6]],'#94805b',.35);
  for(let x=tileX;x<tileX+TILE_WIDTH;x+=4)line(c,[[x,0],[x,WORLD.height]],'#9c895f',.25);
  c.globalAlpha=1;
  for(let i=0;i<24000;i++){c.fillStyle=i%2?'#fffbe00f':'#655d3b10';c.fillRect(tileX+r()*TILE_WIDTH,r()*1700,1+r()*2,1);}
  return canvas;
}

function bridge(c,span=BRIDGE) {
  const point=t=>({x:span.a.x+(span.b.x-span.a.x)*t,y:span.a.y+(span.b.y-span.a.y)*t-Math.sin(t*Math.PI)*(span.height??BRIDGE_HEIGHT)});
  if(span!==BRIDGE){
    const stone=span.kind==='stone',deck=[];
    for(let i=0;i<=32;i++){const p=point(i/32);deck.push([p.x+34,p.y]);}
    for(let i=32;i>=0;i--){const p=point(i/32);deck.push([p.x+34,p.y+(stone?39:15)]);}
    poly(c,deck,stone?'#b5ad90':'#8d7e59','#7b795c');
    for(let i=0;i<32;i++){const a=point(i/32),b=point((i+1)/32);poly(c,[[a.x-33,a.y],[a.x+33,a.y],[b.x+33,b.y],[b.x-33,b.y]],stone?'#c6bea1':i%2?'#c2af82':'#b4a172','#92876a',.7);if(stone)line(c,[[a.x+34,a.y+2],[a.x+34,a.y+38]],'#8e896b',.8);}
    if(stone)for(const side of [-1,1]){
      const rail=[];for(let i=0;i<=24;i++){const p=point(i/24);rail.push([p.x+side*33,p.y-19]);line(c,[[p.x+side*33,p.y],[p.x+side*33,p.y-22]],'#aba58a',5);ellipse(c,p.x+side*33,p.y-24,3,3,'#b9b296','#86846c');}line(c,rail,'#9e9b80',4);
    }else for(const v of [.15,.4,.65,.86]){const p=point(v);for(const dx of [-27,30])line(c,[[p.x+dx,p.y-8],[p.x+dx,p.y+73]],'#8c7a55',5);line(c,[[p.x-34,p.y+20],[p.x+38,p.y+20]],'#70684a',4);}
    return;
  }
  const side=[];for(let i=0;i<=40;i++){const p=point(i/40);side.push([p.x+63,p.y]);}for(let i=40;i>=0;i--){const p=point(i/40);side.push([p.x+63,p.y+56]);}poly(c,side,'#927b53');
  for(const offset of [20,37,53]){const arch=[];for(let i=0;i<=40;i++){const p=point(i/40);arch.push([p.x+64,p.y+offset]);}line(c,arch,'#665a3e',6);}
  for(let i=0;i<36;i++){
    const p=point(i/36),q=point((i+1)/36);poly(c,[[p.x-62,p.y],[p.x+62,p.y],[q.x+62,q.y],[q.x-62,q.y]],i%2?'#c3ac7a':'#cbb684','#8e7c51',.6);
  }
  for(const side of [-1,1]){
    const rail=[];for(let i=0;i<=36;i++){const p=point(i/36);rail.push([p.x+side*62,p.y-23]);}line(c,rail,'#82704a',4);
    for(let i=0;i<=30;i++){const p=point(i/30);line(c,[[p.x+side*62,p.y],[p.x+side*62,p.y-27]],'#7a6a47',2.3);ellipse(c,p.x+side*62,p.y-29,2.5,1.7,'#9d885a');}
  }
  for(let i=1;i<14;i++){const a=point(i/14);line(c,[[a.x+64,a.y+4],[a.x+64,a.y+52]],'#6c5e40',4);}
  for(const v of [.17,.32,.65,.79]){const p=point(v);c.save();c.translate(p.x-62,p.y);c.scale(.56,.56);stall(c,-49,0,v<.5?'#b19e77':'#978f6c',Math.floor(v*100));c.restore();}
}
export function pedestrian(c,p,t,player=false) {
  drawFigure(c,{...p,y:p.y-bridgeLift(p)},t,player);
}
export function boat(c,p,t,player=false) {
  c.save();c.translate(p.x,p.y+Math.sin(t*2+p.seed)*1.5);if(p.dir<0)c.scale(-1,1);const s=player?.8:(p.hero?2.1:p.large?1.5:1);c.scale(s,s);
  ellipse(c,0,10,67,11,'#5f80782c');
  line(c,[[-72,14],[-95,14]],'#e0dfbd88',1);line(c,[[-69,20],[-114,20]],'#e0dfbd66',1);
  c.beginPath();c.moveTo(-62,-3);c.quadraticCurveTo(0,13,65,-12);c.lineTo(54,6);c.quadraticCurveTo(0,28,-53,15);c.closePath();c.fillStyle=player?'#627e70':'#806f4d';c.fill();c.strokeStyle='#5e6047';c.lineWidth=2;c.stroke();
  poly(c,[[-46,-1],[46,-6],[36,7],[-39,13]],'#b6a172');
  for(let x=-35;x<40;x+=11)line(c,[[x,-1],[x+2,10]],'#86734f',1);
  if(p.large){
    const variant=p.hero?0:p.seed%3;
    if(variant!==2){c.beginPath();c.moveTo(-31,0);c.quadraticCurveTo(-28,-48,9,-39);c.quadraticCurveTo(33,-32,33,-4);c.closePath();c.fillStyle=variant===1?'#a7a27d':'#c0ae7f';c.fill();c.strokeStyle='#706c4d';c.stroke();}
    for(let i=0;i<6;i++)line(c,[[-27+i*10,-29],[-28+i*11,-2]],'#7b7754',1);
    if(variant===0){
    c.save();c.translate(10,-14);c.rotate(p.mastAngle||0);c.translate(-10,14);
    line(c,[[10,-14],[10,-111]],'#73684c',3);poly(c,[[12,-105],[13,-40],[59,-47],[50,-92]],'#dad1ab','#9c9873');
    for(let j=0;j<5;j++)line(c,[[14,-98+j*12],[51+j,-88+j*10]],'#a5a17c',1);
    line(c,[[10,-108],[-48,-2]],'#8e8761',.6);line(c,[[10,-108],[55,-6]],'#8e8761',.6);c.restore();
    }
    if(variant===1){poly(c,[[-40,-36],[28,-41],[43,-29],[-32,-24]],'#7c8268','#656b50');for(let i=0;i<4;i++)line(c,[[-24+i*16,-23],[-23+i*16,-3]],'#625f45',1.4);}
    if(variant===2)for(let j=0;j<3;j++)for(let i=0;i<5;i++)ellipse(c,-30+i*14,-4-j*7,8,5,'#b6a57b','#85754e');
    drawFigure(c,{x:variant===2?-42:39,y:-1,dir:-1,color:'#89856b',seed:4,role:'traveller',moving:false},t);
    line(c,[[42,-20],[63,20]],'#7b6d4c',1.4);
  }else{
    c.save();c.translate(-27,0);pedestrian(c,{x:0,y:0,seed:3,color:player?'#9d4e39':'#7c7c5e',moving:false,hat:true},t);c.restore();
    line(c,[[-22,-17],[15+Math.sin(t*3)*8,36]],'#8b7b52',2);
    if(!player&&p.seed%3===1){c.beginPath();c.moveTo(-9,0);c.quadraticCurveTo(-9,-29,24,-24);c.quadraticCurveTo(43,-19,42,-4);c.fillStyle='#b4aa83';c.fill();c.strokeStyle='#827a56';c.stroke();for(let i=0;i<5;i++)line(c,[[-4+i*9,-15],[i*9,1]],'#7f7c59',.7);}
    else if(!player&&p.seed%3===2){for(let i=0;i<6;i++)line(c,[[4,-5],[12+i*6,11],[45,-6]],'#74856b88',.6);ellipse(c,27,-3,19,7,null,'#7b8260');}
    else if(p.seed%4===0)for(let i=0;i<3;i++)poly(c,[[3+i*9,-3],[10+i*9,-4],[12+i*9,-14],[4+i*9,-14]],'#ab956b','#756649',.65);
  }
  c.restore();
}

export class Scene {
  constructor(canvas) {
    this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.tiles=new Map();
    this.width=1;this.height=1;this.dpr=1;
    const r=random(87);
    this.npcs=Array.from({length:300},(_,i)=>({x:300+r()*(i<110?5400:WORLD.width-600),bank:i%4===0?1:0,seed:r()*100,speed:12+r()*23,dir:i%2?1:-1,color:COLORS[i%COLORS.length],role:OCCUPATIONS[i%OCCUPATIONS.length],hat:i%7===0,basket:i%17===0,moving:true}));
    this.ships=Array.from({length:34},(_,i)=>({seed:i*17,x:250+i*(WORLD.width-500)/34,y:0,lane:(i%3-1)*69,dir:i%2?1:-1,speed:15+i%5*3,large:i%4===0}));
    this.ships.push({hero:true,large:true,seed:0,x:3150,y:riverY(3150)+20,dir:1,speed:0,lane:20});
    this.figures=new FigureCache();this.eye=new EyeScene({tree,boat});this.update(0,0);
  }
  resize() {
    const box=this.canvas.getBoundingClientRect();this.width=box.width;this.height=box.height;this.dpr=Math.min(devicePixelRatio||1,1.35);this.canvas.width=Math.round(box.width*this.dpr);this.canvas.height=Math.round(box.height*this.dpr);
  }
  world(point,camera) { return { x:(point.x-this.width/2)/camera.zoom+camera.x,y:(point.y-this.height/2)/camera.zoom+camera.y }; }
  update(dt,t) {
    for(const n of this.npcs){n.x+=n.speed*n.dir*dt;if(n.x>WORLD.width-250||n.x<250)n.dir*=-1;n.y=roadY(n.x,n.bank)+Math.sin(n.seed)*29;}
    for(const s of this.ships){if(s.hero)s.x=3150+Math.sin(t*.07)*250;else s.x+=s.speed*s.dir*dt;if(s.x>WORLD.width-100)s.x=100;if(s.x<100)s.x=WORLD.width-100;s.y=riverY(s.x)+s.lane;s.mastAngle=s.large?Math.max(0,1-Math.abs(s.x-3200)/260)*1.4:0;}
    this.time=t;
  }
  draw(game) {
    if(game.view==='eye'){this.eye.draw(game,this);return;}
    const {camera,state,player,mode,boatRun,path,target}=game,c=this.c,t=this.time||0,w=this.width,h=this.height;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#e9dfc4';c.fillRect(0,0,w,h);
    c.translate(w/2,h/2);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);
    const left=camera.x-w/2/camera.zoom-150,right=camera.x+w/2/camera.zoom+150;
    const first=Math.max(0,Math.floor(left/TILE_WIDTH)),last=Math.min(Math.ceil(WORLD.width/TILE_WIDTH)-1,Math.floor(right/TILE_WIDTH));
    for(let i=first;i<=last;i++){
      if(!this.tiles.has(i))this.tiles.set(i,makeLand(i*TILE_WIDTH));
      c.drawImage(this.tiles.get(i),i*TILE_WIDTH,0);
    }
    for(const key of this.tiles.keys())if(key<first-1||key>last+1)this.tiles.delete(key);
    for(let x=Math.floor(left/55)*55;x<right;x+=55){for(let i=0;i<5;i++){
      const px=x+Math.sin(t*.4+i)*12,py=riverY(px)-104+i*47+Math.sin(x+t)*6;line(c,[[px,py],[px+12+Math.sin(x*.1+t)*7,py-1],[px+24,py]],'#7d886433',.55);
    }}
    for(const s of this.ships)if(s.x>left&&s.x<right)boat(c,s,t);
    const tow=this.ships.find(s=>s.hero);
    if(tow.x>left-300&&tow.x<right+300){
      const y=riverY(tow.x)-193;line(c,[[tow.x-101,tow.y-7],[tow.x-235,y-15],[tow.x-327,y-22]],'#7b7150',.7);
      for(let i=0;i<4;i++){const x=tow.x-245-i*25;drawFigure(c,{x,y:y-i*2,seed:i+1,dir:-1,color:i%2?'#8c8569':'#9f8d70',role:'traveller',moving:true},t);line(c,[[x-9,y-20-i*2],[x+10,y-23-i*2]],'#736548',1.2);}
    }
    if(mode==='boat'){
      for(const cargo of CARGO)if(!boatRun.collected.includes(cargo.id)){
        const y=cargo.y+Math.sin(t*3+cargo.id)*2;poly(c,[[cargo.x-12,y-10],[cargo.x+12,y-10],[cargo.x+12,y+9],[cargo.x-12,y+9]],'#aa9062','#6e6747',1);line(c,[[cargo.x-9,y-7],[cargo.x+9,y+6]],'#d8c299',1.3);line(c,[[cargo.x+9,y-7],[cargo.x-9,y+6]],'#d8c299',1.3);
      }
      boat(c,{...player,seed:0,dir:game.facing,large:false},t,true);
    }
    for(const span of BRIDGES)if(span.a.x<right&&span.b.x>left)bridge(c,span);
    drawLivingScenery(c,{line,ellipse,poly},t,left,right);
    for(const [i,base] of [650,1700,4020,9600,13500,16400].entries()){
      const x=base+Math.sin(t*.04+i)*140;
      if(x>left-140&&x<right+140){if(i%3===1)drawSedan(c,x,roadY(x)+21,t);else drawDonkey(c,x,roadY(x)+26,t,i%2===0);}
    }
    if(path.length&&mode==='walk'){
      c.setLineDash([3,11]);c.beginPath();c.moveTo(player.x,player.y-bridgeLift(player));for(const p of path)c.lineTo(p.x,p.y-bridgeLift(p));c.strokeStyle='#9b503b88';c.lineWidth=2;c.stroke();c.setLineDash([]);
    }
    if(target){const ty=target.y-bridgeLift(target);ellipse(c,target.x,ty,12+Math.sin(t*5)*2,6,null,'#98573b80');line(c,[[target.x-5,ty],[target.x+5,ty]],'#98573b');}
    for(const coin of COINS)if(!state.pickedCoins.includes(coin.id)&&coin.x>left&&coin.x<right){ellipse(c,coin.x,coin.y,3.5,2.2,'#ac945d','#8a7c48');c.fillStyle='#e9dfc4';c.fillRect(coin.x-.7,coin.y-.7,1.4,1.4);}
    for(const item of SOUVENIRS)if(!state.souvenirs.includes(item.id)){
      const y=item.y-8+Math.sin(t*2)*4;ellipse(c,item.x,item.y,19,7,'#b36e4b18');poly(c,[[item.x,y-18],[item.x+12,y-6],[item.x,y+7],[item.x-12,y-6]],'#a56b50','#e9d9ad',1.5);line(c,[[item.x,y+7],[item.x+5,y+17],[item.x,y+23]],'#89754c');label(c,'拾',item.x,y-27,12,'#8c5a40');
    }
    const people=this.npcs.filter(n=>n.x>left&&n.x<right);
    // Crossing pedestrians share the player's bridge elevation.
    for(const span of BRIDGES)if(span.a.x<right&&span.b.x>left)for(let i=0;i<(span===BRIDGE?24:9);i++){
      const v=((t*(i%2?-.012:.009)+i/24)%1+1)%1;
      people.push({x:span.a.x+(span.b.x-span.a.x)*v+(i%2?14:-14),y:span.a.y+(span.b.y-span.a.y)*v,seed:i,dir:i%2?1:-1,color:COLORS[i%6],role:OCCUPATIONS[i%12],moving:true,basket:i%8===0});
    }
    for(const p of POIS)people.push({...p,seed:2,color:p.color,moving:false,hat:p.type==='boat'});
    if(mode==='walk')people.push({...player,isPlayer:true,seed:0,dir:game.facing,moving:game.moving});
    people.sort((a,b)=>(a.y-bridgeLift(a))-(b.y-bridgeLift(b)));
    for(const p of people){if(p.isPlayer)pedestrian(c,p,t,true);else c.drawImage(this.figures.get(p,t),p.x-60,p.y-bridgeLift(p)-88);}
    if(mode==='walk'){
      const y=player.y-bridgeLift(player)-76;ellipse(c,player.x,y,13,13,'#95503b','#efe3bf');label(c,'我',player.x,y+5,15,'#fff0ca');poly(c,[[player.x-4,y+12],[player.x+4,y+12],[player.x,y+20]],'#95503b',null);
    }
    for(const p of POIS){
      if(p.x<left||p.x>right)continue;
      const active=p.id===(state.courierStarted&&state.delivered<3?['tea','silk','restaurant'][state.delivered]:'post');
      const y=p.y-bridgeLift(p)-65+Math.sin(t*2+p.x)*2;
      line(c,[[p.x,y+8],[p.x,y+18]],p.color,1);ellipse(c,p.x,y,active?13:10,active?13:10,active?'#9e4e36':'#f1e6c9',p.color);label(c,p.type==='boat'?'舟':p.type==='courier'?'驿':p.type==='sight'?'景':'商',p.x,y+4,active?12:10,active?'#f5e7c5':p.color);
    }
    // Willows, shop flags, cooking smoke and birds are live geometry, not images.
    for(let i=Math.floor(left/220);i<right/220;i++){
      const x=i*220+87;if(x<100||x>WORLD.width-100||BRIDGES.some(b=>x>b.a.x-100&&x<b.b.x+100))continue;
      const y=riverY(x)-190;
      for(let j=0;j<8;j++){
        c.beginPath();c.moveTo(x-40+j*11,y-95+Math.sin(j)*9);c.quadraticCurveTo(x-45+j*11+Math.sin(t*1.8+j)*9,y-43,x-38+j*11+Math.sin(t*1.8+j)*14,y-12+Math.sin(j)*15);c.strokeStyle='#79895180';c.lineWidth=1.5;c.stroke();
      }
    }
    for(const x of [900,1490,2090,2890,3870,4620])if(x>left&&x<right){
      const y=roadY(x)-100;line(c,[[x,y],[x,y-144]],'#7b7653',2);c.beginPath();c.moveTo(x,y-144);c.bezierCurveTo(x+22,y-146+Math.sin(t*2)*4,x+43,y-128+Math.sin(t*2)*5,x+48,y-141);c.lineTo(x+47,y-104);c.bezierCurveTo(x+23,y-91+Math.sin(t*2)*7,x+18,y-108,x,y-105);c.closePath();c.fillStyle=x===2090?'#7d8f79':'#a47355';c.fill();c.strokeStyle='#806f4e';c.lineWidth=.8;c.stroke();label(c,x===2090?'茶':'酒',x+22,y-118,18,'#e9dcbb');
      for(let j=0;j<3;j++){const py=y-100-((t*16+j*23)%80);ellipse(c,x-60+Math.sin(t+j)*9,py,7+j*3,5+j*2,'#f4edda39');}
    }
    for(let i=0;i<10;i++){
      const x=((t*22+i*1881)%(WORLD.width+200))-100,y=320+Math.sin(t*.25+i)*78;
      if(x<left||x>right)continue;const flap=Math.sin(t*7+i)*5;line(c,[[x-9,y+flap],[x,y],[x+9,y+flap]],'#6d745a88',1.5);
    }
    for(let i=0;i<7;i++){
      const x=4700+i*128+Math.sin(t*.9+i)*16,y=roadY(x)+20+Math.sin(t*.8+i)*13;
      ellipse(c,x,y,7,4,'#d9d4b2','#8c8864');line(c,[[x+4,y-1],[x+8,y-9]],'#d9d4b2',3);ellipse(c,x+9,y-10,3,3,'#e4dcb8');line(c,[[x+11,y-10],[x+15,y-9]],'#ad8a56',2);
    }
    if(game.particles)for(const p of game.particles){ellipse(c,p.x,p.y,2,2,`rgba(174,111,57,${clamp(p.life,0,1)})`);}
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    if(mode==='boat'){
      const goal=CARGO.filter(q=>!boatRun.collected.includes(q.id)).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
      if(goal){const x=clamp((goal.x-camera.x)*camera.zoom+w/2,68,w-90),y=clamp((goal.y-camera.y)*camera.zoom+h/2-48,96,h-165),a=Math.atan2(goal.y-player.y,goal.x-player.x);ellipse(c,x,y,21,21,'#eadbbbec','#965b3b');c.save();c.translate(x,y);c.rotate(a);poly(c,[[12,0],[-7,-8],[-3,0],[-7,8]],'#93543c',null);c.restore();label(c,`货箱 · ${Math.ceil(Math.hypot(goal.x-player.x,goal.y-player.y)/20)} 步`,x,y+37,13,'#684f39');}
    }
  }
}
