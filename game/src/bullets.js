import { BULLET, ARENA, BOSS } from './config.js';
export class BulletPool {
 constructor() { this.items=Array.from({length:BULLET.poolSize},()=>({active:false})); this.cursor=0; }
 spawn(x,y,angle,kind='live') {
  let bullet; for(let i=0;i<this.items.length;i++){const b=this.items[(this.cursor+i)%this.items.length];if(!b.active){bullet=b;this.cursor=(this.cursor+i+1)%this.items.length;break;}}
  if(!bullet)return;
  const speed=kind==='live'?BULLET.speed:kind==='burst'?BULLET.burstSpeed:kind==='hostile'?BOSS.bulletSpeed:BULLET.echoSpeed;
  Object.assign(bullet,{active:true,x,y,angle,kind,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:kind==='hostile'?BULLET.hostileRadius:BULLET.radius,pierce:0,hits:null});
  return bullet;
 }
 update(dt) { for(const b of this.items)if(b.active){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<ARENA.left||b.x>ARENA.right||b.y<ARENA.top||b.y>ARENA.bottom)b.active=false;} }
 get active() { return this.items.filter(b=>b.active); }
}
