// data.js — loads the guide's data files and answers questions about them.
//
// The app is fully offline: the only fetches it ever makes are relative
// paths under app/ (data/trophies.json and data/panels.json), served from
// the same static server as index.html. Nothing here touches the network.
//
// trophies.json shape (one item per trophy):
//   name, description, grade, kind, hidden, missable, verified,
//   roadmap_stage, overlap100, guide, steps[], sources[{name, url}],
//   counts {target, total} (only for trophies PlayStation counts).
// panels.json shape: { roadmap[], missables, glitch, launchStatus,
//   disagreements[], warnings[] }.

let trophiesCache = null;
let panelsCache = null;

async function fetchJson(relativePath) {
  const response = await fetch(relativePath);
  if (!response.ok) {
    throw new Error("Could not load " + relativePath + " (HTTP " + response.status + ")");
  }
  return response.json();
}

/** Load (and cache) the 55 trophies. Returns the array of trophy objects. */
export async function loadTrophies() {
  if (!trophiesCache) {
    const data = await fetchJson("data/trophies.json");
    trophiesCache = Array.isArray(data) ? data : data.trophies;
  }
  return trophiesCache;
}

/** Load (and cache) the roadmap / missables / glitch / status panels. */
export async function loadPanels() {
  if (!panelsCache) {
    panelsCache = await fetchJson("data/panels.json");
  }
  return panelsCache;
}

/** Find one trophy by its exact official name (null when not found). */
export function trophyByName(name) {
  if (!trophiesCache) return null;
  return trophiesCache.find((trophy) => trophy.name === name) || null;
}

/** How many trophies of each grade the list holds: { Platinum: 1, ... }. */
export function gradeCounts(trophies) {
  const counts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  for (const trophy of trophies) {
    if (Object.hasOwn(counts, trophy.grade)) counts[trophy.grade] += 1;
  }
  return counts;
}

/** How many trophies of each kind the list holds: story, crime, ... */
export function kindCounts(trophies) {
  const counts = {};
  for (const trophy of trophies) {
    counts[trophy.kind] = (counts[trophy.kind] || 0) + 1;
  }
  return counts;
}

/** Trophies whose unlock method is confirmed or reported (not unknown). */
export function confirmedCount(trophies) {
  return trophies.filter((trophy) => trophy.verified !== "unknown").length;
}

/** The number PlayStation wants for a count trophy, or null when it has none. */
export function countTarget(trophy) {
  return trophy.counts ? trophy.counts.target : null;
}

/** The world total behind a count trophy (e.g. 397 stunts), or null. */
export function countTotal(trophy) {
  return trophy.counts ? trophy.counts.total : null;
}

/** Short human label for how a trophy overlaps the 100% completion list. */
export function overlapLabel(trophy) {
  if (trophy.overlap100 === "auto") return "Auto-covered by 100% completion";
  if (trophy.overlap100 === "partial") return "Partly covered by 100% completion";
  return "Separate from 100% completion";
}

/** All trophies assigned to one roadmap stage (1-7), in list order. */
export function stageTrophies(trophies, stage) {
  return trophies.filter((trophy) => trophy.roadmap_stage === stage);
}

/** How much of a count trophy is still left (null when it has no count). */
export function remainingCount(trophy, done) {
  const target = countTarget(trophy);
  if (target === null) return null;
  return Math.max(0, target - (done || 0));
}

/** Unique source names cited anywhere in the trophy list, for the stats page. */
export function allSourceNames(trophies) {
  const names = new Set();
  for (const trophy of trophies) {
    for (const source of trophy.sources || []) names.add(source.name);
  }
  return [...names].sort();
}
