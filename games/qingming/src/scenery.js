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
  function pine(x,y,s=1){
    c.save();c.translate(x,y);c.scale(s,s);const r=seed(x+y);
    c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-15,-47,13,-77,3,-141);c.strokeStyle='#777653';c.lineWidth=5;c.stroke();
    for(let i=0;i<5;i++){const yy=-48-i*22,dx=(i%2?1:-1)*(40-i*5);line(c,[[1,yy+12],[dx,yy-4]],'#777653',2);for(let j=0;j<18;j++){const px=dx-26+r()*52,py=yy-7+r()*12;ellipse(c,px,py,5+r()*8,2+r()*3,j%2?'#74805b70':'#89916a88');line(c,[[px,py],[px-3,py-5],[px+2,py-2]],'#61734f55',.5);}}
    c.restore();
  }
  function bamboo(x,y,s=1){
    c.save();c.translate(x,y);c.scale(s,s);const r=seed(x*3+y);
    for(let i=0;i<6;i++){
      const dx=i*9,top=-112-r()*65,lean=-17+r()*34;
      line(c,[[dx,0],[dx+lean*.5,top*.5],[dx+lean,top]],'#7a865a',1.7);
      for(let yy=-15;yy>top;yy-=20){const base=dx+lean*yy/top;line(c,[[base-2,yy],[base+2,yy]],'#c2bf8d',1);if(yy<top*.45)for(const side of [-1,1]){
        const bx=base+side*(17+r()*17),by=yy-8-r()*12;line(c,[[base,yy],[bx,by]],'#738353',.65);
        for(let j=0;j<5;j++){const f=j/5,px=base+(bx-base)*f,py=yy+(by-yy)*f,ex=px+side*(10+r()*12),ey=py-7+r()*18;c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(ex,ey-5,ex+side*4,ey);c.quadraticCurveTo(px+side*8,py+3,px,py);c.fillStyle=j%2?'#7d8e5d99':'#95a06e99';c.fill();}
      }}
    }c.restore();
  }
  function shed(x,y,w,h,canvas=false){
    poly(c,[[x,y],[x+w,y],[x+w+28,y-19],[x+28,y-19]],'#a6966c44',null);
    poly(c,[[x+18,y-11],[x+w+15,y-11],[x+w+15,y-h],[x+18,y-h]],'#877b5b');
    for(const dx of [0,w/2,w])line(c,[[x+dx,y+2],[x+dx,y-h]],'#7e6a49',4);
    if(canvas)poly(c,[[x-13,y-h],[x+w*.45,y-h-37],[x+w+39,y-h-18],[x+w+11,y-h+8]],'#b7aa82','#837650');else roof(c,x-5,y-h,w+15,35,30,'#8f8b6d');
    line(c,[[x-7,y-h],[x+w+8,y-h]],'#7e6a49',4);
  }
  function well(x,y){ellipse(c,x,y+3,22,8,'#96865f44');poly(c,[[x-17,y],[x+17,y],[x+17,y-19],[x-17,y-19]],'#aaa080','#837955');ellipse(c,x,y-19,18,7,'#676e54','#c5b88d');for(const dx of [-22,22])line(c,[[x+dx,y],[x+dx,y-70]],'#7e704b',3);line(c,[[x-26,y-70],[x+26,y-70]],'#7e704b',4);line(c,[[x,y-70],[x,y-24]],'#8b805a',.8);barrel(x+36,y,.6);}
  function haystack(x,y,w=45){c.beginPath();c.moveTo(x-w,y);c.bezierCurveTo(x-w*.8,y-28,x-w*.5,y-65,x,y-68);c.bezierCurveTo(x+w*.6,y-66,x+w*.7,y-30,x+w,y);c.closePath();c.fillStyle='#b7a475';c.fill();c.strokeStyle='#897c53';c.lineWidth=.7;c.stroke();for(let i=-w;i<w;i+=5)line(c,[[x+i*.2,y-60],[x+i,y-4]],'#8b7d5150',.6);line(c,[[x-w*.7,y-27],[x+w*.7,y-27]],'#88784f',1.4);}
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
  // Work yards have different trades, open structures and interrupted rooflines.
  for(const [x,w,offset,cover] of [[6090,205,-108,true],[6620,138,-178,false],[7290,268,-80,true],[7770,95,-210,false]])if(visible(x)){
    const y=roadY(x)+offset;shed(x,y,w,76+(x%3)*14,cover);
    for(let j=0;j<7;j++){const xx=x-36+j*17;line(c,[[xx,y+33],[xx+83,y+13]],'#9b875b',5);ellipse(c,xx,y+33,3,2,'#c7b585','#7d6b49');}
    for(const dx of [w+30,w+55]){barrel(x+dx,y+10,.8);ellipse(c,x+dx,y-36,14,14,null,'#93835d');ellipse(c,x+dx,y-36,10,10,null,'#93835d');}
    if(w>200){line(c,[[x+30,y-45],[x+w-25,y-45]],'#b2a277',2);for(let j=0;j<5;j++)line(c,[[x+55+j*25,y-45],[x+40+j*25,y-12]],'#c4b18a',3);}
  }
  for(const [x,size,planked] of [[6310,1.2,false],[6990,1.65,true],[7660,.85,false]])if(visible(x,600)){
    const y=riverY(x)-165;c.save();c.translate(x,y);c.scale(size,size);
    poly(c,[[-106,-11],[101,-30],[88,11],[-88,25]],'#ad986550','#88724c',1.2);
    if(planked)for(let i=0;i<8;i++)line(c,[[-93+i*3,15-i*5],[91-i,-2-i*4]],'#a08a5c',2);
    for(let i=0;i<12;i++){const px=-89+i*16;line(c,[[px,15],[px-9,-7],[px+7,-36]],'#84704b',2.5);}
    for(const dx of [-60,35])line(c,[[dx,41],[dx+9,6]],'#82714d',5);
    line(c,[[112,3],[111,-115],[65,-156]],'#85744e',5);line(c,[[111,-115],[160,-143]],'#85744e',4);line(c,[[66,-156],[67,-58]],'#766b4b',1);ellipse(c,67,-59,8,4,null,'#766b4b');c.restore();
  }
  if(visible(7050)){const y=roadY(7050)-220;house(c,7060,y,130,120,35,'',32);wall(6840,y+10,170);for(let i=0;i<9;i++)ellipse(c,6880+i*17,y-12,7,13,'#ad9771','#81714e');}
  // Irrigated farms and mill houses: uneven paddies, foot bunds and straw roofs.
  for(let i=0;i<19;i++){
    const r=seed(i*901+4),x=8050+r()*2400,y=165+r()*315,w=85+r()*180,h=40+r()*45;
    if(!visible(x))continue;poly(c,[[x,y],[x+w,y+11],[x+w+35,y-h],[x+23,y-h-8]],i%2?'#afb18b55':'#b9b18b66','#89946b55');
    for(let u=12;u<w-10;u+=13)for(let v=0;v<h-10;v+=15){const px=x+u+v*.4,py=y-v;line(c,[[px,py],[px-3,py-8],[px+1,py-3],[px+4,py-10]],'#83935f88',.7);}
  }
  for(const [x,w,off] of [[8160,119,-160],[9520,170,-130],[10170,83,-220]])if(visible(x)){const y=roadY(x)+off;thatch(x,y,w);tree(c,x+w+92,y-35,.9,true);wall(x-25,y+30,w+40);haystack(x-83,y+12,32);if(w>120){shed(x+210,y+29,105,66,true);well(x+174,y+65);}}
  if(visible(8700,600)){
    const y=riverY(8700);house(c,8420,y-130,170,153,42,'水磨',8);
    poly(c,[[8585,y-200],[8750,y-135],[8760,y-124],[8585,y-185]],'#a99a71','#7e7453');
    for(let i=0;i<5;i++){const xx=8600+i*32;line(c,[[xx,y-184+i*12],[xx,y-112]],'#86754f',3);}
    line(c,[[8594,y-99],[8750,y-99]],'#756a48',7);for(let i=0;i<5;i++){barrel(8340+i*25,y-115,.8);basket(8380+i*19,y-155);}
  }
  // Bamboo temple precinct: a distinct walled compound and a tiered stone pagoda.
  for(let x=10910;x<12700;x+=137)if(visible(x)){const r=seed(x);bamboo(x,roadY(x)-90-r()*60,.8+r()*.5);if(x%3===0)pine(x-20,roadY(x)-234,1.1);}
  if(visible(12000,650)){
    const y=roadY(12000,1)+176;
    poly(c,[[11650,y+25],[12400,y+25],[12440,y-100],[11690,y-100]],'#c5b99255','#afa27e55');
    temple(c,12000,y);wall(11690,y-8,180);wall(12150,y-8,205);for(const x of [11650,11800,12270,12360])pine(x,y-60,.9);gateway(12000,y+45);
    for(const x of [11340,11510,11820,12180,12480,12640])bamboo(x,roadY(x,1)+160,.9+(x%3)*.1);
    house(c,11530,y+75,105,58,30,'',78);well(11720,y+55);line(c,[[11990,y+45],[11950,roadY(12000,1)+24]],'#bca77788',26);
    for(let i=0;i<6;i++){const yy=y-i*45;poly(c,[[12430-i*3,yy],[12500+i*3,yy],[12496+i*3,yy-40],[12434-i*3,yy-40]],'#b5b091','#878468');roof(c,12423-i*3,yy-40,85+i*6,20,16,'#858974');if(i<5)poly(c,[[12460,yy-8],[12473,yy-8],[12473,yy-31],[12460,yy-31]],'#777b61');}
  }
  // Country fair: cloth canopies, a theatre, pottery, food, tethered livestock.
  for(let i=0;i<13;i++){const x=13130+i*170+Math.sin(i*4)*38;if(!visible(x))continue;const y=roadY(x)-60-(i%4===0?95:0);if(i%3===0){shed(x,y,110,65,true);for(let j=0;j<4;j++)barrel(x+j*21,y-5,.7+j%2*.2);}else{stall(c,x,y,['#a5916c','#889378','#a48969'][i%3],x);basket(x+72,y-3);}if(i%4===1)thatch(x+21,y-205,90+i%3*17);}
  if(visible(14500)){
    const y=roadY(14500)-75;
    poly(c,[[14395,y],[14605,y],[14605,y-18],[14395,y-18]],'#a08960','#796b49');
    for(const x of [14400,14600])line(c,[[x,y],[x,y-143]],'#846f49',4);
    roof(c,14387,y-145,224,43,30,'#8c8667');poly(c,[[14407,y-28],[14593,y-28],[14593,y-136],[14407,y-136]],'#a09170','#7a6a4a');
    for(const x of [14415,14580]){line(c,[[x,y-132],[x+5,y-44]],'#bea67a',9);line(c,[[x,y-131],[x-4,y-54]],'#8c6c50',4);}
    label(c,'春 社 百 戏',14502,y-112,16,'#e5d4ac');
  }
  // Quiet outer scroll: thatched farmsteads, winding fences and early-spring groves.
  for(const [x,w,off,kind] of [[15740,144,-145,0],[16450,96,-230,1],[17200,182,-112,2]])if(visible(x,700)){
    const y=roadY(x)+off;
    if(kind===1){shed(x,y,135,93,false);haystack(x+210,y+45,53);haystack(x+269,y+30,35);}else{thatch(x,y,w);if(kind===2)house(c,x+125,y-120,87,90,25,'',23);else thatch(x-135,y-68,70);}
    const fence=[];for(let i=0;i<11;i++){const px=x-60+i*29,py=y+70+Math.sin(i*.4)*10;fence.push([px,py-11]);line(c,[[px,py],[px,py-25]],'#9b8c61',1.3);}line(c,fence,'#9b8c61',1.4);
    well(x+w+70,y+26);tree(c,x-75,y+35,1.2,true);tree(c,x+w+140,y-76,.85);if(kind!==1)haystack(x-55,y-22,30);
    for(let j=0;j<4;j++){line(c,[[x+15+j*24,y+34],[x+28+j*24,y+3]],'#8c8055',1);ellipse(c,x+21+j*24,y+21,10,6,'#c1ad7c','#8c8055');}
  }
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
  for(const [base,count] of [[5220,3],[10020,1],[16400,0],[17220,1]]){
    if(base<left-200||base>right+200)continue;
    for(let i=0;i<count;i++){const x=base+i*74+Math.sin(t*.15)*30;c.save();c.translate(x,roadY(x)+36+(i%2)*9);c.scale(1-i*.1,1-i*.1);drawDonkey(c,0,0,t+i,base===10020);c.restore();}
    const x=base-25,y=roadY(base)-110;
    line(c,[[x,y],[x+50+Math.sin(t)*12,y-125]],'#8b805a99',.6);
    const px=x+50+Math.sin(t)*12,py=y-125+Math.cos(t)*6;
    poly(c,[[px,py-18],[px+19,py-4],[px,py+15],[px-19,py-4]],'#9c8161','#776b4e');line(c,[[px-19,py-4],[px+19,py-4]],'#d3c09a',1);line(c,[[px,py-18],[px,py+15]],'#d3c09a',1);line(c,[[px,py+15],[px+Math.sin(t*3)*7,py+34],[px+Math.sin(t*3-1)*8,py+48]],'#9c8260',.8);
  }
  for(const base of [8350,9660,15900])if(base>left-100&&base<right+100){
    const x=base+Math.sin(t*.2)*35,y=roadY(base)+68;ellipse(c,x,y-10,25,12,'#777b60','#64684d');ellipse(c,x+26,y-18,11,8,'#777b60','#64684d');for(const dx of [-16,-7,12,20])line(c,[[x+dx,y-5],[x+dx+Math.sin(t*3+dx)*2,y+12]],'#64694f',3);line(c,[[x+25,y-23],[x+20,y-30],[x+28,y-28]],'#b4b18e',2);line(c,[[x+31,y-23],[x+37,y-28],[x+34,y-20]],'#b4b18e',2);line(c,[[x-24,y-13],[x-30,y+1]],'#64694f',1.4);
  }
  for(const base of [15780,16580,17400])if(base>left-100&&base<right+100){
    const y=roadY(base)+48;
    drawFigure(c,{x:base+12,y,seed:2,role:'woman',color:'#948675',moving:false},t);
    drawFigure(c,{x:base-35+Math.sin(t)*8,y:y+17,seed:7,role:'child',color:'#a59776',moving:true},t);
    for(let i=0;i<4;i++){const x=base+50+i*13+Math.sin(t*.8+i)*5,yy=y+19+Math.sin(i)*12;ellipse(c,x,yy-4,4,3,i%2?'#a99c78':'#c3b58d','#8d805b');ellipse(c,x+4,yy-8,2,2,'#b2a17b');line(c,[[x,yy-1],[x-1,yy+3],[x+2,yy+2]],'#8d805b',.7);}
    const x=base-65;ellipse(c,x,y+14,13,6,'#aaa48b','#7b7d61');ellipse(c,x+13,y+8,5,4,'#aaa48b','#7b7d61');for(const dx of [-8,7])line(c,[[x+dx,y+16],[x+dx,y+25]],'#7b7d61',1.5);line(c,[[x-12,y+12],[x-20,y+7],[x-18,y+2]],'#7b7d61',1.2);
  }
  if(left<12400&&right>11600){
    for(const [dx,role] of [[-160,'elder'],[-90,'monk'],[55,'woman'],[230,'scholar']]){
      const x=12000+dx,y=roadY(x,1)+45;drawFigure(c,{x,y,seed:dx+180,color:role==='monk'?'#9a8c68':'#86866b',role,moving:role!=='monk'},t);
    }
  }
}
