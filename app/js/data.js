/* data.js — fetch the four guide JSON files and count the audit numbers.
   Strict rule: a claim is any object that carries a `src` list. Trophy
   names listed inside a roadmap stage are NOT claims on their own; only
   the stage's own claims array counts. A dispute panel counts once when
   its pro/con sides are plain strings; when pro/con are arrays of claim
   objects, each of those objects counts on its own. */

export async function loadGuideData() {
  const [trophyRes, sourceRes, panelRes, eggRes] = await Promise.all([
    fetch("data/trophies.json"),
    fetch("data/sources.json"),
    fetch("data/panels.json"),
    fetch("data/easter-eggs.json"),
  ]);
  const trophyDoc = await trophyRes.json();
  const sourceDoc = await sourceRes.json();
  const panelDoc = await panelRes.json();
  const eggDoc = await eggRes.json();
  const trophies = Array.isArray(trophyDoc) ? trophyDoc : trophyDoc.trophies;
  const sources = Array.isArray(sourceDoc) ? sourceDoc : sourceDoc.sources;
  const eggs = Array.isArray(eggDoc) ? eggDoc : eggDoc.items;
  return { trophies, sources, panels: panelDoc, eggs };
}

/* Gather every claim object ({text, src}) from all four data files. */
export function collectAllClaims(data) {
  const out = [];
  const pushList = (list) => {
    for (const item of list || []) out.push(item);
  };
  for (const trophy of data.trophies) pushList(trophy.steps);
  for (const stage of data.panels.roadmap || []) pushList(stage.claims);
  const glitch = data.panels.glitch || {};
  pushList(glitch.claims);
  pushList(glitch.pro);
  pushList(glitch.con);
  pushList(data.panels.missables && data.panels.missables.save_strategy);
  pushList(data.panels.warnings);
  pushList(data.panels.farming);
  pushList(data.panels.launch_status);
  for (const row of (data.panels.missables && data.panels.missables.grid) || []) {
    pushList(row.items);
  }
  for (const dispute of data.panels.disputes || []) {
    const proIsList = Array.isArray(dispute.pro);
    const conIsList = Array.isArray(dispute.con);
    if (proIsList || conIsList) {
      if (proIsList) pushList(dispute.pro);
      if (conIsList) pushList(dispute.con);
    } else if (dispute.src) {
      /* Pro/con are plain strings: the panel itself is the single claim. */
      out.push(dispute);
    }
  }
  pushList(data.eggs);
  return out;
}

/* Audit numbers for the header strip: total claims, how many cite a
   source at all, and how many cite two or more sources. */
export function computeAudit(data) {
  const claims = collectAllClaims(data);
  let cited = 0;
  let twoPlus = 0;
  for (const claim of claims) {
    const src = claim.src || [];
    if (src.length > 0) cited += 1;
    if (src.length >= 2) twoPlus += 1;
  }
  return { total: claims.length, cited, twoPlus, sources: data.sources.length };
}

export function sourceNameByCode(data) {
  const map = new Map();
  for (const source of data.sources) map.set(source.code, source);
  return map;
}

export function sourceUrlByCode(data) {
  const map = new Map();
  for (const source of data.sources) map.set(source.code, source.url);
  return map;
}

/* Display label for a source code: the source name, or the bare code. */
export function sourceLabel(code, nameByCode) {
  const source = nameByCode.get(code);
  return source ? source.name : code;
}

/* Trophy helpers used by the views. */
export function trophyByName(data, name) {
  return data.trophies.find((trophy) => trophy.name === name) || null;
}

export function trophiesForStage(data, stage) {
  return data.trophies.filter((trophy) => trophy.roadmap_stage === stage);
}

export function gradeCounts(data) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of data.trophies) {
    if (Object.hasOwn(counts, trophy.grade)) counts[trophy.grade] += 1;
  }
  return counts;
}
