import { ECHO, PALETTE as C } from './config.js';
import { mulberry32, range } from './random.js';
import { UPGRADE_POOL } from './upgrades.js';
import { Enemy } from './enemies.js';

// Stage actual simulation objects; main.js keeps drawing but skips update().
// Return false for unknown names so ordinary play remains available.
export function stageShotScene({game, name, seed=1}) {
 if(!['title','play','upgrade','over'].includes(name))return false;
 game.rng=mulberry32(seed);game.reset();game.time=18.17;
 game.state=name==='title'?'title':name==='over'?'gameover':'playing';
 game.best=0;game.attractTimer=0.4;
 const rng=game.rng,play=name==='play'||name==='upgrade',over=name==='over';
 game.director.wave=name==='title'?0:name==='play'?5:play?4:7;
 game.score=play?12450:over?17450:0;
 game.player.hp=over?0:2;
 Object.assign(game.player,{x:610,y:440,vx:240,vy:-120,angle:-0.58});
 // Snapshot input separately so pointer movement cannot alter the rendered reticle.
 game.input={mouse:{x:905,y:245}};
 if(play) {
  const p=game.player;
  game.input.mouse={x:p.x+Math.cos(p.angle)*82,y:p.y+Math.sin(p.angle)*82};
 }
 // Three straight shot histories, with streams continuing ahead of each run.
 const playRuns=[
  {x:220,y:230,dx:62,dy:0,count:6,angle:0,flight:[90,185,280,375,470,565]},
  {x:300,y:400,dx:50,dy:38,count:6,angle:Math.atan2(38,50),flight:[60,115,170,225]},
  {x:940,y:340,dx:0,dy:62,count:4,angle:Math.PI/2,flight:[55,100,145,190]}
 ];
 if(play) {
  for(const [runIndex,run] of playRuns.entries())for(let i=0;i<run.count;i++) {
   game.echoes.spawn(run.x+i*run.dx,run.y+i*run.dy,run.angle);
   const node=game.echoes.nodes.at(-1);
   node.replays=(i+runIndex)%3;
   const phase=runIndex<2&&i===run.count-1?ECHO.interval-0.22:0.2+(i*0.47+runIndex*0.31)%2.2;
   node.age=ECHO.interval*node.replays+phase;
  }
 } else {
 const count=over?7:name==='title'?18:14;
 for(let i=0;i<count;i++) {
  const lane=i%2,row=Math.floor(i/2),rows=Math.ceil(count/2);
  const x=over?range(rng,100,1180):160+row/(rows-1)*940+range(rng,-18,18);
  const y=over?range(rng,155,710):(lane?660:185)+(lane?-1:1)*row/(rows-1)*325+range(rng,-22,22);
  const angle=lane?-2.58:0.56;
  game.echoes.spawn(x,y,angle);
  const node=game.echoes.nodes.at(-1);
  node.replays=over?3:i%3;
  node.age=ECHO.interval*node.replays+0.12+(i*0.43+range(rng,0,0.16))%2.85;
 }
 }
 const enemy=(kind,x,y)=>{
  const e=new Enemy(kind,x,y,1+(game.director.wave-1)*0.065);
  e.angle=Math.atan2(game.player.y-y,game.player.x-x);game.enemies.push(e);return e;
 };
 const burst=(x,y,color,big=true)=>{
  game.particles.explosion(x,y,color,big);
  // Advance just these particles to show an expanding ring and scattered shards.
  for(const p of game.particles.items.slice(-((big?22:12)+2))){p.life-=0.12;p.x+=p.vx*0.12;p.y+=p.vy*0.12;}
 };
 if(over) {
  game.best=game.score;game.newBest=true;game.bestCombo=23;
  for(let i=0;i<32;i++){
   game.particles.add(range(rng,80,1200),range(rng,140,720),i%3?C.echo:C.cyan,'shard',0.65,range(rng,2,5),range(rng,-100,100),range(rng,-100,100));
   game.particles.items.at(-1).life=range(rng,0.12,0.4);
  }
 } else {
  enemy('chaser',365,365);enemy('chaser',825,580);enemy('chaser',965,300);
  enemy('splitter',260,590);
  const dasher=enemy('dasher',1020,620);
  dasher.timer=0.34;
  if(play) {
   for(const run of playRuns)for(const distance of run.flight) {
    game.bullets.spawn(run.x+(run.count-1)*run.dx+Math.cos(run.angle)*distance,
     run.y+(run.count-1)*run.dy+Math.sin(run.angle)*distance,run.angle,'echo');
   }
  } else for(let i=0;i<(name==='title'?9:10);i++){
   const angle=i%2?-2.58:0.56;
   game.bullets.spawn(range(rng,180,1110),range(rng,170,700),angle,'echo');
  }
  if(name!=='title'){
   const p=game.player;
   for(let i=1;i<=3;i++)game.bullets.spawn(p.x+Math.cos(p.angle)*i*65,p.y+Math.sin(p.angle)*i*65,p.angle,'live');
   game.particles.muzzle(p.x+Math.cos(p.angle)*24,p.y+Math.sin(p.angle)*24,p.angle,C.cyan);
  }
  burst(name==='title'?880:470,name==='title'?340:300,C.orange);
  if(name!=='title')game.particles.score(470,270,100);
 }
 if(name==='play'){
  const boss=enemy('warden',905,300);boss.hp=Math.round(boss.maxHp*0.62);burst(520,470,C.echo);
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12;for(const d of [52,104])game.bullets.spawn(520+Math.cos(a)*d,470+Math.sin(a)*d,a,'burst');}
  game.comboChain=9;game.comboTimer=1.8;
 }
 if(name==='upgrade'){game.state='upgrade';game.choices=['deep','twin','overclock'].map(id=>UPGRADE_POOL.find(u=>u.id===id));game.upgrades={twin:0,deep:2,cryo:0,overclock:0,pierce:0,resonant:0};game.comboChain=6;game.comboTimer=1.8;}
 return true;
}
