[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/chuck147147/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/chuck147147/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# ECHO ARENA

Your deadliest enemy is you, three seconds ago.

A neon survival arena where every shot leaves a ghost at its muzzle position. Each ghost replays that direction every three seconds, four times, and its violet bullets can kill enemies or you. Build a field of delayed fire, read its countdown rings, and keep moving as homing diamonds, splitting hexagons, and telegraphed dashers close in. After each cleared wave, draft one of seven echo-focused upgrades. Build combo scoring chains, with echo kills building the chain twice as fast. Dash with Shift/Space and shoot your own echo nodes to detonate them—the blast never harms you. Every fifth wave brings THE WARDEN, a boss with radial barrages and summons. Your firepower becomes the battlefield.

Move with WASD or arrow keys, aim with the mouse, and hold left click to fire. Shift/Space dashes; choose upgrades by click or keys 1–3. P pauses, M toggles sound. Click or Enter starts; click or R restarts after defeat. You have three hull points and a brief shield after damage. Live cyan shots are safe; violet echo shots are dangerous. Best score saves locally.

Serve `game/` with any static file server and open its index page. No dependencies, installation, build step, external assets, or network requests are needed for normal play.

For the make.fun hand-in, run `MAKEFUN_OUTPUT_DIR=/path/to/output node main.ts` with Node 22 supporting native TypeScript. The default output is `/output`. This copies `game/` and `screenshots/` and writes the kit's canonical `dossier.json`. The kit requires at least one real PNG/JPEG in `screenshots/`; the supplied empty directory needs captures before a final hand-in. Use `?shot=title&seed=123` (or `play`, `upgrade`, `over`) for deterministic frozen scenes rendered from real game state. Normal play is unchanged without `shot`.

MIT License — see LICENSE.
