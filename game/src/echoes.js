import { ECHO, PALETTE } from './config.js';
export class EchoNode {
 constructor(x,y,angle) { Object.assign(this,{x,y,angle,age:0,replays:0}); }
 get remaining() { return ECHO.interval*(this.replays+1)-this.age; }
}
export class EchoField {
 constructor(bullets,particles,sound) { this.nodes=[];this.bullets=bullets;this.particles=particles;this.sound=sound; }
 spawn(x,y,angle) {
  if(this.nodes.length>=ECHO.cap){const old=this.nodes.shift();this.particles.dissolve(old.x,old.y);}
  this.nodes.push(new EchoNode(x,y,angle));
 }
 update(dt) {
  for(const node of this.nodes){node.age+=dt;
   while(node.replays<ECHO.replays&&node.age>=ECHO.interval*(node.replays+1)) {
    node.replays++;this.bullets.spawn(node.x,node.y,node.angle,'echo');this.sound.echoShoot(node.replays);this.particles.muzzle(node.x,node.y,node.angle,PALETTE.echo);
   }
   if(node.replays===ECHO.replays)this.particles.dissolve(node.x,node.y);
  }
  this.nodes=this.nodes.filter(n=>n.replays<ECHO.replays);
 }
 draw(ctx,time) {
  ctx.save();ctx.strokeStyle=PALETTE.echo;
  for(const n of this.nodes){const warning=n.remaining<ECHO.warning,pulse=warning?(0.65+0.35*Math.sin(time*35)):0;const urgency=warning?1-n.remaining/ECHO.warning:0;const radius=ECHO.radius+urgency*4+pulse*5;
   ctx.globalAlpha=warning?0.72+pulse*0.28:0.3;ctx.lineWidth=1;ctx.beginPath();ctx.arc(n.x,n.y,radius,0,Math.PI*2);ctx.stroke();
   ctx.shadowColor=PALETTE.echo;ctx.shadowBlur=warning?10+pulse*12:0;
   ctx.lineWidth=warning?4:3.25;ctx.globalAlpha=warning?1:0.78;ctx.beginPath();ctx.arc(n.x,n.y,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,n.remaining/ECHO.interval));ctx.stroke();
   ctx.beginPath();ctx.moveTo(n.x+Math.cos(n.angle)*8,n.y+Math.sin(n.angle)*8);ctx.lineTo(n.x+Math.cos(n.angle)*25,n.y+Math.sin(n.angle)*25);ctx.stroke();
   ctx.shadowBlur=0;
   for(let i=0;i<ECHO.replays-n.replays;i++){ctx.fillStyle=PALETTE.echo;ctx.fillRect(n.x-6+i*4,n.y+23,2,2);}
  }ctx.restore();
 }
}
