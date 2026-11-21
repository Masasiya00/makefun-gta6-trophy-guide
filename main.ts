// main.ts — hands the Leonida Platinum Atlas in.
// Copies app/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with buildDossier from the kit's
// vendor/makefun-frontend.ts. Node standard library only; exits 0.
//
// Two EACCES fixes, learned from a round that failed run_completes:
//  1. cleanOutputDir removes only the CONTENTS of the output directory
//     (one rmSync per entry) and never removes the directory itself.
//  2. The output directory is created with mkdirSync recursive ONLY when
//     it does not already exist.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Remove every entry inside `dir`, never `dir` itself. */
function cleanOutputDir(dir: string): void {
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}
cleanOutputDir(outputDir);

cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`wrote ${outputDir}/dossier.json (${dossier.length} bytes)`);
