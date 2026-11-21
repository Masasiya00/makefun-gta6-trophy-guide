// filters.js — pure filtering of the trophy list. No DOM here, so the
// same logic drives the list, the counts and the Next Up suggestions.

export function applyFilters(trophies, state) {
  const f = state.filters;
  const q = (f.query || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (f.kind && t.kind !== f.kind) return false;
    if (f.grade && t.grade !== f.grade) return false;
    if (f.status === 'earned' && !state.earned[t.name]) return false;
    if (f.status === 'remaining' && state.earned[t.name]) return false;
    if (f.status === 'hidden' && !t.hidden) return false;
    if (f.status === 'verified' && t.verified !== 'confirmed') return false;
    if (f.status === 'reported' && t.verified !== 'reported') return false;
    if (f.status === 'unknown' && t.verified !== 'unknown') return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.kind} ${t.grade}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function gradeCounts(trophies) {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (out[t.grade] !== undefined) out[t.grade]++;
  return out;
}

export function kindCounts(trophies) {
  const out = {};
  for (const t of trophies) out[t.kind] = (out[t.kind] || 0) + 1;
  return out;
}

// Suggest the next trophies to chase: remaining, earliest roadmap stage
// first, missables before anything else in the same stage.
export function suggestNextUp(trophies, state, limit = 5) {
  const remaining = trophies.filter((t) => !state.earned[t.name]);
  remaining.sort((a, b) => {
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    if (a.roadmap_stage !== b.roadmap_stage) return a.roadmap_stage - b.roadmap_stage;
    return a.name.localeCompare(b.name);
  });
  return remaining.slice(0, limit);
}
