// data.js — fetches the four local JSON files and audits every claim.
// Strict counting rule: a claim is any object that carries a `src` list.
// Trophy names that merely appear inside a roadmap stage are NOT claims;
// each side of a dispute counts on its own, because each carries its own src.

const JSON_FILES = ['trophies.json', 'sources.json', 'panels.json', 'easter-eggs.json'];

// The twelve main-story beats the spoiler shield hides by default.
// Once a trophy is marked earned, its real name and description return.
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
  const loaded = {};
  for (const file of JSON_FILES) {
    const res = await fetch(`data/${file}`);
    if (!res.ok) throw new Error(`Could not load data/${file} (${res.status})`);
    loaded[file.replace('.json', '')] = await res.json();
  }
  return {
    trophies: loaded.trophies.trophies,
    sources: loaded.sources.sources,
    panels: loaded.panels,
    eggs: loaded['easter-eggs'].items,
  };
}

// Collect every claim object in the dataset. Each entry remembers where it
// came from so the audit strip and the detail views agree on the numbers.
export function collectAllClaims(data) {
  const claims = [];
  const add = (obj, where, text) => {
    if (!obj || !Array.isArray(obj.src)) return;
    claims.push({ src: obj.src, where, text: text ?? obj.text ?? obj.window ?? obj.trophy ?? '' });
  };

  for (const t of data.trophies) {
    for (const step of t.steps || []) add(step, `trophy:${t.name}`, step.text);
  }
  const p = data.panels;
  for (const stage of p.roadmap || []) {
    for (const c of stage.claims || []) add(c, `roadmap:stage ${stage.stage}`, c.text);
  }
  for (const c of p.glitch?.claims || []) add(c, 'glitch', c.text);
  for (const c of p.glitch?.pro || []) add(c, 'glitch:pro', c.text);
  for (const c of p.glitch?.con || []) add(c, 'glitch:con', c.text);
  for (const chapter of p.missables?.grid || []) {
    for (const item of chapter.items || []) add(item, `missables:${chapter.chapter}`, `${item.trophy} — ${item.window}`);
  }
  for (const c of p.missables?.save_strategy || []) add(c, 'missables:save strategy', c.text);
  for (const c of p.warnings || []) add(c, 'warnings', c.text);
  for (const c of p.farming || []) add(c, 'farming', c.text);
  for (const c of p.launch_status || []) add(c, 'launch status', c.text);
  for (const d of p.disputes || []) {
    for (const c of d.pro || []) add(c, `dispute:${d.topic}:pro`, c.text);
    for (const c of d.con || []) add(c, `dispute:${d.topic}:con`, c.text);
  }
  for (const egg of data.eggs || []) add(egg, `egg:${egg.title}`, egg.text);
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
  const found = sourceByCode(data, code);
  return found ? found.name : code;
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
