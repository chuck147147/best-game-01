import { WIDTH, HEIGHT, ARENA, PLAYER, ENEMY, PALETTE, EFFECTS, WAVES } from './config.js';
import { mulberry32, range } from './random.js';
import { ParticleSystem } from './particles.js';
import { BulletPool } from './bullets.js';
import { EchoField } from './echoes.js';
import { Enemy, WaveDirector } from './enemies.js';
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
  this.player={x:WIDTH/2,y:HEIGHT/2,vx:0,vy:0,angle:0,radius:PLAYER.radius,hp:PLAYER.hp,invincible:0};
  this.bullets=new BulletPool();this.particles=new ParticleSystem(this.rng);this.echoes=new EchoField(this.bullets,this.particles,this.sound);
  this.enemies=[];this.director=new WaveDirector(this.rng);this.score=0;this.newBest=false;this.fireTimer=0;this.shake=0;this.redFlash=0;this.banner=0;this.cleared=false;
 }
 start() {this.reset();this.state='playing';this.sound.uiClick();this.nextWave();}
 nextWave() {this.director.begin();this.banner=2.1;this.cleared=false;this.sound.waveStart();}
 pause() {if(this.state==='playing'){this.state='paused';this.input.clear();}}
 shoot() {
  const p=this.player,a=p.angle,x=p.x+Math.cos(a)*PLAYER.muzzle,y=p.y+Math.sin(a)*PLAYER.muzzle;
  this.bullets.spawn(x,y,a,'live');this.echoes.spawn(x,y,a);this.particles.muzzle(x,y,a);this.sound.shoot();
  p.vx-=Math.cos(a)*PLAYER.recoil;p.vy-=Math.sin(a)*PLAYER.recoil;
 }
 hurt() {
  const p=this.player;if(p.invincible>0||this.state!=='playing')return;
  p.hp--;p.invincible=PLAYER.invincibility;this.redFlash=EFFECTS.flash;this.shake=EFFECTS.damageShake;this.sound.playerHurt();this.particles.explosion(p.x,p.y,PALETTE.cyan,true);
  if(p.hp<=0){this.state='gameover';this.newBest=this.score>this.best;this.best=Math.max(this.score,this.best);try{localStorage.setItem('echo-arena-best',String(this.best));}catch{}this.sound.gameOver();this.input.down=false;}
 }
 kill(enemy,award=true) {
  if(enemy.dead)return;enemy.dead=true;this.particles.explosion(enemy.x,enemy.y,enemy.color,enemy.kind==='splitter');this.shake=Math.max(this.shake,EFFECTS.explosionShake);this.sound.explosion(enemy.kind==='splitter');
  if(award){this.score+=enemy.score;this.particles.score(enemy.x,enemy.y,enemy.score);}
  if(enemy.kind==='splitter')for(let i=0;i<3;i++){const a=i*Math.PI*2/3;this.enemies.push(new Enemy('mini',enemy.x+Math.cos(a)*18,enemy.y+Math.sin(a)*18,enemy.scale));}
 }
 update(dt) {
  this.time+=dt;
  if(this.input.take('KeyM')){this.sound.toggle();this.sound.uiClick();}
  if(this.state==='title'){if(this.input.clicked||this.input.take('Enter'))this.start();else this.attract(dt);return;}
  if(this.state==='gameover'){this.particles.update(dt);this.shake*=Math.exp(-8*dt);this.redFlash=Math.max(0,this.redFlash-dt);if(this.input.clicked||this.input.take('KeyR'))this.start();return;}
  if(this.input.take('KeyP')){this.state=this.state==='paused'?'playing':'paused';this.sound.uiClick();}
  if(this.state==='paused')return;
  const p=this.player,m=this.input.movement,length=Math.hypot(m.x,m.y)||1;
  p.vx+=m.x/length*PLAYER.acceleration*dt;p.vy+=m.y/length*PLAYER.acceleration*dt;
  const damping=Math.exp(-PLAYER.damping*dt);p.vx*=damping;p.vy*=damping;
  const speed=Math.hypot(p.vx,p.vy);if(speed>PLAYER.speed){p.vx*=PLAYER.speed/speed;p.vy*=PLAYER.speed/speed;}
  p.x=Math.max(ARENA.left+p.radius,Math.min(ARENA.right-p.radius,p.x+p.vx*dt));p.y=Math.max(ARENA.top+p.radius,Math.min(ARENA.bottom-p.radius,p.y+p.vy*dt));
  p.angle=Math.atan2(this.input.mouse.y-p.y,this.input.mouse.x-p.x);p.invincible=Math.max(0,p.invincible-dt);
  this.fireTimer-=dt;if(this.input.firing&&this.fireTimer<=0){this.shoot();this.fireTimer=PLAYER.fireInterval;}if(!this.input.firing)this.fireTimer=Math.max(0,this.fireTimer);
  this.echoes.update(dt);this.bullets.update(dt);this.director.update(dt,this.enemies);
  for(const enemy of this.enemies)if(!enemy.dead)enemy.update(dt,p);
  for(const bullet of this.bullets.items)if(bullet.active){
   for(const enemy of this.enemies){if(!enemy.dead&&overlaps(bullet,enemy)){bullet.active=false;enemy.hp--;enemy.flash=0.1;this.particles.sparks(bullet.x,bullet.y,enemy.color);if(enemy.hp<=0)this.kill(enemy);break;}}
   if(bullet.active&&bullet.kind==='echo'&&overlaps(bullet,p)){bullet.active=false;this.hurt();}
  }
  for(const enemy of [...this.enemies])if(!enemy.dead&&overlaps(enemy,p)){this.kill(enemy,false);this.hurt();}
  this.enemies=this.enemies.filter(e=>!e.dead);this.particles.update(dt);this.shake*=Math.exp(-8*dt);this.redFlash=Math.max(0,this.redFlash-dt);this.banner=Math.max(0,this.banner-dt);
  if(this.state==='playing'&&!this.enemies.length&&!this.director.pending.length){
   if(!this.cleared){const bonus=WAVES.bonus*this.director.wave;this.score+=bonus;this.particles.score(WIDTH/2,HEIGHT/2,bonus);this.cleared=true;this.director.intermission=WAVES.intermission;}
   this.director.intermission-=dt;if(this.director.intermission<=0)this.nextWave();
  }
 }
 attract(dt) {
  this.attractTimer-=dt;if(this.attractTimer<=0){this.attractTimer=0.65;this.echoes.spawn(range(this.rng,100,1180),range(this.rng,150,700),range(this.rng,0,Math.PI*2));}
  this.echoes.update(dt);this.bullets.update(dt);this.particles.update(dt);
  const target={x:WIDTH/2+Math.cos(this.time*0.3)*380,y:HEIGHT/2+Math.sin(this.time*0.4)*230};
  for(const e of this.enemies)e.update(dt,target);
 }
}
