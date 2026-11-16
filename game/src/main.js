import { WIDTH, HEIGHT, MAX_DT } from './config.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
const canvas=document.getElementById('game');
const sound=new SoundEngine();
const input=new Input(canvas,()=>sound.resume());
const params=new URLSearchParams(location.search);
const seed=params.has('seed')?Number(params.get('seed')):Date.now();
const game=new Game(input,sound,seed);
window.ECHO_ARENA=game;
const renderer=new Renderer(canvas);
function resize() {
 const scale=Math.min(innerWidth/WIDTH,innerHeight/HEIGHT),dpr=Math.min(devicePixelRatio||1,3);
 canvas.style.width=`${WIDTH*scale}px`;canvas.style.height=`${HEIGHT*scale}px`;
 canvas.width=Math.round(WIDTH*scale*dpr);canvas.height=Math.round(canvas.width*HEIGHT/WIDTH);
}
window.addEventListener('resize',resize);resize();
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!shotFrozen)game.pause();input.clear();}});
window.addEventListener('blur',()=>{if(!shotFrozen)game.pause();});
let shotFrozen=false;
if(params.has('shot')) {
 try {
  const shots=await import('./shots.js');
  shotFrozen=shots.stageShotScene({game,name:params.get('shot'),seed});
 } catch(error) { console.info('Optional screenshot scene unavailable:',error.message); }
}
let previous=performance.now();
function frame(now) {
 const dt=Math.min(MAX_DT,Math.max(0,(now-previous)/1000));previous=now;
 if(!shotFrozen)game.update(dt);renderer.draw(game);input.endFrame();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
