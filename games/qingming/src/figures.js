const INK='#55503d', SKIN='#cbbb98';
function line(c,pts,color=INK,w=.8){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function shape(c,pts,fill,stroke=INK,w=.65){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function oval(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.65;c.stroke();}}
export const OCCUPATIONS=['traveller','porter','scholar','woman','farmer','monk','merchant','guard','child','elder','hawker','fisher'];
export function drawFigure(c,p,t,player=false){
  const role=player?'traveller':p.role||OCCUPATIONS[Math.abs(Math.floor(p.seed||0))%OCCUPATIONS.length];
  const dir=p.dir||1, moving=p.moving, phase=t*(p.role==='child'?12:8)+(p.seed||0),step=moving?Math.sin(phase):0;
  const bob=moving?Math.abs(Math.sin(phase))*.65:Math.sin(t*1.3+(p.seed||0))*.25;
  const woman=role==='woman',long=woman||role==='scholar'||role==='monk'||role==='elder';
  const cloth=player?'#87513b':p.color||'#85816a',trim=player?'#b5a17a':'#b2a082';
  c.save();c.translate(p.x,p.y);const scale=(player?1.18:1)*(role==='child'?.72:1);c.scale(scale,scale);
  oval(c,0,1,10,2.5,'#58503825');
  if(player){oval(c,0,0,13,5,null,'#8b513d');oval(c,0,0,16,6,null,'#e9dfc190');}
  c.scale(dir,1);c.lineJoin='round';c.lineCap='round';
  // Jointed legs, fabric cuffs and low cloth shoes remain visible below the robe.
  for(const side of [-1,1]){
    const swing=side*step*3.8,hip=side*3;
    shape(c,[[hip-2,-14],[hip+2,-14],[hip+swing+2,-5],[hip+swing+1,-1],[hip+swing-2,-1],[hip+swing-3,-6]],long?'#92896e':'#9d957b');
    line(c,[[hip+swing-2,-3],[hip+swing+2,-3]],'#d4c7a7',1.4);
    oval(c,hip+swing+1,0,3.5,1.3,'#494b3c');
  }
  c.translate(0,-bob);
  const hem=long?-5:-12;
  c.beginPath();c.moveTo(-5,-33);c.quadraticCurveTo(-8,-24,-8+(step*.5),hem);c.quadraticCurveTo(0,hem+2,9+step*.4,hem-1);c.lineTo(5,-33);c.closePath();c.fillStyle=cloth;c.fill();c.strokeStyle=INK;c.lineWidth=.7;c.stroke();
  // Cross collar, sash and ink folds distinguish robes from flat silhouettes.
  shape(c,[[-4,-33],[0,-26],[5,-33],[3,-34],[0,-30],[-2,-34]],'#d3c7a5');
  line(c,[[-3,-31],[3,-25],[2,-15]],'#4f503e99',.75);
  line(c,[[-7,-21],[7,-21]],trim,2.4);line(c,[[3,-20],[6,-12],[4,-8]],'#6d5d43',.8);
  for(const dx of [-5,-1,4])line(c,[[dx,-18],[dx+step*.35,hem+2]],'#4f503d70',.65);
  if(woman){shape(c,[[-5,-21],[5,-21],[10,-5],[-9,-5]],'#ad9880');for(let i=-6;i<=6;i+=3)line(c,[[i*.5,-18],[i,-6]],'#77644f',.55);}
  const arm=step*3;
  // Wide sleeves taper to wrists, with a visible hand and elbow crease.
  for(const side of [-1,1]){
    const handY=-20+side*arm;
    shape(c,[[side*4,-32],[side*8,-30],[side*12,handY-1],[side*8,handY+3],[side*5,-25]],cloth);
    line(c,[[side*7,-28],[side*9,handY]],'#4f503d88',.65);line(c,[[side*9,handY+1],[side*11,handY]],'#d0bea0',1.8);
  }
  // A small three-quarter profile: ear, nose, eyebrow, eye and hairline.
  c.beginPath();c.moveTo(-3,-43);c.bezierCurveTo(0,-47,5,-45,5,-41);c.lineTo(6,-38);c.lineTo(4.9,-37.5);c.quadraticCurveTo(4,-33,0,-34);c.lineTo(-3,-37);c.closePath();c.fillStyle=SKIN;c.fill();c.strokeStyle=INK;c.lineWidth=.65;c.stroke();
  oval(c,-3,-39,1.2,1.8,SKIN,INK);line(c,[[2,-41],[4,-40.5]],INK,.6);oval(c,3.5,-39.5,.6,.55,INK);line(c,[[3,-35.5],[4.5,-35.5]],'#8b7458',.5);
  c.beginPath();c.moveTo(-4,-38);c.bezierCurveTo(-6,-46,1,-48,5,-44);c.lineTo(5,-42);c.quadraticCurveTo(1,-44,-2,-41);c.closePath();c.fillStyle='#454c3e';c.fill();
  if(role==='monk'){oval(c,0,-42,4.5,4.5,SKIN,INK);for(let i=0;i<7;i++)oval(c,Math.cos(i*.45)*4,-30+Math.sin(i*.45)*6,.8,.8,'#675b41');}
  else if(woman){oval(c,-3,-46,3.5,3,'#444a3c');oval(c,2,-47,2,2,'#444a3c');line(c,[[-6,-46],[5,-48]],'#ad9d73',.8);line(c,[[-5,-39],[-6,-30]],'#4e5140',1.4);}
  else if(role==='scholar'||role==='merchant'){shape(c,[[-5,-43],[-5,-49],[3,-49],[6,-44]],'#4c5446');line(c,[[-8,-44],[10,-44]],'#494d3f',1.5);}
  else if(p.hat||role==='farmer'||role==='fisher'){shape(c,[[-11,-43],[0,-51],[13,-43],[3,-41]],'#bdab7d');for(let i=-8;i<11;i+=3)line(c,[[0,-49],[i,-43]],'#8d805d66',.55);line(c,[[-3,-41],[0,-34],[5,-42]],'#7a7652',.55);}
  else{oval(c,-1,-46,2.6,2.2,'#464d3e');line(c,[[-4,-44],[4,-44]],'#8c8465',.8);}
  if(role==='elder'){shape(c,[[0,-36],[4,-35],[1,-27],[-2,-33]],'#bcb9a0','#8c8c72',.4);line(c,[[12,-22],[14,0]],'#756246',1.4);}
  if(role==='guard'){shape(c,[[-7,-31],[7,-31],[8,-13],[-8,-13]],'#7b7661');for(let y=-28;y<-12;y+=3)line(c,[[-6,y],[7,y]],'#b2a17c',.65);line(c,[[14,-48],[14,-1]],'#655b40',1.6);shape(c,[[14,-54],[11,-47],[16,-47]],'#92917c');}
  if(role==='scholar'){c.save();c.translate(11,-19);c.rotate(-.2);shape(c,[[0,0],[12,-10],[16,-5],[14,2]],'#c6b992');for(let i=1;i<5;i++)line(c,[[0,0],[7+i*2,-9+i*2]],'#8b8362',.55);c.restore();}
  if(player){
    line(c,[[-6,-30],[5,-17]],'#c7b58e',1.8);shape(c,[[-10,-31],[-1,-29],[-2,-15],[-11,-17]],'#a9956a');
    for(let y=-28;y<-15;y+=3)line(c,[[-10,y],[-2,y+1]],'#6b654b',.6);for(let x=-9;x<-1;x+=2)line(c,[[x,-29],[x-1,-16]],'#756c4e',.5);
    line(c,[[-9,-31],[-10,-37]],'#d0c09a',1.5);line(c,[[-6,-31],[-5,-38]],'#c4b68e',1.5);
  }
  if(p.basket||role==='porter'||role==='hawker'){
    line(c,[[-23,-31],[25,-37]],'#716144',1.7);
    for(const x of [-22,23]){line(c,[[x,-33],[x,-14]],'#7e7453',.8);shape(c,[[x-6,-15],[x+7,-15],[x+5,-6],[x-5,-6]],'#b09a6a');for(let j=-3;j<5;j+=3)line(c,[[x+j,-14],[x+j,-7]],'#7f7654',.5);line(c,[[x-5,-10],[x+5,-10]],'#7f7654',.6);}
  }
  if(role==='fisher'){line(c,[[11,-20],[25,-52],[36,-61]],'#7e7050',1);line(c,[[36,-61],[40,-11]],'#938565',.4);}
  if(role==='farmer'){line(c,[[10,-26],[20,0]],'#776344',1.4);line(c,[[17,-2],[24,-4]],'#615e47',2);}
  if(role==='merchant'){shape(c,[[10,-20],[17,-20],[17,-12],[10,-12]],'#a68a5d');line(c,[[11,-20],[12,-24],[16,-24],[17,-20]],'#786349',.7);}
  c.restore();
}

export function drawDonkey(c,x,y,t,cart=false){
  c.save();c.translate(x,y);const step=Math.sin(t*6);
  oval(c,0,1,29,5,'#625b3a20');
  for(const [dx,phase] of [[-17,1],[-10,-1],[14,-1],[20,1]])line(c,[[dx,-14],[dx+step*phase*5,-2],[dx+step*phase*6,0]],'#696956',3);
  c.beginPath();c.moveTo(-23,-16);c.bezierCurveTo(-28,-36,8,-34,20,-29);c.lineTo(26,-45);c.lineTo(37,-43);c.lineTo(41,-31);c.lineTo(34,-25);c.lineTo(29,-12);c.closePath();c.fillStyle='#8d8d75';c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();
  line(c,[[28,-44],[27,-57]],'#6b6e57',3);line(c,[[33,-44],[35,-56]],'#6b6e57',3);oval(c,35,-39,1,1,INK);line(c,[[35,-32],[41,-32]],'#5d604a',1);line(c,[[-23,-25],[-32,-15],[-33,-8]],'#66694f',1.7);
  shape(c,[[-17,-32],[13,-32],[16,-18],[-19,-18]],'#8a6750');for(const dx of [-14,9]){shape(c,[[dx,-33],[dx+11,-33],[dx+11,-22],[dx,-22]],'#b6a378');line(c,[[dx+5,-33],[dx+5,-22]],'#7b6e4b',1);}
  if(cart){line(c,[[-13,-20],[-58,-13]],'#86704a',2);line(c,[[-10,-16],[-62,-7]],'#86704a',2);shape(c,[[-104,-15],[-53,-15],[-56,-27],[-100,-27]],'#ac9568');for(const dx of [-94,-64]){oval(c,dx,-2,10,10,'#ae9b6c',INK);for(let a=0;a<8;a++){const v=a*Math.PI/4+t*1.8;line(c,[[dx,-2],[dx+Math.cos(v)*9,-2+Math.sin(v)*9]],'#6b6549',.8);}}for(const dx of [-94,-76])shape(c,[[dx,-28],[dx+17,-28],[dx+16,-41],[dx+2,-42]],'#b5a17a');}
  c.restore();
}

export function drawSedan(c,x,y,t){
  line(c,[[x-45,y-22],[x+48,y-24]],'#7a6545',3);
  drawFigure(c,{x:x-42,y,dir:1,color:'#8e8165',seed:8,moving:true,role:'porter'},t);
  drawFigure(c,{x:x+42,y:y-1,dir:1,color:'#887a61',seed:8,moving:true,role:'porter'},t);
  shape(c,[[x-20,y-18],[x+23,y-18],[x+18,y-60],[x-16,y-60]],'#8a7355');
  shape(c,[[x-25,y-58],[x+27,y-58],[x+18,y-68],[x-14,y-68]],'#a38c63');
  shape(c,[[x-12,y-53],[x+13,y-53],[x+12,y-27],[x-11,y-27]],'#c5b087');
  for(let i=-10;i<14;i+=4)line(c,[[x+i,y-52],[x+i,y-29]],'#938260',.7);line(c,[[x-12,y-42],[x+13,y-42]],'#938260',.7);
}
