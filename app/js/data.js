// data.js — loads the guide's own JSON files (local, relative fetches only)
// and normalises them into one plain object the other modules consume.
// No network beyond this server: every fetch is a relative 'data/...' path.

export const SOURCE_NAMES = {
  PP: 'PowerPyx',
  EXO: 'Exophase',
  GM: 'gamemapa',
  DM: 'damnmodz',
  VAL: 'vanotherlevel',
  OF: 'ofzenandcomputing',
  GS: 'GameSpot',
};

/** Turn a short source code from a step into its full display name. */
export function sourceName(code) {
  return SOURCE_NAMES[code] || code;
}

function normaliseTrophy(raw) {
  const steps = Array.isArray(raw.steps) ? raw.steps : [];
  return {
    id: raw.name,
    name: raw.name,
    description: raw.description || '',
    grade: (raw.grade || 'bronze').toLowerCase(),
    hidden: raw.hidden === true,
    kind: (raw.kind || 'activities').toLowerCase(),
    missable: raw.missable === true,
    roadmapStage: Number(raw.roadmap_stage) || 0,
    guide: raw.guide || '',
    steps: steps.map((s) => ({
      text: s.text || '',
      sources: Array.isArray(s.sources) ? s.sources.map(sourceName) : [],
    })),
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    verified: (raw.verified || 'unknown').toLowerCase(),
    overlap100: raw.overlap100 === true,
    counts: raw.counts || raw.counter || null,
  };
}

function normalisePanels(raw) {
  return {
    roadmap: Array.isArray(raw.roadmap) ? raw.roadmap : [],
    missables: Array.isArray(raw.missables) ? raw.missables : [],
    glitch: raw.glitch || null,
    launch: raw.launch || null,
    disagreements: Array.isArray(raw.disagreements) ? raw.disagreements : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
  };
}

function normaliseEggs(raw) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    items: items.map((e) => ({
      title: e.title || 'Untitled',
      kind: (e.kind || 'egg').toLowerCase(),
      status: (e.status || 'reported').toLowerCase(),
      text: e.text || '',
      sources: Array.isArray(e.sources) ? e.sources : [],
    })),
  };
}

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to load ' + path + ' (' + res.status + ')');
  return res.json();
}

/**
 * Load all three data files and return { trophies, panels, eggs }.
 * trophies is an array of normalised trophy objects in file order.
 */
export async function loadGuideData() {
  const [trophyDoc, panelDoc, eggDoc] = await Promise.all([
    loadJson('data/trophies.json'),
    loadJson('data/panels.json'),
    loadJson('data/easter-eggs.json'),
  ]);
  const rawTrophies = Array.isArray(trophyDoc)
    ? trophyDoc
    : Array.isArray(trophyDoc.trophies)
      ? trophyDoc.trophies
      : [];
  return {
    trophies: rawTrophies.map(normaliseTrophy),
    panels: normalisePanels(panelDoc || {}),
    eggs: normaliseEggs(eggDoc || {}),
  };
}

/** Total cited steps across all trophies (for the header stat). */
export function countCitedSteps(trophies) {
  return trophies.reduce((n, t) => n + t.steps.length, 0);
}

/** How many steps cite two or more sources. */
export function countMultiSourceSteps(trophies) {
  return trophies.reduce(
    (n, t) => n + t.steps.filter((s) => s.sources.length >= 2).length,
    0,
  );
}
