import { WIDTH, HEIGHT, ARENA, PALETTE as C, COMBO, BULLET, DASH, PLAYER_DASH } from './config.js';
import { cardRect, CARD } from './upgrades.js';
export class Renderer {
 constructor(canvas) {
  this.ctx=canvas.getContext('2d');this.canvas=canvas;this.rt=0;this.stateT=0;this.bossT=2;this.glows=new Map();
  const surface=()=>{const a=document.createElement('canvas');a.width=WIDTH;a.height=HEIGHT;return a;};
  this.nebula=surface();const n=this.nebula.getContext('2d');n.fillStyle='#06040f';n.fillRect(0,0,WIDTH,HEIGHT);
  for(const [x,y,r,rgb,a] of [[300,180,520,'167,139,250',.10],[1020,620,560,'34,211,238',.07],[980,140,380,'244,113,181',.05],[180,660,420,'167,139,250',.06]]){const g=n.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);n.fillStyle=g;n.fillRect(0,0,WIDTH,HEIGHT);}
  this.vignette=surface();const v=this.vignette.getContext('2d'),g=v.createRadialGradient(640,400,340,640,400,920);g.addColorStop(0,'rgba(3,2,10,0)');g.addColorStop(1,'rgba(3,2,10,.62)');v.fillStyle=g;v.fillRect(0,0,WIDTH,HEIGHT);
  let seed=7319;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  this.stars=[100,50].map((count,layer)=>Array.from({length:count},()=>({x:random()*WIDTH,y:random()*HEIGHT,r:layer?1.7:1,phase:random()*Math.PI*2})));
  for(const color of [C.cyan,C.echo,C.red,C.text,C.white,C.gold])this.glow(color);
 }
 glow(color){if(!this.glows.has(color)){const a=document.createElement('canvas');a.width=a.height=128;const c=a.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(.18,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,128,128);this.glows.set(color,a);}return this.glows.get(color);}
 glowAt(x,y,size,color,alpha=1){const c=this.ctx;c.save();c.globalAlpha*=alpha;c.drawImage(this.glow(color),x-size/2,y-size/2,size,size);c.restore();}
 round(x,y,w,h,r=10){const c=this.ctx;r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
 panel(x,y,w,h){const c=this.ctx;this.round(x,y,w,h);c.fillStyle='rgba(10,8,24,.55)';c.fill();c.lineWidth=1;c.strokeStyle='rgba(190,180,255,.16)';c.stroke();this.line(x+10,y+1,x+w-10,y+1,'rgba(255,255,255,.07)');}
 label(value,x,y,size=10,color=C.muted,align='left',spacing=2,weight=600){this.text(value,x,y,size,color,align,weight,spacing);}
 num(value,x,y,size=26,color=C.text,align='center'){this.text(value,x,y,size,color,align,800,0,true);}
 bar(x,y,w,h,f,color){const c=this.ctx;this.round(x,y,w,h,h/2);c.fillStyle='#292335';c.fill();if(f>0){this.round(x,y,w*Math.min(1,Math.max(0,f)),h,h/2);c.fillStyle=color;c.fill();}}
 inside(m,r){return m.x>=r.x&&m.x<=r.x+r.w&&m.y>=r.y&&m.y<=r.y+r.h;}

 text(value,x,y,size=18,color=C.text,align='left',weight=600,spacing=0,mono=false) {const c=this.ctx;c.font=`${weight} ${size}px ${mono?'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace':'"Avenir Next","Segoe UI",system-ui,sans-serif'}`;c.textAlign=align;c.fillStyle=color;if('letterSpacing' in c)c.letterSpacing=`${spacing}px`;c.fillText(value,x+(align==='center'?spacing/2:0),y);if('letterSpacing' in c)c.letterSpacing='0px';}
 line(x,y,x2,y2,color,width=1) {const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 draw(game) {
  const now=performance.now();const dt=this.lastNow===undefined?0:Math.min(.05,Math.max(0,(now-this.lastNow)/1000));this.lastNow=now;this.rt+=dt;this.stateT+=dt;this.bossT+=dt;
  if(this.lastState===undefined){this.lastState=game.state;this.stateT=2;this.changed=false;}else if(this.lastState!==game.state){this.lastState=game.state;this.stateT=0;this.changed=true;}
  const boss=game.enemies.find(e=>e.kind==='warden'&&!e.dead);if(boss&&game.state==='playing'&&boss!==this.bossRef){this.bossRef=boss;this.bossT=0;}
  const c=this.ctx,scale=this.canvas.width/WIDTH;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,WIDTH,HEIGHT);c.drawImage(this.nebula,0,0);
  c.save();this.stars.forEach((layer,i)=>{for(const star of layer){c.globalAlpha=(i?.35:.18)*( .7+.3*Math.sin(this.rt*.7+star.phase));c.fillStyle=i?C.text:C.echo;c.fillRect((star.x+this.rt*(i?5:2))%WIDTH,star.y,star.r,star.r);}});c.restore();
  c.save();c.translate(Math.sin(game.time*99)*game.shake,Math.cos(game.time*113)*game.shake);
  this.floor(this.rt);
  c.save();c.beginPath();c.rect(ARENA.left,ARENA.top,ARENA.right-ARENA.left,ARENA.bottom-ARENA.top);c.clip();
  game.echoes.draw(c,game.time);
  for(const spawn of game.director.pending)if(spawn.timer<0.85){const pulse=1-spawn.timer/0.85;c.strokeStyle=C.red;c.globalAlpha=0.5+Math.sin(game.time*25)*0.25;c.lineWidth=2;c.beginPath();c.arc(spawn.x,spawn.y,12+24*pulse,0,Math.PI*2);c.stroke();this.line(spawn.x-9,spawn.y,spawn.x+9,spawn.y,C.red);this.line(spawn.x,spawn.y-9,spawn.x,spawn.y+9,C.red);c.globalAlpha=1;}
  this.bullets(game.bullets.active);
  for(const enemy of game.enemies)this.enemy(enemy,game.time);
  for(const g of game.afterimages){c.save();c.translate(g.x,g.y);c.rotate(g.angle);c.globalAlpha=0.35*(g.life/PLAYER_DASH.ghostLife);c.strokeStyle=C.cyan;c.lineWidth=2;c.beginPath();c.moveTo(21,0);c.lineTo(-14,-13);c.lineTo(-8,0);c.lineTo(-14,13);c.closePath();c.stroke();c.restore();}
  if(game.state!=='title'&&game.player.hp>0)this.player(game);
  game.particles.draw(c);c.restore();c.restore();
  c.drawImage(this.vignette,0,0);
  this.hud(game);
  if(boss&&(game.state==='playing'||game.state==='upgrade')){this.label('WARDEN // 守望者',430,140,10,C.magenta,'left',2);const g=c.createLinearGradient(430,0,850,0);g.addColorStop(0,C.magenta);g.addColorStop(1,C.red);this.bar(430,146,420,10,boss.hp/boss.maxHp,g);c.strokeStyle='rgba(190,180,255,.16)';c.strokeRect(430,146,420,10);for(let i=1;i<14;i++)this.line(430+i*30,146,430+i*30,156,'rgba(8,6,20,.85)',2);}
  if(game.banner>0&&game.state==='playing'){c.save();const a=Math.min(1,game.banner);c.globalAlpha=a;this.label(`WAVE ${String(game.director.wave).padStart(2,'0')}`,640,195,40,C.text,'center',6,850);this.line(360-60*a,181,440,181,C.echo);this.line(840,181,920+60*a,181,C.echo);this.label('THE PAST IS CATCHING UP',640,222,11,C.echo,'center',3);c.restore();}
  if(game.state==='playing'&&this.bossT<1.2)this.bossIntro();
  if(game.redFlash>0){const g=c.createRadialGradient(WIDTH/2,HEIGHT/2,220,WIDTH/2,HEIGHT/2,700);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(248,70,80,${game.redFlash})`);c.fillStyle=g;c.fillRect(0,0,WIDTH,HEIGHT);}
  if(game.state==='upgrade')this.upgrade(game);
  if(game.state==='title')this.title(game);
  if(game.state==='paused')this.paused();
  if(game.state==='gameover')this.gameover(game);
  if(this.changed&&this.stateT<.28){c.fillStyle=`rgba(0,0,0,${.85*(1-this.stateT/.28)})`;c.fillRect(0,0,WIDTH,HEIGHT);}
 }
 floor(time) {
  const c=this.ctx,a=ARENA;c.save();
  c.fillStyle='rgba(8,6,20,.88)';c.fillRect(a.left,a.top,a.right-a.left,a.bottom-a.top);
  c.strokeStyle='rgba(143,137,170,.075)';c.lineWidth=1;c.beginPath();for(let x=a.left;x<a.right;x+=40){c.moveTo(x,a.top);c.lineTo(x,a.bottom);}for(let y=a.top;y<a.bottom;y+=40){c.moveTo(a.left,y);c.lineTo(a.right,y);}c.stroke();
  c.strokeStyle=C.echo;c.lineWidth=5;c.globalAlpha=.16;c.strokeRect(a.left,a.top,a.right-a.left,a.bottom-a.top);c.lineWidth=1.5;c.globalAlpha=.5+.25*Math.sin(time*1.4);c.strokeRect(a.left,a.top,a.right-a.left,a.bottom-a.top);c.globalAlpha=1;
  const corners=[[a.left,a.top,1,1],[a.right,a.top,-1,1],[a.left,a.bottom,1,-1],[a.right,a.bottom,-1,-1]];
  for(const [x,y,sx,sy]of corners){this.line(x,y,x+sx*35,y,C.cyan,3);this.line(x,y,x,y+sy*35,C.cyan,3);}
  c.globalAlpha=0.2;this.text('E C H O   /   T E S T   C H A M B E R',WIDTH/2,a.bottom-20,11,C.echo,'center');c.restore();
 }
 bullets(bullets) {
  const c=this.ctx;c.save();c.globalCompositeOperation='lighter';
  for(const b of bullets){const live=b.kind==='live',burst=b.kind==='burst',hostile=b.kind==='hostile',dx=Math.cos(b.angle),dy=Math.sin(b.angle);c.globalAlpha=live||hostile?1:burst?0.95:0.48;this.glowAt(b.x,b.y,live?26:22,hostile?C.red:burst?C.text:live?C.cyan:C.echo,.65);
   const gradient=c.createLinearGradient(b.x,b.y,b.x-dx*BULLET.trail,b.y-dy*BULLET.trail);gradient.addColorStop(0,hostile?C.red:live?C.cyan:C.echo);gradient.addColorStop(1,'transparent');this.line(b.x,b.y,b.x-dx*BULLET.trail,b.y-dy*BULLET.trail,gradient,live?4:3);
   c.fillStyle=hostile?'#fecaca':burst?'#ffffff':live?C.white:C.echo;c.beginPath();c.arc(b.x,b.y,live?3.5:4,0,Math.PI*2);c.fill();
  }c.restore();
 }
 enemy(e,time) {
  const c=this.ctx;c.save();c.translate(e.x,e.y);
  if(e.kind==='warden'){
   this.glowAt(0,0,230,C.echo,.30);c.rotate(time*0.3);c.strokeStyle=e.flash>0?C.white:e.color;c.lineWidth=3.5;c.fillStyle='#1d1030';
   for(const r of [e.radius,e.radius*0.62]){c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;if(i===0)c.moveTo(Math.cos(a)*r,Math.sin(a)*r);else c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.save();c.globalAlpha*=.16;c.lineWidth=6;c.stroke();c.restore();c.stroke();c.rotate(-time*0.5);}
   c.fillStyle=e.color;c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.restore();return;
  }
  if(e.kind==='dasher'&&e.phase==='charge'){c.save();c.rotate(e.angle);c.globalAlpha=0.2+0.45*(1-e.timer/DASH.charge);c.setLineDash([9,9]);this.line(0,0,600,0,C.red,2);c.restore();}
  if(e.kind==='dasher'&&e.phase==='dash'){c.save();c.rotate(e.angle);const trail=c.createLinearGradient(-12,0,-125,0);trail.addColorStop(0,C.red);trail.addColorStop(1,'transparent');c.globalAlpha=0.55;this.line(-12,0,-125,0,trail,13);c.restore();}
  c.rotate(e.kind==='splitter'?time*0.25:e.angle);c.strokeStyle=e.flash>0?C.white:e.color;c.fillStyle=e.flash>0?'#ffffff':'#241023';c.lineWidth=2.5;
  if(e.kind==='dasher'&&e.phase==='charge')c.globalAlpha=0.65+0.35*Math.sin(time*22);
  c.beginPath();
  if(e.kind==='splitter'){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.lineTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);}}
  else if(e.kind==='dasher'){c.moveTo(25,0);c.lineTo(-17,-16);c.lineTo(-7,0);c.lineTo(-17,16);}
  else {c.moveTo(e.radius,0);c.lineTo(0,e.radius);c.lineTo(-e.radius,0);c.lineTo(0,-e.radius);}
  c.closePath();c.fill();c.save();c.globalAlpha*=.16;c.lineWidth=6;c.strokeStyle=e.color;c.stroke();c.restore();c.stroke();c.fillStyle=e.color;c.fillRect(-3,-3,6,6);
  if(e.kind==='splitter'){c.globalAlpha=0.65;c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.stroke();}c.restore();
 }
 player(game) {
  const p=game.player,c=this.ctx;if(p.invincible>0&&Math.floor(game.time*16)%2===0)return;
  this.glowAt(p.x,p.y,90,C.cyan,.35);c.save();c.translate(p.x,p.y);c.rotate(p.angle);
  const engine=18+Math.sin(game.time*40)*5+Math.hypot(p.vx,p.vy)*0.035;
  const flame=c.createLinearGradient(-12,0,-12-engine,0);flame.addColorStop(0,C.cyan);flame.addColorStop(1,'transparent');c.fillStyle=flame;c.beginPath();c.moveTo(-10,-6);c.lineTo(-12-engine,0);c.lineTo(-10,6);c.fill();
  c.shadowBlur=14;c.shadowColor=C.cyan;c.strokeStyle=C.white;c.fillStyle='#126077';c.lineWidth=2;c.beginPath();c.moveTo(21,0);c.lineTo(-14,-13);c.lineTo(-8,0);c.lineTo(-14,13);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
  this.line(31,0,47,0,C.cyan,1);c.restore();
  if(p.invincible>0){c.save();c.globalAlpha=0.35;c.strokeStyle=C.cyan;c.beginPath();c.arc(p.x,p.y,27,0,Math.PI*2);c.stroke();c.restore();}
  const m=game.input.mouse;c.save();c.globalAlpha=0.7;c.strokeStyle=C.white;c.beginPath();c.arc(m.x,m.y,7,0,Math.PI*2);c.stroke();this.line(m.x-12,m.y,m.x-9,m.y,C.cyan);this.line(m.x+9,m.y,m.x+12,m.y,C.cyan);c.restore();
 }
 hud(game) {
  this.panel(42,22,300,56);this.label('ECHO / ARENA',58,47,15,C.text,'left',2,800);this.label('DELAYED FIRE. IMMEDIATE CONSEQUENCES.',58,66,8.5,C.muted,'left',1.5);
  this.panel(510,22,260,56);this.label('SCORE',640,41,9,C.muted,'center',3);this.num(String(game.score).padStart(6,'0'),640,70);
  this.panel(938,22,300,56);this.label(`WAVE ${String(game.director.wave).padStart(2,'0')}`,1222,47,15,C.text,'right',1,800);this.label(`${game.echoes.nodes.length} / ${game.echoes.cap} ECHOES`,1222,66,10.5,C.echo,'right',1);
  if(game.comboChain>=2&&['playing','upgrade'].includes(game.state)){const m=Math.min(1+Math.floor(game.comboChain/COMBO.perTier),COMBO.maxTier),color=m>=4?C.gold:C.echo;this.text(`COMBO ×${m} · ${game.comboChain} CHAIN`,640,103,15,color,'center',800);this.bar(560,110,160,4,game.comboTimer/COMBO.window,color);}
  if(game.state!=='title'){this.panel(42,726,250,52);this.label('HULL',58,748,9);for(let i=0;i<3;i++){this.round(104+i*27,739,19,8,3);this.ctx.fillStyle=i<game.player.hp?C.cyan:'#292335';this.ctx.fill();}this.label('DASH',58,769,9);this.bar(104,762,120,5,1-game.dashCd/PLAYER_DASH.cooldown,C.cyan);this.text('CYAN IS YOURS / VIOLET IS YOUR PAST',640,787,10.5,C.echo,'center');}
  this.text(`P PAUSE · M ${game.sound.muted?'UNMUTE':'MUTE'}`,1238,787,10.5,C.muted,'right');
 }
 veil(alpha=.8){const c=this.ctx;c.fillStyle=`rgba(6,4,15,${alpha})`;c.fillRect(0,0,WIDTH,HEIGHT);}
 bossIntro(){const c=this.ctx,t=this.bossT;let a=t<.3?t/.3:t<.85?1:(1.2-t)/.35;a=a*a*(3-2*a);c.save();c.fillStyle='rgba(3,2,10,.94)';c.fillRect(0,0,WIDTH,58*a);c.fillRect(0,HEIGHT-58*a,WIDTH,58*a);c.globalAlpha=a;this.line(0,58*a,WIDTH,58*a,C.magenta);this.line(0,HEIGHT-58*a,WIDTH,HEIGHT-58*a,C.magenta);this.label('WARDEN AWAKENS',640,396,30,C.text,'center',8,900);this.label('守 望 者 苏 醒',640,424,13,C.magenta,'center',6);c.restore();}
 title(game){
  const c=this.ctx;this.veil(.55);c.save();for(let i=0;i<3;i++){const r=(this.rt*90+i*150)%450;c.globalAlpha=.16*(1-r/450);c.strokeStyle=i===2?C.cyan:C.echo;c.lineWidth=1.5;c.beginPath();c.arc(640,430,r,0,Math.PI*2);c.stroke();}c.restore();
  this.label('S U R V I V E   Y O U R   O W N   E C H O',640,196,12,C.cyan,'center',6);
  c.save();c.shadowColor=C.echo;c.shadowBlur=34;this.label('ECHO ARENA',640,300,96,'rgba(167,139,250,.55)','center',10,900);c.restore();this.label('ECHO ARENA',640,300,96,C.text,'center',10,900);
  this.label('回 声 战 场',640,352,30,C.echo,'center',12);this.line(532,384,748,384,'#544276');c.save();c.translate(640,384);c.rotate(Math.PI/4);c.fillStyle=C.echo;c.fillRect(-3,-3,6,6);c.restore();
  this.text('你最大的敌人，是三秒前的你自己。',640,428,22,C.text,'center');this.text('Your deadliest enemy is you, three seconds ago.',640,456,15,C.muted,'center');
  this.label('玩法 · HOW IT WORKS',150,505,11,C.cyan,'left',3);this.label('操作 · CONTROLS',690,505,11,C.cyan,'left',3);
  // Wrap these two complete instructions within their magazine column.
  const instructions=['01 — Every shot leaves an echo. It replays every 3 s — and it can kill you.','02 — Shoot your own echo nodes to detonate them. The blast never harms you.'];
  instructions.forEach((line,i)=>{const words=line.split(' ');let row='',y=529+i*39;for(const word of words){c.font='500 13.5px "Avenir Next","Segoe UI",system-ui,sans-serif';if(c.measureText(row+' '+word).width>440){this.text(row,150,y,13.5,C.text,'left',500);row=word;y+=17;}else row+=(row?' ':'')+word;}this.text(row,150,y,13.5,C.text,'left',500);});
  ['WASD / ARROWS — MOVE','MOUSE — AIM · HOLD CLICK — FIRE','SHIFT / SPACE — DASH · P — PAUSE · M — MUTE'].forEach((v,i)=>this.text(v,690,531+i*26,13.5,C.text,'left',500));
  const hover=this.inside(game.input.mouse,{x:490,y:606,w:300,h:56});if(hover)this.glowAt(640,634,390,C.cyan,.18);this.round(490,606,300,56,28);c.fillStyle=`rgba(34,211,238,${hover?.16:.08})`;c.fill();c.strokeStyle=hover?C.white:C.cyan;c.lineWidth=1.5;c.stroke();this.label('CLICK TO START',640,641,19,C.text,'center',4,800);
  this.label(game.best>0?`PERSONAL BEST  ${game.best.toLocaleString()}`:'FIRE. MOVE. REMEMBER.',640,700,12,C.muted,'center',2);
 }
 upgrade(game){
  const c=this.ctx;this.veil(.8);this.glowAt(350,430,700,C.echo,.10);this.glowAt(930,430,700,C.echo,.10);
  this.label(`WAVE ${String(game.director.wave).padStart(2,'0')} CLEARED`,640,225,30,C.text,'center',4,900);this.label('选择强化 · CHOOSE AN UPGRADE',640,258,14,C.echo,'center',3);
  const colors={twin:C.cyan,deep:C.echo,cryo:'#a5f3fc',overclock:C.gold,pierce:C.text,resonant:C.echo,repair:C.gold};
  for(const [i,choice]of game.choices.entries()){const r=cardRect(i),cx=r.x+CARD.w/2,n=game.upgrades[choice.id],color=colors[choice.id]||C.echo,hover=this.inside(game.input.mouse,r),t=Math.max(0,Math.min(1,(this.stateT-i*.09)/.35)),p=1-(1-t)**3;
   c.save();c.translate(0,(1-p)*18-(hover?6:0));c.globalAlpha=p;this.round(r.x,r.y,r.w,r.h,14);c.fillStyle='rgba(18,14,38,.90)';c.strokeStyle=hover?color:'rgba(190,180,255,.28)';c.lineWidth=1;if(hover){c.shadowBlur=18;c.shadowColor=color;}c.fill();c.stroke();c.shadowBlur=0;
   c.save();this.round(r.x,r.y,r.w,r.h,14);c.clip();c.fillStyle=color;c.fillRect(r.x,r.y,r.w,5);c.restore();
   this.num(String(i+1),r.x+22,r.y+30,13,color);if(n>0){this.round(r.x+r.w-103,r.y+14,88,23,12);c.strokeStyle=C.gold;c.stroke();this.label(`OWNED ×${n}`,r.x+r.w-59,r.y+30,10,C.gold,'center',0);}
   this.upgradeIcon(choice.icon,cx,r.y+74,color);this.label(choice.name,cx,r.y+128,19,C.text,'center',1,800);this.text(choice.cn,cx,r.y+152,14,C.echo,'center');
   const lines=[];let line='';for(const word of choice.desc.split(' ')){if(line&&(line+' '+word).length>26&&lines.length<1){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);for(let j=0;j<lines.length;j++)this.text(lines[j],cx,r.y+178+j*16,12.5,C.muted,'center');c.restore();
  }this.label('CLICK A CARD OR PRESS 1 · 2 · 3',640,600,12,C.muted,'center',2);
 }
 upgradeIcon(kind,cx,cy,color=C.cyan) {
  const c=this.ctx;c.save();c.translate(cx,cy);c.strokeStyle=color;c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';c.beginPath();
  if(kind==='twin'){for(const y of [-10,10]){c.moveTo(-22,y);c.lineTo(22,y);c.moveTo(13,y-7);c.lineTo(22,y);c.lineTo(13,y+7);}}
  else if(kind==='deep'){for(const r of [8,15,22]){c.moveTo(Math.cos(-1)*r,Math.sin(-1)*r);c.arc(0,0,r,-1,1);}c.moveTo(2,0);c.arc(0,0,2,0,Math.PI*2);}
  else if(kind==='cryo'){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*22,Math.sin(a)*22);}}
  else if(kind==='overclock'){c.rect(-21,-21,42,42);c.moveTo(-11,0);c.lineTo(11,0);c.moveTo(0,-11);c.lineTo(0,11);}
  else if(kind==='pierce'){c.arc(0,0,16,0,Math.PI*2);c.moveTo(-22,0);c.lineTo(22,0);c.moveTo(14,-8);c.lineTo(22,0);c.lineTo(14,8);}
  else if(kind==='resonant'){for(let x=-22;x<=22;x++){const y=Math.sin(x/7)*16;if(x===-22)c.moveTo(x,y);else c.lineTo(x,y);}}
  else if(kind==='repair'){c.arc(0,0,22,0,Math.PI*2);c.moveTo(-5,-13);c.lineTo(5,-13);c.lineTo(5,-5);c.lineTo(13,-5);c.lineTo(13,5);c.lineTo(5,5);c.lineTo(5,13);c.lineTo(-5,13);c.lineTo(-5,5);c.lineTo(-13,5);c.lineTo(-13,-5);c.lineTo(-5,-5);c.closePath();}
  c.stroke();c.restore();
 }
 paused(){this.veil();this.label('PAUSED',640,390,70,C.text,'center',8,900);this.text('Your past can wait.',640,437,22,C.echo,'center');this.label('PRESS P TO RESUME',640,500,16,C.text,'center',2);}
 gameover(game){
  const c=this.ctx;this.veil(.8);this.label('THE PAST CAUGHT UP',640,225,13,C.red,'center',4);c.save();c.shadowColor=C.echo;c.shadowBlur=22;this.label('GAME OVER',640,315,76,'rgba(167,139,250,.5)','center',8,900);c.shadowBlur=8;this.label('GAME OVER',640,315,76,C.text,'center',8,900);c.restore();
  const stats=[['FINAL SCORE',game.score.toLocaleString(),30],['WAVE REACHED',game.director.wave,30],['BEST COMBO',`${game.bestCombo} CHAIN`,24],['PERSONAL BEST',game.best.toLocaleString(),30]];stats.forEach(([label,value,size],i)=>{const x=276+i*186;this.panel(x,360,170,96);this.label(label,x+85,386,9.5,C.muted,'center',2);this.num(value,x+85,431,size);});
  if(game.newBest){this.glowAt(640,500,260,C.gold,.15);this.round(555,485,170,30,15);c.strokeStyle=C.gold;c.lineWidth=1;c.stroke();this.label('★ NEW BEST',640,505,14,C.gold,'center',2,800);}
  this.round(470,548,340,44,22);c.strokeStyle=C.muted;c.lineWidth=1;c.stroke();this.label('CLICK OR PRESS R TO RESTART',640,576,14,C.text,'center',2);
 }
}
