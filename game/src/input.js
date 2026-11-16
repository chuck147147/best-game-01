import { WIDTH, HEIGHT } from './config.js';
export class Input {
 constructor(canvas, gesture) {
  this.keys = new Set(); this.pressed = new Set(); this.mouse = {x:WIDTH/2,y:HEIGHT/2}; this.down = false; this.clicked = false;
  window.addEventListener('keydown', e => {
   if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
   if (!e.repeat) this.pressed.add(e.code); this.keys.add(e.code); gesture();
  });
  window.addEventListener('keyup', e => this.keys.delete(e.code));
  canvas.addEventListener('pointermove', e => this.pointer(e,canvas));
  canvas.addEventListener('pointerdown', e => { if(e.button!==0)return; this.pointer(e,canvas); this.down=true; this.clicked=true; gesture(); });
  window.addEventListener('pointerup', () => this.down=false);
  window.addEventListener('blur', () => this.clear());
  canvas.addEventListener('contextmenu', e => e.preventDefault());
 }
 pointer(e,canvas) { const r=canvas.getBoundingClientRect(); this.mouse.x=(e.clientX-r.left)*WIDTH/r.width; this.mouse.y=(e.clientY-r.top)*HEIGHT/r.height; }
 get movement() { return {x:Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft')),y:Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))}; }
 get firing() { return this.down; }
 take(code) { const yes=this.pressed.has(code); this.pressed.delete(code); return yes; }
 endFrame() { this.pressed.clear(); this.clicked=false; }
 clear() { this.keys.clear(); this.pressed.clear(); this.down=false; this.clicked=false; }
}
