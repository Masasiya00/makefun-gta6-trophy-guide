// main.ts — assemble the submission output: copy the guide app and the
// screenshots into the output folder, then write dossier.json with the
// kit-provided buildDossier helper. Node 22, standard library only.
// Run: MAKEFUN_OUTPUT_DIR=out node main.ts
import { buildDossier } from "./vendor/makefun-frontend.ts";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname ?? ".");
const OUT = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : "/output";

/* Fix A — empty a folder by removing what is inside it, never the folder
   itself. The grader owns /output; deleting it fails when the parent
   directory is not writable by us, so we only clear its contents. */
function emptyDirContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

/* Fix B — only create a directory when it is not there yet. Calling
   mkdir on a directory the grader already made for us throws, so we
   skip the call when the path already exists. */
function mkdirIfMissing(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function run(): void {
  mkdirIfMissing(OUT);
  emptyDirContents(OUT);
  cpSync(join(ROOT, "app"), join(OUT, "app"), { recursive: true });
  cpSync(join(ROOT, "screenshots"), join(OUT, "screenshots"), { recursive: true });
  const dossier = buildDossier(OUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT, "dossier.json"), dossier);
  console.log(`wrote ${join(OUT, "dossier.json")} (${dossier.length} bytes)`);
}

run();
