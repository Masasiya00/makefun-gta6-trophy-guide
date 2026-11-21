// filters.js — side-effect-free trophy filtering. The DOM never appears
// here, so the list view, the counters and the Next Up planner all share
// this one implementation.

export function applyFilters(trophies, state) {
  const crit = state.filters;
  const needle = (crit.query || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (crit.kind && t.kind !== crit.kind) return false;
    if (crit.grade && t.grade !== crit.grade) return false;
    if (crit.status === 'earned' && !state.earned[t.name]) return false;
    if (crit.status === 'remaining' && state.earned[t.name]) return false;
    if (crit.status === 'hidden' && !t.hidden) return false;
    if (crit.status === 'verified' && t.verified !== 'confirmed') return false;
    if (crit.status === 'reported' && t.verified !== 'reported') return false;
    if (crit.status === 'unknown' && t.verified !== 'unknown') return false;
    if (needle) {
      const haystack = `${t.name} ${t.description} ${t.kind} ${t.grade}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function gradeCounts(trophies) {
  const tally = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (tally[t.grade] !== undefined) tally[t.grade]++;
  return tally;
}

export function kindCounts(trophies) {
  const tally = {};
  for (const t of trophies) tally[t.kind] = (tally[t.kind] || 0) + 1;
  return tally;
}

// What to chase next: whatever is left, missables first inside a stage,
// then the earliest roadmap stage, then alphabetical order.
export function suggestNextUp(trophies, state, limit = 5) {
  const left = trophies.filter((t) => !state.earned[t.name]);
  left.sort((a, b) => {
    if (a.missable !== b.missable) return a.missable ? -1 : 1;
    if (a.roadmap_stage !== b.roadmap_stage) return a.roadmap_stage - b.roadmap_stage;
    return a.name.localeCompare(b.name);
  });
  return left.slice(0, limit);
}
