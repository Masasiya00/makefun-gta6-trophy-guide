// Leonida Platinum Atlas — entry build (Round 7, written fresh).
// Copies app/ and screenshots/ into /output and writes /output/dossier.json
// with the kit's buildDossier, byte for byte the scorer's own copy.
// Run: node main.ts (Node 22, no flags, no install).
//
// EACCES fixes (kept from the round that passed run_completes):
//  - cleanOutput removes only the CONTENTS of /output, never the directory.
//  - the output directory is created only when it does not exist.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = '/output';

function cleanOutput() {
  if (!existsSync(OUT)) {
    mkdirSync(OUT);
    return;
  }
  for (const entry of readdirSync(OUT)) {
    rmSync(join(OUT, entry), { recursive: true, force: true });
  }
}

cleanOutput();
cpSync(join(ROOT, 'app'), join(OUT, 'app'), { recursive: true });
cpSync(join(ROOT, 'screenshots'), join(OUT, 'screenshots'), { recursive: true });

const dossier = buildDossier(OUT, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(OUT, 'dossier.json'), dossier);
console.log('wrote /output/dossier.json (' + Buffer.byteLength(dossier, 'utf8') + ' bytes)');
