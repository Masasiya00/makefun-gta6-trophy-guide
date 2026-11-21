// LEONIDA PLATINUM ATLAS — the hand-in program for the gta6-trophy-guide-01
// bounty (Node 22, standard library only). It copies this repository's app/
// and screenshots/ into the output directory and writes
// /output/dossier.json with the vendored make.fun library, so the scorer can
// rebuild the same dossier byte for byte from the same files.
//
// Two traps this program deliberately avoids, both learned the hard way in
// earlier rounds (the grader runs as uid 65534, whose parent directory /
// is not writable, so anything that needs a write to / fails EACCES):
//   1. cleanOutput() only ever deletes the children of the output directory,
//      never the directory itself. Deleting the directory would need a
//      write to its parent, which the grader cannot do.
//   2. The output directory is created with mkdirSync only when it does
//      not already exist. mkdirSync({ recursive: true }) on a directory
//      that already exists also fails EACCES without parent write access.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Remove every child of a directory, leaving the directory itself standing.
function cleanOutput(dir: string): void {
  if (!existsSync(dir)) return;
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

if (!existsSync(out)) mkdirSync(out, { recursive: true });
cleanOutput(out);
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
if (!existsSync(join(out, 'screenshots'))) mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
