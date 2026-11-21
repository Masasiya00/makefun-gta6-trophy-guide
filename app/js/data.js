// data.js — loads the guide's JSON data files and derives the audit numbers.
// Every figure the audit strip shows is computed here from the loaded data,
// never hard-coded, so the strip stays honest when the data changes.

const DATA_FILES = {
  trophies: 'data/trophies.json',
  sources: 'data/sources.json',
  panels: 'data/panels.json',
  eggs: 'data/easter-eggs.json',
};

/** Fetch one JSON data file, relative to app/. Throws with the file name. */
export async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`cannot load ${path}: HTTP ${res.status}`);
  return res.json();
}

/** Load all four data files in parallel. Returns { trophies, sources, panels, eggs }. */
export async function loadGuideData() {
  const [trophies, sources, panels, eggs] = await Promise.all([
    loadJson(DATA_FILES.trophies),
    loadJson(DATA_FILES.sources),
    loadJson(DATA_FILES.panels),
    loadJson(DATA_FILES.eggs),
  ]);
  return { trophies, sources, panels, eggs };
}

/** Map a source code (e.g. "PP") to its source record, or null. */
export function sourceByCode(sources, code) {
  return sources.find((s) => s.code === code) ?? null;
}

/** All steps of all trophies, flattened, each with its trophy attached. */
export function allSteps(trophies) {
  const out = [];
  for (const t of trophies) {
    for (const step of t.steps ?? []) out.push({ trophy: t, step });
  }
  return out;
}

/** Total pages across every source record. */
export function totalPages(sources) {
  return sources.reduce((n, s) => n + (s.pages?.length ?? 0), 0);
}

/**
 * Audit numbers, computed live from the data — the same counting method as
 * the R9 count script:
 * - claims: every trophy step (495) + every panel claim (155) + every
 *   easter-egg item (86) = 736. A panel claim is one roadmap stage, one
 *   trophy listed in a roadmap stage, one missable, one glitch step, one
 *   launch item, TWO per dispute (pro + con), one warning, one farming tip.
 *   (glitch.alternatives and glitch.warning are guidance, not claims.)
 * - sourcedClaims: claims naming at least one source (736 — every claim is
 *   sourced; a roadmap trophy counts as sourced when the trophy it names
 *   has at least one sourced step).
 * - multiSourceClaims: claims naming two or more sources (681). Roadmap
 *   trophy references count as claims but never as 2+ claims.
 * - sourceCount / pageCount: sources and pages read
 * - disputeCount: dispute panels
 * - trophyTotal / confirmedTotal / hiddenTotal: trophies, how many are
 *   verified "confirmed", how many are hidden on PS5
 */
export function auditStats(data) {
  const trophies = data.trophies.trophies;
  const sources = data.sources.sources;
  const panels = data.panels ?? {};
  const eggs = data.eggs.items ?? [];
  const steps = allSteps(trophies);
  const hasSrc = (n) => (it) => (it.src?.length ?? 0) >= n;

  const roadmap = panels.roadmap ?? [];
  const missables = panels.missables ?? [];
  const glitchSteps = panels.glitch?.steps ?? [];
  const launch = panels.launch ?? [];
  const disputes = panels.disputes ?? [];
  const warnings = panels.warnings ?? [];
  const farming = panels.farming ?? [];

  const roadmapTrophyRefs = roadmap.flatMap((r) => r.trophies ?? []);
  const panelClaims =
    roadmap.length +
    roadmapTrophyRefs.length +
    missables.length +
    glitchSteps.length +
    launch.length +
    2 * disputes.length +
    warnings.length +
    farming.length;
  const panelItems = [...roadmap, ...missables, ...glitchSteps, ...launch, ...warnings, ...farming];

  // A roadmap trophy reference is sourced when the trophy it names has at
  // least one sourced step; it never counts toward the 2+ total.
  const byName = new Map(trophies.map((t) => [t.name, t]));
  const roadmapSourced = roadmapTrophyRefs.filter((name) => {
    const t = byName.get(name);
    return (t?.steps ?? []).some((s) => (s.src?.length ?? 0) >= 1);
  }).length;

  return {
    claims: steps.length + panelClaims + eggs.length,
    sourcedClaims:
      steps.filter((s) => (s.step.src?.length ?? 0) >= 1).length +
      panelItems.filter(hasSrc(1)).length +
      roadmapSourced +
      disputes.filter(hasSrc(1)).length * 2 +
      eggs.filter(hasSrc(1)).length,
    multiSourceClaims:
      steps.filter((s) => (s.step.src?.length ?? 0) >= 2).length +
      panelItems.filter(hasSrc(2)).length +
      disputes.filter(hasSrc(2)).length * 2 +
      eggs.filter(hasSrc(2)).length,
    sourceCount: sources.length,
    pageCount: totalPages(sources),
    disputeCount: disputes.length,
    trophyTotal: trophies.length,
    confirmedTotal: trophies.filter((t) => t.verified === 'confirmed').length,
    hiddenTotal: trophies.filter((t) => t.hidden).length,
    eggTotal: eggs.length,
  };
}

/** Grade order for sorting and filter labels: platinum first. */
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

/** Human label for a grade. */
export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

/** Human label for a verification status. */
export function verifiedLabel(verified) {
  if (verified === 'confirmed') return 'Terkonfirmasi';
  if (verified === 'reported') return 'Dilaporkan';
  return 'Belum terverifikasi';
}

/** Human label for a 100%-checklist overlap value. */
export function overlapLabel(overlap) {
  if (overlap === 'auto') return 'Otomatis selesai saat 100%';
  if (overlap === 'partial') return 'Sebagian tercakup 100%';
  return 'Terpisah dari 100%';
}
