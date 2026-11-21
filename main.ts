// main.ts — hands the guide in: copies app/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json
// with buildDossier from vendor/makefun-frontend.ts. Node 22, standard
// library only, no network, no build step.
//
// Two EACCES fixes live here (they made round 5 pass):
//  (a) cleanOutput removes only the CONTENTS of the output directory —
//      it never removes the output directory itself;
//  (b) mkdirSync runs only when the directory does not exist yet.

import { buildDossier } from './vendor/makefun-frontend.ts';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

/**
 * Empty the output directory without ever deleting the directory itself.
 * The platform may own /output (root-owned while we run as nobody), so
 * removing the directory and recreating it fails with EACCES; removing
 * only its entries works.
 */
function cleanOutput(outDir: string): void {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(outDir)) {
    rmSync(join(outDir, entry), { recursive: true, force: true });
  }
}

/** Make a directory only when it is missing (never mkdir an existing one). */
function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Copy a whole directory tree (files only, no symlinks) into dest. */
function copyTree(src: string, dest: string): number {
  ensureDir(dest);
  let copied = 0;
  for (const entry of readdirSync(src)) {
    const from = join(src, entry);
    const to = join(dest, entry);
    if (statSync(from).isDirectory()) {
      copied += copyTree(from, to);
    } else {
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

/** Build the hand-in: clean output, copy app/ + screenshots/, write the dossier. */
function build(): void {
  cleanOutput(OUTPUT_DIR);
  const appFiles = copyTree(join(REPO_ROOT, 'app'), join(OUTPUT_DIR, 'app'));
  const shotFiles = copyTree(
    join(REPO_ROOT, 'screenshots'),
    join(OUTPUT_DIR, 'screenshots'),
  );
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(
    'leonida-platinum-atlas: copied ' +
      appFiles +
      ' app files and ' +
      shotFiles +
      ' screenshots to ' +
      OUTPUT_DIR +
      '; dossier.json is ' +
      dossier.length +
      ' bytes.',
  );
}

build();
