import { riverY, roadY } from './game.js';
import { drawFigure, drawDonkey } from './figures.js';

function seed(n){let v=n>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
export function drawScenery(c,d,left,width){
  const {house,roof,tree,temple,stall,poly,line,ellipse,label}=d;
  const visible=(x,pad=400)=>x>left-pad&&x<left+width+pad;
  function barrel(x,y,s=1){
    c.save();c.translate(x,y);c.scale(s,s);poly(c,[[-9,0],[-12,-18],[-8,-25],[8,-25],[12,-18],[9,0]],'#b29d72','#726a4c',.7);ellipse(c,0,-25,8,3,'#c0ad82','#726a4c');for(const yy of [-5,-19])line(c,[[-10,yy],[10,yy]],'#6e6a4c',1.3);for(const xx of [-5,0,5])line(c,[[xx,-22],[xx,0]],'#8e7c56',.6);c.restore();
  }
  function basket(x,y){poly(c,[[x-12,y],[x-15,y-18],[x+15,y-18],[x+12,y]],'#b29e6c','#786b4a');ellipse(c,x,y-18,15,4,'#ad9b6b','#786b4a');for(let i=-10;i<=10;i+=4)line(c,[[x+i,y-17],[x+i*.8,y]],'#796e4b88',.6);for(let i=-13;i<14;i+=7)ellipse(c,x+i*.7,y-20,4,3,'#b1a27c','#877452');}
  function wall(x,y,w){poly(c,[[x,y],[x+w,y],[x+w,y-47],[x,y-47]],'#c6b791','#8b8262',.8);roof(c,x-2,y-48,w+4,12,12,'#8b8b73');for(let xx=6;xx<w;xx+=22)for(let yy=8;yy<45;yy+=11)line(c,[[x+xx,y-yy],[x+xx+16,y-yy]],'#97896b50',.5);}
  function thatch(x,y,w=130){house(c,x,y,w,67,24,'',x);poly(c,[[x-15,y-70],[x+w*.4,y-124],[x+w+27,y-77],[x+w+12,y-61]],'#ad9b6b','#796f4d');for(let i=0;i<w+25;i+=4)line(c,[[x+w*.4+(i-w*.4)*.2,y-115],[x+i-5,y-65]],'#776a453f',.7);barrel(x-14,y+2,.85);basket(x+w+34,y-8);}
  function pine(x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);line(c,[[0,0],[-6,-48],[7,-103],[2,-154]],'#777653',5);for(let i=0;i<6;i++){const yy=-50-i*17,dx=(i%2?1:-1)*(40-i*4);line(c,[[0,yy+12],[dx,yy-7]],'#777653',2);for(let j=0;j<7;j++){const px=dx-25+j*8;line(c,[[px,yy],[px-10,yy-8],[px-3,yy-5],[px-4,yy-15]],'#73805b99',1);}}c.restore();}
  function bamboo(x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);for(let i=0;i<5;i++){const dx=i*11,top=-120-i%3*25;line(c,[[dx,0],[dx+8,top]],'#7e8a5d',2);for(let yy=-12;yy>top;yy-=17){line(c,[[dx+yy/(-19)-2,yy],[dx+yy/(-19)+3,yy]],'#b5ba86',1);if(yy%3===0)for(let j=0;j<4;j++){const z=(j%2?1:-1);line(c,[[dx+4,yy],[dx+4+z*22,yy-18]],'#7c895b',.9);poly(c,[[dx+8+z*7,yy-8],[dx+10+z*20,yy-15],[dx+9+z*11,yy-5]],'#8c9767',null);}}}c.restore();}
  function gateway(x,y){
    for(const dx of [-88,-59,59,88]){line(c,[[x+dx,y],[x+dx,y-111]],'#896b48',4);line(c,[[x+dx-3,y-102],[x+dx+3,y-102]],'#c9b383',2);}
    for(const yy of [-78,-102])line(c,[[x-94,y+yy],[x+94,y+yy]],'#7e6545',5);
    for(let i=-84;i<=84;i+=14){ellipse(c,x+i,y-102,5,5,'#a17950','#776044');line(c,[[x+i,y-96],[x+i,y-83]],'#a68d60',1);}
    for(const dx of [-71,71]){ellipse(c,x+dx,y-67,8,11,'#a47853','#7b6545');line(c,[[x+dx,y-55],[x+dx,y-43]],'#9a7951',1);}
    roof(c,x-52,y-110,104,25,12,'#8b8266');label(c,'正店',x,y-85,11,'#5e5942');
  }
  // The city is layered rather than a row of identical, isolated shop boxes.
  for(let x=650;x<4450;x+=171){if(!visible(x))continue;const r=seed(x);house(c,x,roadY(x)-306,90+r()*50,61+r()*64,34,'',x);if(x<2200){wall(x-15,roadY(x)-170,145);tree(c,x+95,roadY(x)-200,.65);}}
  for(const x of [780,1300,1850,2350,2680,3900,4160])if(visible(x)){
    const y=roadY(x)-55;barrel(x-20,y);barrel(x-38,y-4,.8);basket(x+16,y+3);line(c,[[x+51,y-6],[x+105,y-6]],'#927c56',3);line(c,[[x+56,y-6],[x+56,y+6]],'#786a4c',2);line(c,[[x+100,y-6],[x+100,y+6]],'#786a4c',2);
    for(const dx of [10,100]){line(c,[[x+dx,y-88],[x+dx,y-68]],'#786447',.8);ellipse(c,x+dx,y-61,6,9,'#a37750','#7c6848');line(c,[[x+dx,y-53],[x+dx,y-47]],'#aa8f5a',1);}
  }
  if(visible(820))gateway(820,roadY(820)-45);
  if(visible(2330)){wall(2110,roadY(2300,1)+220,350);pine(2120,roadY(2300,1)+202,.8);pine(2445,roadY(2300,1)+204,.8);}
  for(const x of [2820,3240,3470])if(visible(x)){
    const y=roadY(x)-60;stall(c,x,y,'#b1a482',x);basket(x+70,y);barrel(x+86,y,.7);
    if(x===3240){poly(c,[[x+22,y-60],[x+43,y-75],[x+87,y-66],[x+65,y-52]],'#ae9a72','#847553');}
  }
  // Shipwrights' bank: skeletal hulls, lumber, sheds and rope cranes.
  for(let x=6030;x<7950;x+=255){if(!visible(x))continue;const y=roadY(x);house(c,x,y-92,155,80,47,'船作',x);for(let j=0;j<6;j++){line(c,[[x-32,y-38-j*4],[x+53,y-38-j*4]],'#9b875b',4);ellipse(c,x+54,y-38-j*4,3,2,'#c0ad7b','#7a6e4b');}barrel(x+181,y-73,1.1);}
  for(const x of [6290,6880,7510])if(visible(x)){
    const y=riverY(x)-168;
    poly(c,[[x-105,y-4],[x+100,y-26],[x+86,y+15],[x-85,y+27]],'#8c785020','#8c7850',1.3);
    for(let i=0;i<12;i++){const px=x-87+i*15;line(c,[[px,y+13],[px-9,y-8],[px+8,y-35]],'#8d7750',3);}
    for(const dx of [-50,30]){line(c,[[x+dx,y+40],[x+dx+9,y+5]],'#82714d',4);}
    line(c,[[x+112,y-8],[x+111,y-115],[x+65,y-156]],'#85744e',6);line(c,[[x+111,y-115],[x+160,y-143]],'#85744e',4);line(c,[[x+66,y-156],[x+67,y-58]],'#766b4b',1);ellipse(c,x+67,y-59,8,4,null,'#766b4b');
  }
  // Irrigated farms and mill houses: uneven paddies, foot bunds and straw roofs.
  for(let x=8080;x<10600;x+=206){if(!visible(x))continue;const r=seed(x);for(let row=0;row<3;row++){
    const y=210+row*118;poly(c,[[x,y],[x+161,y+r()*10],[x+194,y-75],[x+31,y-81]],row===1?'#b8b48b':'#adaf8255','#8c956b66');
    for(let i=12;i<159;i+=13)for(let j=0;j<4;j++){const px=x+i+j*7,py=y-j*17;line(c,[[px,py],[px-3,py-9],[px+1,py-4],[px+4,py-11]],'#84945f99',.7);}
  }}
  for(const x of [8250,8940,9600,10240])if(visible(x)){thatch(x,roadY(x)-89,130);tree(c,x+165,roadY(x)-145,.8);wall(x-25,roadY(x)-55,190);}
  if(visible(8700)){house(c,8610,roadY(8700)-58,170,130,45,'水磨',8);line(c,[[8750,riverY(8700)-128],[8750,riverY(8700)-55]],'#8e805a',8);}
  // Bamboo temple precinct: a distinct walled compound and a tiered stone pagoda.
  for(let x=10820;x<12820;x+=91)if(visible(x)){const r=seed(x);bamboo(x,roadY(x)-75-r()*70,.8+r()*.7);if(x%3===0)pine(x-20,roadY(x)-234,1.1);}
  if(visible(12000,650)){
    const y=roadY(12000,1)+380;temple(c,12000,y);wall(11690,y-40,180);wall(12150,y-40,205);for(const x of [11690,11800,12220,12310])pine(x,y-110,1.15);gateway(12000,y-7);
    for(let i=0;i<6;i++){const yy=y-i*45;poly(c,[[12430-i*3,yy],[12500+i*3,yy],[12496+i*3,yy-40],[12434-i*3,yy-40]],'#b5b091','#878468');roof(c,12423-i*3,yy-40,85+i*6,20,16,'#858974');if(i<5)poly(c,[[12460,yy-8],[12473,yy-8],[12473,yy-31],[12460,yy-31]],'#777b61');}
  }
  // Country fair: cloth canopies, a theatre, pottery, food, tethered livestock.
  for(let x=13100;x<15400;x+=133){if(!visible(x))continue;const y=roadY(x)-65;stall(c,x,y,['#a5916c','#889378','#a48969'][Math.floor(x/133)%3],x);basket(x+72,y-3);if(x%2)barrel(x-20,y,.7);if(x%3)thatch(x+35,y-196,115);}
  if(visible(14500)){
    const y=roadY(14500)-75;
    poly(c,[[14395,y],[14605,y],[14605,y-18],[14395,y-18]],'#a08960','#796b49');
    for(const x of [14400,14600])line(c,[[x,y],[x,y-143]],'#846f49',4);
    roof(c,14387,y-145,224,43,30,'#8c8667');poly(c,[[14407,y-28],[14593,y-28],[14593,y-136],[14407,y-136]],'#a09170','#7a6a4a');
    for(const x of [14415,14580]){line(c,[[x,y-132],[x+5,y-44]],'#bea67a',9);line(c,[[x,y-131],[x-4,y-54]],'#8c6c50',4);}
    label(c,'春 社 百 戏',14502,y-112,16,'#e5d4ac');
  }
  // Quiet outer scroll: thatched farmsteads, winding fences and early-spring groves.
  for(let x=15570;x<17800;x+=347){if(!visible(x))continue;const y=roadY(x)-100;thatch(x,y,115);thatch(x+135,y-91,87);for(let i=0;i<10;i++){const px=x-40+i*26,py=y+40+Math.sin(i)*5;line(c,[[px,py],[px,py-22]],'#9a8c5d',1.4);if(i)line(c,[[px-26,py-8],[px,py-8]],'#9a8c5d',1.2);}tree(c,x+246,y+35,1.1,true);pine(x+68,y-160,1.1);}
  // Hand-laid shoreline stones and reed beds break the regular river band.
  for(let x=Math.floor(left/73)*73;x<left+width+80;x+=73){const r=seed(x+30);const y=riverY(x)+(x%2?1:-1)*(150+r()*22);for(let i=0;i<4;i++){const px=x+i*6;line(c,[[px,y],[px-4,y-18-r()*13]],'#8c956666',.7);}}
}

export function drawLivingScenery(c,d,t,left,right){
  const {line,ellipse,poly}=d;
  if(left<8850&&right>8520){
    const x=8750,y=riverY(8700)-99;
    c.save();c.translate(x,y);c.scale(1,.82);c.rotate(t*.36);
    for(const radius of [55,67])ellipse(c,0,0,radius,radius,null,'#776d4c');
    for(let i=0;i<14;i++){const a=i*Math.PI/7;line(c,[[0,0],[Math.cos(a)*66,Math.sin(a)*66]],'#81714b',3);c.save();c.translate(Math.cos(a)*66,Math.sin(a)*66);c.rotate(a);poly(c,[[0,-9],[16,-9],[16,9],[0,9]],'#a69062','#736947');c.restore();}ellipse(c,0,0,9,9,'#a28d61','#6c6648');c.restore();
    for(let i=0;i<5;i++)ellipse(c,x+Math.sin(t*7+i)*25,y+63+(t*30+i*12)%26,7,1.5,'#e3dbb880');
  }
  for(const x of [6330,6890,7510])if(x>left&&x<right){
    const y=roadY(x)-20;drawFigure(c,{x,y,seed:x,color:'#8c856c',role:'farmer',hat:true,moving:false},t);
    const angle=Math.sin(t*3)*.6;line(c,[[x+12,y-24],[x+24+angle*15,y-42-angle*15]],'#7b6746',2);line(c,[[x+21+angle*15,y-42-angle*15],[x+31+angle*15,y-42-angle*15]],'#696a54',5);
  }
  if(left<14600&&right>14400){
    const y=roadY(14500)-96;
    for(const dx of [-45,0,45]){
      drawFigure(c,{x:14500+dx,y:y+Math.sin(t*2+dx)*2,seed:Math.abs(dx)+3,color:dx===0?'#966b4e':'#8a8870',role:dx===0?'woman':'scholar',moving:true},t);
      if(dx===0){const a=t*2;line(c,[[14513,y-24],[14513+Math.cos(a)*25,y-36+Math.sin(a)*18]],'#b29b6e',1);ellipse(c,14513+Math.cos(a)*25,y-36+Math.sin(a)*18,5,5,null,'#a98756');}
    }
  }
  // Pack animals, oxen and kites make the countryside a different place to visit.
  for(const base of [5220,10020,16400,17220]){
    if(base<left-200||base>right+200)continue;
    for(let i=0;i<3;i++){const x=base+i*84+Math.sin(t*.15)*30;drawDonkey(c,x,roadY(x)+29,t+i,false);}
    const x=base-25,y=roadY(base)-110;
    line(c,[[x,y],[x+50+Math.sin(t)*12,y-125]],'#8b805a99',.6);
    const px=x+50+Math.sin(t)*12,py=y-125+Math.cos(t)*6;
    poly(c,[[px,py-18],[px+19,py-4],[px,py+15],[px-19,py-4]],'#9c8161','#776b4e');line(c,[[px-19,py-4],[px+19,py-4]],'#d3c09a',1);line(c,[[px,py-18],[px,py+15]],'#d3c09a',1);line(c,[[px,py+15],[px+Math.sin(t*3)*7,py+34],[px+Math.sin(t*3-1)*8,py+48]],'#9c8260',.8);
  }
  for(const base of [8350,9660,15900])if(base>left-100&&base<right+100){
    const x=base+Math.sin(t*.2)*35,y=roadY(base)-178;ellipse(c,x,y-10,25,12,'#777b60','#64684d');ellipse(c,x+26,y-18,11,8,'#777b60','#64684d');for(const dx of [-16,-7,12,20])line(c,[[x+dx,y-5],[x+dx+Math.sin(t*3+dx)*2,y+12]],'#64694f',3);line(c,[[x+25,y-23],[x+20,y-30],[x+28,y-28]],'#b4b18e',2);line(c,[[x+31,y-23],[x+37,y-28],[x+34,y-20]],'#b4b18e',2);line(c,[[x-24,y-13],[x-30,y+1]],'#64694f',1.4);
  }
}
