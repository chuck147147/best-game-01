import { WIDTH, HEIGHT, ARENA, PLAYER, ENEMY, PALETTE, EFFECTS, WAVES, COMBO, ECHO, DETONATE, PLAYER_DASH, BOSS } from './config.js';
import { mulberry32, range } from './random.js';
import { ParticleSystem } from './particles.js';
import { BulletPool } from './bullets.js';
import { EchoField } from './echoes.js';
import { Enemy, WaveDirector } from './enemies.js';
import { rollUpgrades, cardRect } from './upgrades.js';
const overlaps=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<a.radius+b.radius;
export class Game {
 constructor(input,sound,seed=Date.now()) {
  this.input=input;this.sound=sound;this.rng=mulberry32(seed);this.time=0;this.best=0;this.state='title';
  try {this.best=Number(localStorage.getItem('echo-arena-best'))||0;}catch{}
  this.reset();this.attractTimer=0;
  for(let i=0;i<6;i++)this.enemies.push(new Enemy(i%3===0?'splitter':'chaser',range(this.rng,100,1180),range(this.rng,150,700),0.4));
  for(let i=0;i<10;i++){this.echoes.spawn(range(this.rng,120,1160),range(this.rng,180,700),range(this.rng,0,Math.PI*2));this.echoes.nodes.at(-1).age=range(this.rng,0,2.8);}
 }
 reset() {
  this.dashCd=0;this.dashTime=0;this.ghostTimer=0;this.afterimages=[];
  this.upgrades={twin:0,deep:0,cryo:0,overclock:0,pierce:0,resonant:0};this.choices=[];this.comboChain=0;this.comboTimer=0;this.bestCombo=0;
  this.player={x:WIDTH/2,y:HEIGHT/2,vx:0,vy:0,angle:0,radius:PLAYER.radius,hp:PLAYER.hp,invincible:0};
  this.bullets=new BulletPool();this.particles=new ParticleSystem(this.rng);this.echoes=new EchoField(this.bullets,this.particles,this.sound);
  this.enemies=[];this.director=new WaveDirector(this.rng);this.score=0;this.newBest=false;this.fireTimer=0;this.shake=0;this.redFlash=0;this.banner=0;this.cleared=false;
 }
 start() {this.reset();this.state='playing';this.sound.uiClick();this.nextWave();}
 nextWave() {this.director.begin();this.banner=2.1;this.cleared=false;this.sound.waveStart();}
 pause() {if(this.state==='playing'){this.state='paused';this.input.clear();}}
 shoot() {
  const p=this.player,a=p.angle,n=1+this.upgrades.twin;
  for(let i=0;i<n;i++){const offset=(i-(n-1)/2)*13,x=p.x+Math.cos(a)*PLAYER.muzzle+Math.cos(a+Math.PI/2)*offset,y=p.y+Math.sin(a)*PLAYER.muzzle+Math.sin(a+Math.PI/2)*offset;
   const b=this.bullets.spawn(x,y,a,'live');if(b){b.pierce=this.upgrades.pierce;if(b.pierce>0)b.hits=new Set();}
   this.echoes.spawn(x,y,a,ECHO.replays+2*this.upgrades.deep);this.particles.muzzle(x,y,a);
  }this.sound.shoot();
  p.vx-=Math.cos(a)*PLAYER.recoil;p.vy-=Math.sin(a)*PLAYER.recoil;
 }
 detonate(node){
  this.echoes.remove(node);
  const remaining=Math.max(1,node.maxReplays-node.replays);
  const count=DETONATE.base+remaining*DETONATE.perReplay;
  for(let i=0;i<count;i++)this.bullets.spawn(node.x,node.y,node.angle+i*Math.PI*2/count,'burst');
  this.particles.explosion(node.x,node.y,PALETTE.echo,true);
  this.shake=Math.max(this.shake,6);
  this.sound.detonate();
 }
 hurt() {
  const p=this.player;if(p.invincible>0||this.state!=='playing')return;
  p.hp--;p.invincible=PLAYER.invincibility;this.redFlash=EFFECTS.flash;this.shake=EFFECTS.damageShake;this.sound.playerHurt();this.particles.explosion(p.x,p.y,PALETTE.cyan,true);
  if(p.hp<=0){this.state='gameover';this.newBest=this.score>this.best;this.best=Math.max(this.score,this.best);try{localStorage.setItem('echo-arena-best',String(this.best));}catch{}this.sound.gameOver();this.input.down=false;}
 }
 kill(enemy,award=true,byKind='live') {
  if(enemy.dead)return;enemy.dead=true;this.particles.explosion(enemy.x,enemy.y,enemy.color,enemy.kind==='splitter');this.shake=Math.max(this.shake,EFFECTS.explosionShake);this.sound.explosion(enemy.kind==='splitter');
  if(enemy.kind==='warden'){this.particles.explosion(enemy.x,enemy.y,PALETTE.white,true);this.shake=Math.max(this.shake,10);this.sound.bossDown();}
  if(award){
   if(byKind==='live'||byKind==='echo'||byKind==='burst'){this.comboChain+=byKind==='live'?1:2;this.comboTimer=COMBO.window;this.bestCombo=Math.max(this.bestCombo,this.comboChain);}
   const mult=Math.min(1+Math.floor(this.comboChain/COMBO.perTier),COMBO.maxTier),gained=enemy.score*mult;this.score+=gained;this.particles.score(enemy.x,enemy.y,gained);
  }
  if(enemy.kind==='splitter')for(let i=0;i<3;i++){const a=i*Math.PI*2/3;this.enemies.push(new Enemy('mini',enemy.x+Math.cos(a)*18,enemy.y+Math.sin(a)*18,enemy.scale));}
 }
 applyUpgrade(id) {
  if(id==='repair'){if(this.player.hp<PLAYER.hp)this.player.hp++;else this.score+=300;return;}
  this.upgrades[id]++;if(id==='overclock')this.echoes.cap=ECHO.cap+12*this.upgrades.overclock;
 }
 update(dt) {
  this.time+=dt;
  if(this.input.take('KeyM')){this.sound.toggle();this.sound.uiClick();}
  if(this.state==='title'){if(this.input.clicked||this.input.take('Enter'))this.start();else this.attract(dt);return;}
  if(this.state==='gameover'){this.particles.update(dt);this.shake*=Math.exp(-8*dt);this.redFlash=Math.max(0,this.redFlash-dt);if(this.input.clicked||this.input.take('KeyR'))this.start();return;}
  if(this.state==='upgrade'){
   this.particles.update(dt);let pick=-1;
   for(let i=0;i<this.choices.length;i++){const r=cardRect(i),m=this.input.mouse;if(this.input.take(`Digit${i+1}`)||(this.input.clicked&&m.x>=r.x&&m.x<=r.x+r.w&&m.y>=r.y&&m.y<=r.y+r.h)){pick=i;break;}}
   if(pick>=0){this.applyUpgrade(this.choices[pick].id);this.choices=[];this.state='playing';this.sound.upgradePick();this.nextWave();}return;
  }
  if(this.input.take('KeyP')){this.state=this.state==='paused'?'playing':'paused';this.sound.uiClick();}
  if(this.state==='paused')return;
  if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.comboChain=0;}
  const p=this.player,m=this.input.movement,length=Math.hypot(m.x,m.y)||1;
  this.dashCd=Math.max(0,this.dashCd-dt);this.dashTime=Math.max(0,this.dashTime-dt);
  if((this.input.take('ShiftLeft')||this.input.take('ShiftRight')||this.input.take('Space'))&&this.dashCd<=0){
   const mv=this.input.movement;let dx=mv.x,dy=mv.y;
   if(!dx&&!dy){dx=Math.cos(p.angle);dy=Math.sin(p.angle);}
   const l=Math.hypot(dx,dy)||1;
   p.vx=dx/l*PLAYER_DASH.speed;p.vy=dy/l*PLAYER_DASH.speed;
   p.invincible=Math.max(p.invincible,PLAYER_DASH.invincible);
   this.dashTime=0.18;this.dashCd=PLAYER_DASH.cooldown;this.ghostTimer=0;this.sound.dash();
  }
  p.vx+=m.x/length*PLAYER.acceleration*dt;p.vy+=m.y/length*PLAYER.acceleration*dt;
  const damping=Math.exp(-PLAYER.damping*dt);p.vx*=damping;p.vy*=damping;
  const speed=Math.hypot(p.vx,p.vy),cap=this.dashTime>0?PLAYER_DASH.speed:PLAYER.speed;if(speed>cap){p.vx*=cap/speed;p.vy*=cap/speed;}
  p.x=Math.max(ARENA.left+p.radius,Math.min(ARENA.right-p.radius,p.x+p.vx*dt));p.y=Math.max(ARENA.top+p.radius,Math.min(ARENA.bottom-p.radius,p.y+p.vy*dt));
  p.angle=Math.atan2(this.input.mouse.y-p.y,this.input.mouse.x-p.x);p.invincible=Math.max(0,p.invincible-dt);
  this.fireTimer-=dt;if(this.input.firing&&this.fireTimer<=0){this.shoot();this.fireTimer=PLAYER.fireInterval;}if(!this.input.firing)this.fireTimer=Math.max(0,this.fireTimer);
  this.echoes.update(dt);this.bullets.update(dt);this.director.update(dt,this.enemies);
  for(const enemy of this.enemies)if(!enemy.dead)enemy.update(dt,p);
  const boss=this.enemies.find(e=>e.kind==='warden'&&!e.dead);
  if(boss){
   boss.barrage-=dt;boss.summon-=dt;
   if(boss.barrage<=0){for(let i=0;i<BOSS.barrageCount;i++)this.bullets.spawn(boss.x,boss.y,boss.barragePhase+i*Math.PI*2/BOSS.barrageCount,'hostile');boss.barragePhase+=0.35;boss.barrage=BOSS.barrageInterval;this.sound.bossShoot();}
   if(boss.summon<=0&&this.enemies.filter(e=>!e.dead&&e.kind!=='warden').length<BOSS.summonCap){for(const offset of [-56,56])this.enemies.push(new Enemy('chaser',boss.x+offset,boss.y+20,1+(this.director.wave-1)*WAVES.speedGrowth));boss.summon=BOSS.summonInterval;}
  }
  for(const bullet of this.bullets.items)if(bullet.active){
   if(bullet.active&&bullet.kind==='live')for(const node of [...this.echoes.nodes])if(node.age>DETONATE.armTime&&overlaps(bullet,{x:node.x,y:node.y,radius:ECHO.radius})){this.detonate(node);bullet.active=false;break;}
   if(!bullet.active)continue;
   if(bullet.kind!=='hostile')for(const enemy of this.enemies){if(enemy.dead||bullet.hits?.has(enemy)||!overlaps(bullet,enemy))continue;
    const dmg=bullet.kind==='echo'?1+this.upgrades.resonant:1;enemy.hp-=dmg;enemy.flash=0.1;this.particles.sparks(bullet.x,bullet.y,enemy.color);
    if(bullet.kind==='echo'&&this.upgrades.cryo>0)enemy.slow=1.2;if(enemy.hp<=0)this.kill(enemy,true,bullet.kind);
    if(bullet.pierce>0){bullet.pierce--;bullet.hits.add(enemy);}else{bullet.active=false;break;}
   }
   if(bullet.active&&(bullet.kind==='echo'||bullet.kind==='hostile')&&overlaps(bullet,p)){bullet.active=false;this.hurt();}
  }
  for(const enemy of [...this.enemies])if(!enemy.dead&&overlaps(enemy,p)){this.kill(enemy,false);this.hurt();}
  if(this.dashTime>0){this.ghostTimer-=dt;if(this.ghostTimer<=0){this.afterimages.push({x:p.x,y:p.y,angle:p.angle,life:PLAYER_DASH.ghostLife});this.ghostTimer=PLAYER_DASH.ghostInterval;}}
  for(const g of this.afterimages)g.life-=dt;this.afterimages=this.afterimages.filter(g=>g.life>0);
  this.enemies=this.enemies.filter(e=>!e.dead);this.particles.update(dt);this.shake*=Math.exp(-8*dt);this.redFlash=Math.max(0,this.redFlash-dt);this.banner=Math.max(0,this.banner-dt);
  if(this.state==='playing'&&!this.enemies.length&&!this.director.pending.length){
   if(!this.cleared){const bonus=WAVES.bonus*this.director.wave;this.score+=bonus;this.particles.score(WIDTH/2,HEIGHT/2,bonus);this.cleared=true;this.choices=rollUpgrades(this.rng,3);this.state='upgrade';this.sound.upgradeOffer();}
  }
 }
 attract(dt) {
  this.attractTimer-=dt;if(this.attractTimer<=0){this.attractTimer=0.65;this.echoes.spawn(range(this.rng,100,1180),range(this.rng,150,700),range(this.rng,0,Math.PI*2));}
  this.echoes.update(dt);this.bullets.update(dt);this.particles.update(dt);
  const target={x:WIDTH/2+Math.cos(this.time*0.3)*380,y:HEIGHT/2+Math.sin(this.time*0.4)*230};
  for(const e of this.enemies)e.update(dt,target);
 }
}
