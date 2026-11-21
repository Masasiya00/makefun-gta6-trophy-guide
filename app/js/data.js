// data.js — loads the four local JSON files and audits the claims.
// Strict counting rule: a claim is any object that carries a `src` list.
// Trophy names inside roadmap stages are NOT claims; each dispute side's
// objects are counted on their own because each one carries its own src.

const DATA_FILES = ['trophies.json', 'sources.json', 'panels.json', 'easter-eggs.json'];

// The twelve main-story beats the spoiler shield hides by default.
// Once a trophy is marked earned, its real name and description show again.
export const SPOILER_STORY = new Set([
  'Just Like Paradise',
  'Paradise Lost',
  'T**s Ass Drug Money',
  'Vice City, Baby!',
  'Top Of The World, Ma',
  'You Gotta Know When to Get Off',
  'Trust',
  'Break the Bank',
  'Family Matters',
  'DWNFALL',
  'Hi-Jacked',
  'Snow Storm',
]);

export function isSpoilerHidden(trophy, spoilerOn, earned) {
  if (!spoilerOn) return false;
  if (earned) return false;
  return trophy.kind === 'story' && SPOILER_STORY.has(trophy.name);
}

export function displayName(trophy, spoilerOn, earned) {
  return isSpoilerHidden(trophy, spoilerOn, earned) ? '??? (story trophy)' : trophy.name;
}

export function displayDescription(trophy, spoilerOn, earned) {
  return isSpoilerHidden(trophy, spoilerOn, earned)
    ? 'Hidden to protect the story. Mark this trophy earned to reveal it.'
    : trophy.description;
}

export async function loadData() {
  const out = {};
  for (const file of DATA_FILES) {
    const res = await fetch(`data/${file}`);
    if (!res.ok) throw new Error(`Could not load data/${file} (${res.status})`);
    out[file.replace('.json', '')] = await res.json();
  }
  return {
    trophies: out.trophies.trophies,
    sources: out.sources.sources,
    panels: out.panels,
    eggs: out['easter-eggs'].items,
  };
}

// Gather every claim object in the dataset. Each entry keeps where it came
// from so the audit strip and the detail views can show the same numbers.
export function collectAllClaims(data) {
  const claims = [];
  const push = (obj, where, text) => {
    if (!obj || !Array.isArray(obj.src)) return;
    claims.push({ src: obj.src, where, text: text ?? obj.text ?? obj.window ?? obj.trophy ?? '' });
  };

  for (const t of data.trophies) {
    for (const step of t.steps || []) push(step, `trophy:${t.name}`, step.text);
  }
  const p = data.panels;
  for (const stage of p.roadmap || []) {
    for (const c of stage.claims || []) push(c, `roadmap:stage ${stage.stage}`, c.text);
  }
  for (const c of p.glitch?.claims || []) push(c, 'glitch', c.text);
  for (const c of p.glitch?.pro || []) push(c, 'glitch:pro', c.text);
  for (const c of p.glitch?.con || []) push(c, 'glitch:con', c.text);
  for (const chapter of p.missables?.grid || []) {
    for (const item of chapter.items || []) push(item, `missables:${chapter.chapter}`, `${item.trophy} — ${item.window}`);
  }
  for (const c of p.missables?.save_strategy || []) push(c, 'missables:save strategy', c.text);
  for (const c of p.warnings || []) push(c, 'warnings', c.text);
  for (const c of p.farming || []) push(c, 'farming', c.text);
  for (const c of p.launch_status || []) push(c, 'launch status', c.text);
  for (const d of p.disputes || []) {
    for (const c of d.pro || []) push(c, `dispute:${d.topic}:pro`, c.text);
    for (const c of d.con || []) push(c, `dispute:${d.topic}:con`, c.text);
  }
  for (const egg of data.eggs || []) push(egg, `egg:${egg.title}`, egg.text);
  return claims;
}

export function computeAudit(data) {
  const claims = collectAllClaims(data);
  const total = claims.length;
  const cited = claims.filter((c) => c.src.length >= 1).length;
  const twoPlus = claims.filter((c) => c.src.length >= 2).length;
  const pages = data.sources.reduce((n, s) => n + (s.pages ? s.pages.length : 0), 0);
  const steps = data.trophies.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const stepTwoPlus = data.trophies.reduce(
    (n, t) => n + (t.steps || []).filter((s) => s.src && s.src.length >= 2).length, 0);
  const eggsTwoPlus = (data.eggs || []).filter((e) => e.src && e.src.length >= 2).length;
  return {
    total, cited, twoPlus,
    sources: data.sources.length,
    pages,
    steps, stepTwoPlus,
    eggs: data.eggs.length, eggsTwoPlus,
    disputes: (data.panels.disputes || []).length,
    trophies: data.trophies.length,
  };
}

// ---- lookups ---------------------------------------------------------------

export function sourceByCode(data, code) {
  return data.sources.find((s) => s.code === code) || null;
}

export function sourceName(data, code) {
  const s = sourceByCode(data, code);
  return s ? s.name : code;
}

export function trophyByName(data, name) {
  return data.trophies.find((t) => t.name === name) || null;
}

export function disputesForTrophy(data, name) {
  const needle = name.toLowerCase();
  return (data.panels.disputes || []).filter((d) => d.topic.toLowerCase().includes(needle));
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
