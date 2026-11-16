import { PALETTE, EFFECTS } from './config.js';
import { range } from './random.js';
export class ParticleSystem {
 constructor(rng) { this.rng=rng; this.items=[]; }
 add(x,y,color,kind,life,size,vx=0,vy=0,text='') { this.items.push({x,y,color,kind,life,maxLife:life,size,vx,vy,text}); }
 sparks(x,y,color=PALETTE.white,count=8) { for(let i=0;i<count;i++){const a=range(this.rng,0,Math.PI*2),s=range(this.rng,50,220); this.add(x,y,color,'spark',EFFECTS.sparkLife,range(this.rng,1,3),Math.cos(a)*s,Math.sin(a)*s);} }
 explosion(x,y,color,big=false) { this.add(x,y,color,'ring',EFFECTS.ringLife,big?100:55); this.add(x,y,color,'glow',0.3,big?85:48); for(let i=0;i<(big?22:12);i++){const a=range(this.rng,0,Math.PI*2),s=range(this.rng,60,260);this.add(x,y,color,'shard',EFFECTS.shardLife,range(this.rng,2,6),Math.cos(a)*s,Math.sin(a)*s);} }
 muzzle(x,y,angle,color=PALETTE.white) { this.add(x,y,color,'glow',0.12,25); this.sparks(x,y,color,3); }
 dissolve(x,y) { this.add(x,y,PALETTE.echo,'ring',0.4,32); this.sparks(x,y,PALETTE.echo,5); }
 score(x,y,value) { this.add(x,y,PALETTE.white,'text',EFFECTS.textLife,18,0,-40,`+${value}`); }
 update(dt) { for(const p of this.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;} this.items=this.items.filter(p=>p.life>0); }
 draw(ctx) {
  // Draw-only cache: particle simulation and random consumption stay untouched.
  this.glows??=new Map();
  const glow=color=>{if(!this.glows.has(color)){const a=document.createElement('canvas');a.width=a.height=128;const c=a.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,128,128);this.glows.set(color,a);}return this.glows.get(color);};
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of this.items){const t=p.life/p.maxLife;ctx.globalAlpha=p.kind==='glow'?t**1.5:p.kind==='ring'?t**1.3:p.kind==='text'?Math.min(1,t*1.6):t;ctx.strokeStyle=ctx.fillStyle=p.color;ctx.lineWidth=2;
   if(p.kind==='text'){ctx.font=`700 ${p.size}px "Avenir Next","Segoe UI",system-ui,sans-serif`;ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);}
   else if(p.kind==='ring'){ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1-t)+4,0,Math.PI*2);ctx.stroke();}
   else if(p.kind==='glow'){ctx.drawImage(glow(p.color),p.x-p.size,p.y-p.size,p.size*2,p.size*2);}
   else {ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillRect(-p.size,-p.size/2,p.size*(p.kind==='shard'?3:2),p.size);ctx.restore();}
  }ctx.restore();
 }
}
