// LEONIDA PLATINUM ATLAS — gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (ES modules, CSS, no build step), offline — it loads nothing over the
// network, and its trophy list and guides are app/data/trophies.json, the panels are
// app/data/panels.json, and the easter eggs / bugs / weird items are
// app/data/easter-eggs.json. This program hands the entry in: it copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte
// for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clean ONLY the contents of the output directory — never the directory itself.
//
// Why this matters: the grader runs this program as an unprivileged user (uid 65534)
// with /output's parent directory (/) not writable by that user. The previous round's
// build removed /output itself and then tried to recreate it, which failed with EACCES
// on the parent and the whole grading run exited 1. Deleting the directory's children
// one by one needs write permission on /output only, which the grader grants, so the
// program exits 0 in the grader's sandbox exactly as it does as root.
//
// A second trap, found by testing as user nobody: mkdirSync(dir, { recursive: true })
// ALSO fails with EACCES when the directory already exists but its parent is not
// writable by the caller (Linux checks the parent's write permission first), so the
// directory is only created when it does not exist yet — never unconditionally.
function cleanOutput(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

cleanOutput(out);
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
