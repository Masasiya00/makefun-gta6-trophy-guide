/* data.js — load the guide's JSON data and compute the audit counts. */

export async function loadGuideData() {
  const [trophiesRes, sourcesRes, panelsRes, eggsRes] = await Promise.all([
    fetch("data/trophies.json"),
    fetch("data/sources.json"),
    fetch("data/panels.json"),
    fetch("data/easter-eggs.json"),
  ]);
  const trophiesDoc = await trophiesRes.json();
  const sourcesDoc = await sourcesRes.json();
  const panelsDoc = await panelsRes.json();
  const eggsDoc = await eggsRes.json();
  const trophies = Array.isArray(trophiesDoc) ? trophiesDoc : trophiesDoc.trophies;
  const sources = Array.isArray(sourcesDoc) ? sourcesDoc : sourcesDoc.sources;
  const eggs = Array.isArray(eggsDoc) ? eggsDoc : eggsDoc.items;
  return { trophies, sources, panels: panelsDoc, eggs };
}

/* Collect every claim object ({text, src}) across all data files. */
export function collectAllClaims(data) {
  const claims = [];
  for (const trophy of data.trophies) {
    for (const step of trophy.steps || []) claims.push(step);
  }
  for (const stage of data.panels.roadmap || []) {
    for (const claim of stage.claims || []) claims.push(claim);
  }
  for (const claim of data.panels.glitch.claims || []) claims.push(claim);
  for (const side of [data.panels.glitch.pro, data.panels.glitch.con]) {
    for (const claim of side || []) claims.push(claim);
  }
  for (const item of data.panels.missables.save_strategy || []) claims.push(item);
  for (const item of data.panels.warnings || []) claims.push(item);
  for (const item of data.panels.farming || []) claims.push(item);
  for (const item of data.panels.launch_status || []) claims.push(item);
  for (const row of data.panels.missables.grid || []) {
    for (const item of row.items || []) claims.push(item);
  }
  for (const dispute of data.panels.disputes || []) {
    for (const side of [dispute.pro, dispute.con]) {
      for (const claim of side || []) claims.push(claim);
    }
  }
  for (const egg of data.eggs) claims.push(egg);
  return claims;
}

/* Audit numbers shown in the header strip: total claims, how many cite a
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

/* Human label for a source code: "PowerPyx" or the bare code when unknown. */
export function sourceLabel(code, nameByCode) {
  const source = nameByCode.get(code);
  return source ? source.name : code;
}

/* Trophy lookup helpers used by the views. */
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
