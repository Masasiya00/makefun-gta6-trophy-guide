// main.ts — hand the guide in: copy app/ and screenshots/ to the output
// directory and write /output/dossier.json with the kit's buildDossier.
// Node 22, standard library only. Run: MAKEFUN_OUTPUT_DIR=out node main.ts
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

const REPO_ROOT = resolve(import.meta.dirname ?? ".");
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : "/output";

/* EACCES fix 1: clear only the CONTENTS of the output directory, never the
   directory itself — the grader owns /output and deleting it breaks the
   run when the parent directory is not writable by us. */
function cleanOutputDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

/* EACCES fix 2: create a directory only when it does not exist yet, so we
   never mkdir over a directory the grader already created for us. */
function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function main(): void {
  ensureDir(OUTPUT_DIR);
  cleanOutputDir(OUTPUT_DIR);
  const appSource = join(REPO_ROOT, "app");
  const shotsSource = join(REPO_ROOT, "screenshots");
  cpSync(appSource, join(OUTPUT_DIR, "app"), { recursive: true });
  cpSync(shotsSource, join(OUTPUT_DIR, "screenshots"), { recursive: true });
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUTPUT_DIR, "dossier.json"), dossier);
  console.log(`wrote ${join(OUTPUT_DIR, "dossier.json")} (${dossier.length} bytes)`);
}

main();
