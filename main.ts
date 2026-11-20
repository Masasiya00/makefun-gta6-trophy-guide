// main.ts — hands the LEONIDA PLATINUM ATLAS guide in to make.fun.
//
// Node 22, standard library only. It mirrors this repository's app/ and
// screenshots/ into the output directory and writes dossier.json with
// the vendored make.fun library, exactly as the scorer rebuilds it:
//   mkdir -p /tmp/out-w2 && MAKEFUN_OUTPUT_DIR=/tmp/out-w2 node main.ts
// Inside the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.
// The program runs twice and both runs must write identical bytes, so
// the copy is deterministic: stale output trees are removed first, and
// nothing here depends on the clock, the network, or the environment
// beyond the output directory override above.
//
// vendor/makefun-frontend.ts is the kit's copy, unchanged; dossier.json
// is written from the Uint8Array buildDossier returns, byte for byte
// (never parsed back to JSON — that would change the bytes).

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root: the folder that holds this file.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The dossier caps from the competition gate: at most 160 KiB of text,
// 4 screenshots of at most 256 KiB each, app/ at most 993 entries and
// 48 MiB. buildDossier refuses an entry that breaks them.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

/** Fail fast with a plain message when the guide folder is missing. */
function requireFolder(name: string): void {
  if (!existsSync(join(repoRoot, name))) {
    throw new Error(`Missing ${name}/ beside main.ts — nothing to hand in.`);
  }
}

requireFolder("app");

/** Remove a previous output tree (if any) so a rerun cannot keep stale files. */
function cleanOutput(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

/** Copy one source folder into the output, skipping nothing. */
function mirrorFolder(name: string): void {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) {
    mkdirSync(to, { recursive: true });
    return;
  }
  cpSync(from, to, { recursive: true });
}

cleanOutput(outDir);
mirrorFolder("app");
mirrorFolder("screenshots");

const dossier = buildDossier(outDir, DOSSIER_OPTIONS);
writeFileSync(join(outDir, "dossier.json"), dossier);

const dossierBytes = statSync(join(outDir, "dossier.json")).size;
console.log(`dossier.json written: ${dossierBytes} bytes to ${outDir}`);
