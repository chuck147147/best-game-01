import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const source = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
mkdirSync(output, { recursive: true });
for (const name of ['game', 'screenshots']) {
  if (resolve(source, name) !== join(output, name)) {
    cpSync(join(source, name), join(output, name), { recursive: true });
  }
}
writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
