import { ENEMY, DASH, WAVES, ARENA } from './config.js';
import { range, pick } from './random.js';
export class Enemy {
 constructor(kind,x,y,scale=1) {
  Object.assign(this,ENEMY[kind],{kind,x,y,scale,angle:0,flash:0,dead:false,phase:'charge',timer:DASH.charge,dashX:0,dashY:0});
 }
 update(dt,player) {
  this.flash=Math.max(0,this.flash-dt);
  const dx=player.x-this.x,dy=player.y-this.y,distance=Math.hypot(dx,dy)||1;
  let vx=dx/distance*this.speed*this.scale,vy=dy/distance*this.speed*this.scale;
  this.angle=Math.atan2(dy,dx);
  if(this.kind==='dasher') {
   this.timer-=dt;
   if(this.phase==='charge') {
    const retreat=distance<DASH.distance?-1:0.45;vx*=retreat;vy*=retreat;
    if(this.timer<=0){this.phase='dash';this.timer=DASH.duration;this.dashX=dx/distance;this.dashY=dy/distance;}
   } else if(this.phase==='dash') {
    vx=this.dashX*DASH.speed*this.scale;vy=this.dashY*DASH.speed*this.scale;this.angle=Math.atan2(this.dashY,this.dashX);
    if(this.timer<=0){this.phase='cooldown';this.timer=DASH.cooldown;}
   } else {vx*=0.25;vy*=0.25;if(this.timer<=0){this.phase='charge';this.timer=DASH.charge;}}
  }
  this.x=Math.max(ARENA.left+this.radius,Math.min(ARENA.right-this.radius,this.x+vx*dt));
  this.y=Math.max(ARENA.top+this.radius,Math.min(ARENA.bottom-this.radius,this.y+vy*dt));
 }
}
export class WaveDirector {
 constructor(rng) { this.rng=rng;this.pending=[];this.wave=0;this.intermission=WAVES.intermission; }
 begin() {
  this.wave++;const count=WAVES.baseCount+this.wave*WAVES.countGrowth;
  for(let i=0;i<count;i++) {
   const side=Math.floor(this.rng()*4),a=ARENA;
   const x=side===0?a.left+30:side===1?a.right-30:range(this.rng,a.left+40,a.right-40);
   const y=side===2?a.top+30:side===3?a.bottom-30:range(this.rng,a.top+40,a.bottom-40);
   const choices=['chaser','chaser'];if(this.wave>=2)choices.push('splitter');if(this.wave>=3)choices.push('dasher');
   this.pending.push({kind:pick(this.rng,choices),x,y,timer:WAVES.spawnWarning+i*WAVES.spawnSpacing});
  }
 }
 update(dt,enemies) {
  for(const p of this.pending){p.timer-=dt;if(p.timer<=0)enemies.push(new Enemy(p.kind,p.x,p.y,1+(this.wave-1)*WAVES.speedGrowth));}
  this.pending=this.pending.filter(p=>p.timer>0);
 }
}
