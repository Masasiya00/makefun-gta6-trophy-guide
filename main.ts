// main.ts — builds the entry: copies app/ and screenshots/ into /output
// and writes /output/dossier.json via the kit's buildDossier.
// Node 22, standard library only. No network, no build step.
//
// EACCES fixes (kept exactly as specified):
//  1. cleanOutputDir clears only the CONTENTS of the output dir — it never
//     removes the directory itself, so a pre-created /output keeps working
//     for a user who cannot re-create it.
//  2. ensureDir creates a directory only when it does not exist yet.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function cleanOutputDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main(): void {
  ensureDir(OUTPUT_DIR);
  cleanOutputDir(OUTPUT_DIR);
  cpSync(join(REPO_ROOT, 'app'), join(OUTPUT_DIR, 'app'), { recursive: true });
  cpSync(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`dossier written: ${join(OUTPUT_DIR, 'dossier.json')} (${dossier.length} bytes)`);
}

main();
