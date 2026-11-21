// main.ts — entry build script: copies the static app plus the screenshot
// set into the output folder, then produces dossier.json through the kit's
// buildDossier helper. Plain Node 22, stdlib only, no network, no bundler.
//
// Two hard rules live here and must never be weakened:
//  A. emptyOutDir wipes only what sits INSIDE the output folder. The folder
//     itself is never deleted, because the grader may have created it and
//     cannot recreate a missing parent.
//  B. makeDirIfNeeded only creates a folder when it is not already there,
//     because mkdir on an existing folder errors when the parent is readonly.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const BASE_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function makeDirIfNeeded(folder: string): void {
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
}

function emptyOutDir(folder: string): void {
  if (!existsSync(folder)) return;
  for (const name of readdirSync(folder)) {
    rmSync(join(folder, name), { recursive: true, force: true });
  }
}

function run(): void {
  makeDirIfNeeded(OUT_DIR);
  emptyOutDir(OUT_DIR);
  cpSync(join(BASE_DIR, 'app'), join(OUT_DIR, 'app'), { recursive: true });
  cpSync(join(BASE_DIR, 'screenshots'), join(OUT_DIR, 'screenshots'), { recursive: true });
  const dossier = buildDossier(OUT_DIR, DOSSIER_LIMITS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
  console.log(`dossier written: ${join(OUT_DIR, 'dossier.json')} (${dossier.length} bytes)`);
}

run();
