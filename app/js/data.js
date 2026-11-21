// Leonida Platinum Atlas — data layer (Round 7, written fresh).
// Loads the four JSON banks and derives the audit numbers the header
// strip shows. Only relative fetches of local files; no network.
export async function loadData() {
  const [trophies, sources, panels, eggs] = await Promise.all([
    fetch('./data/trophies.json').then((r) => r.json()),
    fetch('./data/sources.json')
      .then((r) => r.json())
      .catch(() => ({ sources: [] })),
    fetch('./data/panels.json').then((r) => r.json()),
    fetch('./data/easter-eggs.json').then((r) => r.json()),
  ]);
  const byCode = new Map((sources.sources || []).map((s) => [s.code, s]));
  const byName = new Map((trophies.trophies || []).map((t) => [t.name, t]));
  return {
    trophies: trophies.trophies || [],
    sources: sources.sources || [],
    panels: normalizePanels(panels),
    eggs: eggs.items || [],
    byCode,
    byName,
  };
}

function hasSrc(src) {
  return Array.isArray(src) && src.length > 0;
}

// Normalize the panels bank into the canonical shape this app renders.
// Accepts the R7 schema (disputes / launch_status / farming) and tolerates
// the older key spellings, so a bank that lands with either spelling still
// renders instead of showing empty sections.
function normalizePanels(p) {
  const raw = p || {};
  return {
    roadmap: raw.roadmap || [],
    missables: raw.missables || {},
    glitch: raw.glitch || {},
    launch_status: raw.launch_status || raw.launch || [],
    disputes: raw.disputes || raw.disagreements || [],
    warnings: raw.warnings || [],
    farming: raw.farming || [],
  };
}

// Every claim = one trophy step + one panel claim + one easter-egg item.
// Cited = has >=1 source code; twoPlus = has >=2 source codes.
export function auditStats(data) {
  let total = 0;
  let cited = 0;
  let twoPlus = 0;
  const count = (src) => {
    total++;
    if (hasSrc(src)) {
      cited++;
      if (src.length >= 2) twoPlus++;
    }
  };
  for (const t of data.trophies) for (const s of t.steps || []) count(s.src);
  const p = data.panels || {};
  for (const stage of p.roadmap || []) for (const c of stage.claims || []) count(c.src);
  for (const row of (p.missables || {}).grid || []) for (const it of row.items || []) count(it.src);
  for (const c of (p.missables || {}).save_strategy || []) count(c.src);
  for (const c of (p.glitch || {}).claims || []) count(c.src);
  for (const c of (p.glitch || {}).pro || []) count(c.src);
  for (const c of (p.glitch || {}).con || []) count(c.src);
  for (const c of p.launch_status || []) count(c.src);
  for (const d of p.disputes || []) {
    for (const c of d.pro || []) count(c.src);
    for (const c of d.con || []) count(c.src);
  }
  for (const c of p.warnings || []) count(c.src);
  for (const c of p.farming || []) count(c.src);
  for (const e of data.eggs || []) count(e.src);
  const pages = data.sources.reduce((n, s) => n + (s.pages || []).length, 0);
  const confirmed = data.trophies.filter((t) => t.verified === 'confirmed').length;
  const unknown = data.trophies.filter((t) => t.verified === 'unknown').length;
  return {
    total,
    cited,
    twoPlus,
    sources: data.sources.length,
    pages,
    confirmed,
    unknown,
    trophies: data.trophies.length,
  };
}

export function sourceNames(src, byCode) {
  return (src || []).map((c) => {
    const s = byCode.get(c);
    return s ? s.name : c;
  });
}

export function sourceTitle(src, byCode) {
  return sourceNames(src, byCode).join(', ');
}
