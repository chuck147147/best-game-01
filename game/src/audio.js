import { AUDIO } from './config.js';
export class SoundEngine {
 constructor() { this.context=null; this.muted=false; }
 resume() {
  if(!this.context) {
   const Audio = window.AudioContext || window.webkitAudioContext; if(!Audio)return;
   this.context=new Audio(); this.master=this.context.createGain(); this.master.gain.value=this.muted?0:AUDIO.volume; this.master.connect(this.context.destination);
   this.noise=this.context.createBuffer(1,this.context.sampleRate,this.context.sampleRate);
   const data=this.noise.getChannelData(0); for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  this.context.resume().catch(()=>{});
 }
 toggle() { this.muted=!this.muted; if(this.master)this.master.gain.setTargetAtTime(this.muted?0:AUDIO.volume,this.context.currentTime,0.02); }
 tone(frequency,end,duration,volume=0.3,type='sine',delay=0) {
  if(!this.context||this.context.state!=='running')return;
  const t=this.context.currentTime+delay, osc=this.context.createOscillator(), gain=this.context.createGain();
  osc.type=type; osc.frequency.setValueAtTime(frequency,t); osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
  gain.gain.setValueAtTime(volume,t); gain.gain.exponentialRampToValueAtTime(0.001,t+duration);
  osc.connect(gain); gain.connect(this.master); osc.start(t); osc.stop(t+duration);
 }
 hiss(duration,volume) {
  if(!this.context||this.context.state!=='running')return;
  const source=this.context.createBufferSource(), gain=this.context.createGain(), filter=this.context.createBiquadFilter(), t=this.context.currentTime;
  source.buffer=this.noise; filter.type='lowpass'; filter.frequency.value=1800;
  gain.gain.setValueAtTime(volume,t); gain.gain.exponentialRampToValueAtTime(0.001,t+duration);
  source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start(t); source.stop(t+duration);
 }
 shoot() { this.tone(780,230,0.12,0.22,'triangle'); this.tone(1300,650,0.06,0.08); }
 echoShoot(index) { const p=AUDIO.echoPitch**index,v=AUDIO.echoDecay**index; this.tone(780*p,230*p,0.18,0.16*v,'triangle'); this.tone(1300*p,650*p,0.09,0.06*v); }
 explosion(big=false) { this.tone(big?95:150,25,big?0.45:0.22,0.4); this.hiss(big?0.35:0.16,big?0.5:0.25); }
 playerHurt() { this.hiss(0.4,0.6); this.tone(180,35,0.45,0.5,'sawtooth'); }
 waveStart() { [330,440,660].forEach((f,i)=>this.tone(f,f,0.24,0.2,'sine',i*0.09)); }
 gameOver() { [330,260,165,82].forEach((f,i)=>this.tone(f,f*0.7,0.5,0.25,'triangle',i*0.15)); }
 uiClick() { this.tone(650,950,0.07,0.18); }
}
