export const WIDTH = 1280, HEIGHT = 800;
export const ARENA = { left: 42, right: 1238, top: 112, bottom: 752 };
export const PALETTE = { floor:'#06040f', grid:'#171329', cyan:'#22d3ee', white:'#a5f3fc', echo:'#a78bfa', magenta:'#f471b5', orange:'#fb923c', red:'#f87171', text:'#eeeafa', muted:'#8f89aa' };
export const PLAYER = { radius:14, hp:3, acceleration:2400, damping:11, speed:330, fireInterval:1/4.5, invincibility:1.2, recoil:48, muzzle:24 };
export const BULLET = { speed:620, echoSpeed:430, radius:4, poolSize:512, trail:24 };
export const ECHO = { interval:3, replays:4, cap:44, warning:0.5, radius:17 };
export const ENEMY = {
 chaser:{radius:18,speed:92,hp:1,score:50,color:PALETTE.magenta},
 mini:{radius:10,speed:160,hp:1,score:30,color:PALETTE.magenta},
 splitter:{radius:26,speed:57,hp:3,score:100,color:PALETTE.orange},
 dasher:{radius:20,speed:75,hp:2,score:80,color:PALETTE.red}
};
export const WAVES = { baseCount:4, countGrowth:2, speedGrowth:0.065, spawnWarning:0.85, spawnSpacing:0.26, intermission:1.8, bonus:25 };
export const DASH = { distance:260, charge:1.35, duration:0.48, cooldown:1.5, speed:510 };
export const EFFECTS = { sparkLife:0.3, shardLife:0.65, ringLife:0.5, textLife:1, damageShake:13, explosionShake:3, flash:0.5 };
export const AUDIO = { volume:0.23, echoDecay:0.67, echoPitch:0.77 };
export const MAX_DT = 1/30;
