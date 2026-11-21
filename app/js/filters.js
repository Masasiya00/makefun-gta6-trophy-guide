// Pure filters for the trophy list and the easter-egg list. No DOM here,
// so the rules are easy to test: kind, grade, earned state, hidden flag,
// free-text search, category and verification status.
export function filterTrophies(list, opts) {
  const q = (opts.query || '').trim().toLowerCase();
  return list.filter((t) => {
    if (opts.kind && opts.kind !== 'all') {
      if (opts.kind === 'missable' && !t.missable) return false;
      if (opts.kind === 'hidden' && !t.hidden) return false;
      if (opts.kind === 'earned' && !opts.earned.has(t.name)) return false;
      if (opts.kind === 'remaining' && opts.earned.has(t.name)) return false;
      if (opts.kind === 'online') return false; // GTA VI has 0 online trophies.
      if (!['missable', 'hidden', 'earned', 'remaining', 'online'].includes(opts.kind) && t.filterKind !== opts.kind) return false;
    }
    if (opts.grade && opts.grade !== 'all' && t.grade !== opts.grade) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterEggs(list, opts) {
  const q = (opts.query || '').trim().toLowerCase();
  return list.filter((e) => {
    if (opts.category && opts.category !== 'all' && e.category !== opts.category) return false;
    if (opts.status && opts.status !== 'all' && e.status !== opts.status) return false;
    if (q) {
      const hay = (e.title + ' ' + e.location + ' ' + e.description).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// The Next Up pick: the first unearned trophy in roadmap order, preferring
// counted trophies the player has already started (closest to done first).
export function nextUp(list, state) {
  const earned = new Set(state.earned);
  const open = list.filter((t) => !earned.has(t.name));
  if (open.length === 0) return null;
  const started = open.filter((t) => t.count && (state.counts[t.name] || 0) > 0);
  if (started.length > 0) {
    started.sort((a, b) => {
      const pa = (state.counts[a.name] || 0) / a.count.target;
      const pb = (state.counts[b.name] || 0) / b.count.target;
      return pb - pa;
    });
    return started[0];
  }
  const byStage = [...open].sort((a, b) => (a.stage - b.stage) || (a.name < b.name ? -1 : 1));
  return byStage[0];
}
