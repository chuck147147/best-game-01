import { WIDTH, HEIGHT, ARENA, PALETTE as C, COMBO, BULLET, DASH, PLAYER_DASH } from './config.js';
import { cardRect, CARD } from './upgrades.js';
export class Renderer {
 constructor(canvas) {this.ctx=canvas.getContext('2d');this.canvas=canvas;}
 text(value,x,y,size=18,color=C.text,align='left',weight=600) {const c=this.ctx;c.font=`${weight} ${size}px system-ui, sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(value,x,y);}
 line(x,y,x2,y2,color,width=1) {const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
 draw(game) {
  const c=this.ctx,scale=this.canvas.width/WIDTH;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,WIDTH,HEIGHT);c.fillStyle=C.floor;c.fillRect(0,0,WIDTH,HEIGHT);
  c.save();c.translate(Math.sin(game.time*99)*game.shake,Math.cos(game.time*113)*game.shake);
  this.floor(game.time);
  c.save();c.beginPath();c.rect(ARENA.left,ARENA.top,ARENA.right-ARENA.left,ARENA.bottom-ARENA.top);c.clip();
  game.echoes.draw(c,game.time);
  for(const spawn of game.director.pending)if(spawn.timer<0.85){const pulse=1-spawn.timer/0.85;c.strokeStyle=C.red;c.globalAlpha=0.5+Math.sin(game.time*25)*0.25;c.lineWidth=2;c.beginPath();c.arc(spawn.x,spawn.y,12+24*pulse,0,Math.PI*2);c.stroke();this.line(spawn.x-9,spawn.y,spawn.x+9,spawn.y,C.red);this.line(spawn.x,spawn.y-9,spawn.x,spawn.y+9,C.red);c.globalAlpha=1;}
  this.bullets(game.bullets.active);
  for(const enemy of game.enemies)this.enemy(enemy,game.time);
  for(const g of game.afterimages){c.save();c.translate(g.x,g.y);c.rotate(g.angle);c.globalAlpha=0.35*(g.life/PLAYER_DASH.ghostLife);c.strokeStyle=C.cyan;c.lineWidth=2;c.beginPath();c.moveTo(21,0);c.lineTo(-14,-13);c.lineTo(-8,0);c.lineTo(-14,13);c.closePath();c.stroke();c.restore();}
  if(game.state!=='title'&&game.player.hp>0)this.player(game);
  game.particles.draw(c);c.restore();c.restore();
  this.hud(game);
  const boss=game.enemies.find(e=>e.kind==='warden'&&!e.dead);
  if(boss&&(game.state==='playing'||game.state==='upgrade')){this.text('WARDEN',WIDTH/2-220,ARENA.top-2,10,C.echo,'left',700);c.fillStyle='#292335';c.fillRect(WIDTH/2-220,ARENA.top+8,440,9);c.fillStyle='#d8b4fe';c.fillRect(WIDTH/2-220,ARENA.top+8,440*Math.max(0,boss.hp/boss.maxHp),9);c.strokeStyle='#65518f';c.lineWidth=1;c.strokeRect(WIDTH/2-220,ARENA.top+8,440,9);}
  if(game.banner>0&&game.state==='playing'){c.save();c.globalAlpha=Math.min(1,game.banner);this.text(`WAVE ${String(game.director.wave).padStart(2,'0')}`,WIDTH/2,195,42,C.text,'center',850);this.text('THE PAST IS CATCHING UP',WIDTH/2,222,12,C.echo,'center');c.restore();}
  if(game.redFlash>0){const g=c.createRadialGradient(WIDTH/2,HEIGHT/2,220,WIDTH/2,HEIGHT/2,700);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(248,70,80,${game.redFlash})`);c.fillStyle=g;c.fillRect(0,0,WIDTH,HEIGHT);}
  if(game.state==='upgrade')this.upgrade(game);
  if(game.state==='title')this.title(game);
  if(game.state==='paused')this.paused();
  if(game.state==='gameover')this.gameover(game);
 }
 floor(time) {
  const c=this.ctx,a=ARENA;c.save();
  c.fillStyle=C.floor;c.fillRect(a.left,a.top,a.right-a.left,a.bottom-a.top);
  c.strokeStyle=C.grid;c.lineWidth=1;c.beginPath();for(let x=a.left;x<a.right;x+=40){c.moveTo(x,a.top);c.lineTo(x,a.bottom);}for(let y=a.top;y<a.bottom;y+=40){c.moveTo(a.left,y);c.lineTo(a.right,y);}c.stroke();
  c.shadowBlur=16;c.shadowColor=C.echo;c.strokeStyle='#65518f';c.strokeRect(a.left,a.top,a.right-a.left,a.bottom-a.top);c.shadowBlur=0;
  const corners=[[a.left,a.top,1,1],[a.right,a.top,-1,1],[a.left,a.bottom,1,-1],[a.right,a.bottom,-1,-1]];
  for(const [x,y,sx,sy]of corners){this.line(x,y,x+sx*35,y,C.cyan,3);this.line(x,y,x,y+sy*35,C.cyan,3);}
  c.globalAlpha=0.2;this.text('E C H O   /   T E S T   C H A M B E R',WIDTH/2,a.bottom-20,11,C.echo,'center');c.restore();
 }
 bullets(bullets) {
  const c=this.ctx;c.save();c.globalCompositeOperation='lighter';
  for(const b of bullets){const live=b.kind==='live',burst=b.kind==='burst',hostile=b.kind==='hostile',dx=Math.cos(b.angle),dy=Math.sin(b.angle);c.globalAlpha=live||hostile?1:burst?0.95:0.48;c.shadowBlur=live?13:8;c.shadowColor=hostile?C.red:live?C.cyan:C.echo;
   const gradient=c.createLinearGradient(b.x,b.y,b.x-dx*BULLET.trail,b.y-dy*BULLET.trail);gradient.addColorStop(0,hostile?C.red:live?C.cyan:C.echo);gradient.addColorStop(1,'transparent');this.line(b.x,b.y,b.x-dx*BULLET.trail,b.y-dy*BULLET.trail,gradient,live?4:3);
   c.fillStyle=hostile?'#fecaca':burst?'#ffffff':live?C.white:C.echo;c.beginPath();c.arc(b.x,b.y,live?3.5:4,0,Math.PI*2);c.fill();
  }c.restore();
 }
 enemy(e,time) {
  const c=this.ctx;c.save();c.translate(e.x,e.y);
  if(e.kind==='warden'){
   c.rotate(time*0.3);c.strokeStyle=e.flash>0?C.white:e.color;c.lineWidth=3.5;c.fillStyle='#1d1030';c.shadowBlur=18;c.shadowColor=e.color;
   for(const r of [e.radius,e.radius*0.62]){c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;if(i===0)c.moveTo(Math.cos(a)*r,Math.sin(a)*r);else c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();c.rotate(-time*0.5);}
   c.fillStyle=e.color;c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.restore();return;
  }
  if(e.kind==='dasher'&&e.phase==='charge'){c.save();c.rotate(e.angle);c.globalAlpha=0.2+0.45*(1-e.timer/DASH.charge);c.setLineDash([9,9]);this.line(0,0,600,0,C.red,2);c.restore();}
  if(e.kind==='dasher'&&e.phase==='dash'){c.save();c.rotate(e.angle);const trail=c.createLinearGradient(-12,0,-125,0);trail.addColorStop(0,C.red);trail.addColorStop(1,'transparent');c.globalAlpha=0.55;this.line(-12,0,-125,0,trail,13);c.restore();}
  c.rotate(e.kind==='splitter'?time*0.25:e.angle);c.strokeStyle=e.flash>0?C.white:e.color;c.fillStyle=e.flash>0?'#ffffff':'#241023';c.lineWidth=2.5;c.shadowBlur=14;c.shadowColor=e.color;
  if(e.kind==='dasher'&&e.phase==='charge')c.globalAlpha=0.65+0.35*Math.sin(time*22);
  c.beginPath();
  if(e.kind==='splitter'){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.lineTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius);}}
  else if(e.kind==='dasher'){c.moveTo(25,0);c.lineTo(-17,-16);c.lineTo(-7,0);c.lineTo(-17,16);}
  else {c.moveTo(e.radius,0);c.lineTo(0,e.radius);c.lineTo(-e.radius,0);c.lineTo(0,-e.radius);}
  c.closePath();c.fill();c.stroke();c.shadowBlur=0;c.fillStyle=e.color;c.fillRect(-3,-3,6,6);
  if(e.kind==='splitter'){c.globalAlpha=0.65;c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.stroke();}c.restore();
 }
 player(game) {
  const p=game.player,c=this.ctx;if(p.invincible>0&&Math.floor(game.time*16)%2===0)return;
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);
  const engine=18+Math.sin(game.time*40)*5+Math.hypot(p.vx,p.vy)*0.035;
  const flame=c.createLinearGradient(-12,0,-12-engine,0);flame.addColorStop(0,C.cyan);flame.addColorStop(1,'transparent');c.fillStyle=flame;c.beginPath();c.moveTo(-10,-6);c.lineTo(-12-engine,0);c.lineTo(-10,6);c.fill();
  c.shadowBlur=18;c.shadowColor=C.cyan;c.strokeStyle=C.white;c.fillStyle='#126077';c.lineWidth=2;c.beginPath();c.moveTo(21,0);c.lineTo(-14,-13);c.lineTo(-8,0);c.lineTo(-14,13);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
  this.line(31,0,47,0,C.cyan,1);c.restore();
  if(p.invincible>0){c.save();c.globalAlpha=0.35;c.strokeStyle=C.cyan;c.beginPath();c.arc(p.x,p.y,27,0,Math.PI*2);c.stroke();c.restore();}
  const m=game.input.mouse;c.save();c.globalAlpha=0.7;c.strokeStyle=C.white;c.beginPath();c.arc(m.x,m.y,7,0,Math.PI*2);c.stroke();this.line(m.x-12,m.y,m.x-9,m.y,C.cyan);this.line(m.x+9,m.y,m.x+12,m.y,C.cyan);c.restore();
 }
 hud(game) {
  this.text('ECHO / ARENA',42,43,18,C.white,'left',850);this.text('DELAYED FIRE. IMMEDIATE CONSEQUENCES.',42,67,10,C.muted);
  this.text(String(game.score).padStart(6,'0'),WIDTH/2,57,34,C.text,'center',800);this.text('SCORE',WIDTH/2,79,10,C.muted,'center');
  this.text(`WAVE ${String(game.director.wave).padStart(2,'0')}`,1238,38,16,C.text,'right');
  this.text(`${game.echoes.nodes.length} / ${game.echoes.cap} ECHOES`,1238,66,12,C.echo,'right');
  if(game.comboChain>=2&&(game.state==='playing'||game.state==='upgrade')){const c=this.ctx,mult=Math.min(1+Math.floor(game.comboChain/COMBO.perTier),COMBO.maxTier);this.text(`COMBO ×${mult} · ${game.comboChain} CHAIN`,WIDTH/2,103,15,mult>=4?C.orange:C.echo,'center',800);c.fillStyle='#292335';c.fillRect(WIDTH/2-60,107,120,3);c.fillStyle=C.echo;c.fillRect(WIDTH/2-60,107,120*Math.max(0,game.comboTimer/COMBO.window),3);}
  if(game.state!=='title'){const c=this.ctx;this.text('DASH',42,762,10,C.muted);c.fillStyle='#292335';c.fillRect(90,754,80,6);c.fillStyle=C.cyan;c.fillRect(90,754,80*(1-game.dashCd/PLAYER_DASH.cooldown),6);this.text('HULL',42,789,11,C.muted);for(let i=0;i<3;i++){const c=this.ctx;c.fillStyle=i<game.player.hp?C.cyan:'#292335';c.fillRect(90+i*27,777,19,8);}this.text('CYAN IS YOURS   /   VIOLET IS YOUR PAST',WIDTH/2,787,11,C.echo,'center');}
  this.text(`P PAUSE   ·   M ${game.sound.muted?'UNMUTE':'MUTE'}`,1238,787,11,C.muted,'right');
 }
 veil(alpha=0.8) {const c=this.ctx;c.fillStyle=`rgba(6,4,15,${alpha})`;c.fillRect(0,95,WIDTH,665);}
 title(game) {
  const c=this.ctx;this.veil(0.68);
  this.text('S U R V I V E   Y O U R   O W N   E C H O',640,204,13,C.cyan,'center',700);
  c.save();c.shadowBlur=35;c.shadowColor='#55488a';this.text('ECHO ARENA',640,310,98,C.text,'center',900);c.restore();
  this.text('回 声 战 场',640,360,32,C.echo,'center',600);
  this.line(532,389,748,389,'#544276');
  this.text('你最大的敌人，是三秒前的你自己。',640,433,23,C.text,'center');
  this.text('Your deadliest enemy is you, three seconds ago.',640,464,19,C.muted,'center',500);
  this.text('Shoot your own echo nodes to detonate them — the blast never harms you.',640,488,14,C.echo,'center');
  this.text('Every shot you fire leaves an echo that replays it every 3 s — and echoes can kill you too.',640,520,16,C.text,'center',500);
  this.text('WASD / ARROWS — move · MOUSE — aim · HOLD CLICK — fire · SHIFT / SPACE — dash · P pause · M mute',640,555,13,C.echo,'center');
  c.save();c.shadowBlur=20;c.shadowColor=C.cyan;c.strokeStyle=C.cyan;c.fillStyle='#10242e';c.fillRect(500,592,280,58);c.strokeRect(500,592,280,58);this.text('CLICK TO START',640,629,21,C.white,'center',800);c.restore();
  this.text(game.best?`PERSONAL BEST  ${game.best.toLocaleString()}`:'FIRE. MOVE. REMEMBER.',640,694,13,C.muted,'center');
 }
 upgrade(game) {
  const c=this.ctx;this.veil(0.74);
  this.text(`WAVE ${String(game.director.wave).padStart(2,'0')} CLEARED`,WIDTH/2,225,30,C.text,'center',900);this.text('选择强化 · CHOOSE AN UPGRADE',WIDTH/2,258,15,C.echo,'center');
  for(const [i,choice]of game.choices.entries()){const r=cardRect(i),cx=r.x+CARD.w/2,n=game.upgrades[choice.id];
   c.save();c.fillStyle='rgba(16,12,32,0.92)';c.strokeStyle=C.echo;c.lineWidth=2;c.shadowBlur=14;c.shadowColor=C.echo;c.fillRect(r.x,r.y,r.w,r.h);c.strokeRect(r.x,r.y,r.w,r.h);c.restore();
   this.text(String(i+1),r.x+18,r.y+30,16,C.echo,'left',800);if(n>0)this.text(`OWNED ×${n}`,r.x+r.w-16,r.y+30,12,C.orange,'right');
   this.upgradeIcon(choice.icon,cx,r.y+72);this.text(choice.name,cx,r.y+128,19,C.text,'center',800);this.text(choice.cn,cx,r.y+152,14,C.echo,'center');
   const lines=[];let line='';for(const word of choice.desc.split(' ')){if(line&&(line+' '+word).length>26&&lines.length<1){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
   for(let j=0;j<lines.length;j++)this.text(lines[j],cx,r.y+178+j*16,12.5,C.muted,'center');
  }
  this.text('CLICK A CARD OR PRESS 1 · 2 · 3',WIDTH/2,600,13,C.muted,'center');
 }
 upgradeIcon(kind,cx,cy) {
  const c=this.ctx;c.save();c.translate(cx,cy);c.strokeStyle=C.cyan;c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.beginPath();
  if(kind==='twin'){for(const y of [-10,10]){c.moveTo(-22,y);c.lineTo(22,y);c.moveTo(13,y-7);c.lineTo(22,y);c.lineTo(13,y+7);}}
  else if(kind==='deep'){for(const r of [8,15,22]){c.moveTo(Math.cos(-1)*r,Math.sin(-1)*r);c.arc(0,0,r,-1,1);}c.moveTo(2,0);c.arc(0,0,2,0,Math.PI*2);}
  else if(kind==='cryo'){for(let i=0;i<6;i++){const a=i*Math.PI/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*22,Math.sin(a)*22);}}
  else if(kind==='overclock'){c.rect(-21,-21,42,42);c.moveTo(-11,0);c.lineTo(11,0);c.moveTo(0,-11);c.lineTo(0,11);}
  else if(kind==='pierce'){c.arc(0,0,16,0,Math.PI*2);c.moveTo(-22,0);c.lineTo(22,0);c.moveTo(14,-8);c.lineTo(22,0);c.lineTo(14,8);}
  else if(kind==='resonant'){for(let x=-22;x<=22;x++){const y=Math.sin(x/7)*16;if(x===-22)c.moveTo(x,y);else c.lineTo(x,y);}}
  else if(kind==='repair'){c.arc(0,0,22,0,Math.PI*2);c.moveTo(-5,-13);c.lineTo(5,-13);c.lineTo(5,-5);c.lineTo(13,-5);c.lineTo(13,5);c.lineTo(5,5);c.lineTo(5,13);c.lineTo(-5,13);c.lineTo(-5,5);c.lineTo(-13,5);c.lineTo(-13,-5);c.lineTo(-5,-5);c.closePath();}
  c.stroke();c.restore();
 }
 paused() {this.veil();this.text('PAUSED',640,390,70,C.text,'center',900);this.text('Your past can wait.',640,437,22,C.echo,'center');this.text('PRESS P TO RESUME',640,500,16,C.white,'center');}
 gameover(game) {
  this.veil();this.text('THE PAST CAUGHT UP',640,241,14,C.red,'center');this.text('GAME OVER',640,330,80,C.text,'center',900);
  this.text('FINAL SCORE',640,391,13,C.muted,'center');this.text(game.score.toLocaleString(),640,454,56,C.white,'center',850);
  this.text(`WAVE REACHED  ${game.director.wave}     /     BEST  ${game.best.toLocaleString()}`,640,504,18,C.echo,'center');
  this.text(`BEST COMBO  ${game.bestCombo} CHAIN`,640,536,15,C.orange,'center',700);
  if(game.newBest)this.text('NEW BEST',640,568,17,C.orange,'center',800);
  this.text('CLICK OR PRESS R TO RESTART',640,622,23,C.white,'center',800);
 }
}
