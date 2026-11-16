import { WIDTH } from './config.js';
export const CARD = { w:300, h:210, gap:36, y:330 };
export function cardRect(i){ const total=3*CARD.w+2*CARD.gap; return { x:(WIDTH-total)/2 + i*(CARD.w+CARD.gap), y:CARD.y, w:CARD.w, h:CARD.h }; }
export const UPGRADE_POOL = [
 {id:'twin',     name:'TWIN STREAM',    cn:'双生弹道', icon:'twin',     desc:'Fire +1 parallel shot. Every shot leaves its own echo.'},
 {id:'deep',     name:'DEEP ECHO',      cn:'回声延寿', icon:'deep',     desc:'Your echoes replay +2 more times before fading.'},
 {id:'cryo',     name:'CRYO ECHO',      cn:'急冻回声', icon:'cryo',     desc:'Echo hits slow enemies to 45% speed for 1.2 s.'},
 {id:'overclock',name:'OVERCLOCK CORE', cn:'过载核心', icon:'overclock',desc:'+12 echo node capacity for a denser web.'},
 {id:'pierce',   name:'PIERCING ROUNDS',cn:'穿透弹',   icon:'pierce',   desc:'Live shots pierce through +1 enemy.'},
 {id:'resonant', name:'RESONANT ECHO',  cn:'共振回声', icon:'resonant', desc:'Echo shots deal +1 damage.'},
 {id:'repair',   name:'HULL PATCH',     cn:'船体修复', icon:'repair',   desc:'Restore 1 hull. If hull is full, +300 points instead.'},
];
export function rollUpgrades(rng,count=3){ const pool=[...UPGRADE_POOL]; const out=[]; while(out.length<count&&pool.length){ out.push(pool.splice(Math.floor(rng()*pool.length),1)[0]); } return out; }
