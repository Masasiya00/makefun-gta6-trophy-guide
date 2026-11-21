// Pure filtering for the trophy checklist and the Easter Eggs / Bugs / Weird list.
export function filterTrophies(trophies, state, opts) {
  const q = (opts.q || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (opts.kind !== 'all' && t.kind !== opts.kind) return false;
    if (opts.grade !== 'all' && t.grade !== opts.grade) return false;
    const earned = state.earned.includes(t.id);
    if (opts.status === 'earned' && !earned) return false;
    if (opts.status === 'unearned' && earned) return false;
    if (opts.missableOnly && !t.missable) return false;
    if (opts.hiddenOnly && t.hidden !== true) return false;
    if (q) {
      const hay = [t.name, t.description, ...(t.steps || [])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterEggs(items, opts) {
  const q = (opts.q || '').trim().toLowerCase();
  return items.filter((it) => {
    if (opts.category !== 'all' && it.category !== opts.category) return false;
    if (opts.status !== 'all' && it.status !== opts.status) return false;
    if (q) {
      const hay = [it.name, it.location, it.description, it.reference || '', it.theory || ''].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Next Up: the closest unearned trophies — count trophies nearest their target
// first, then the earliest roadmap stage.
export function nextUp(trophies, state, n = 3) {
  const open = trophies.filter((t) => !state.earned.includes(t.id));
  const scored = open.map((t) => {
    let score = t.stage * 10;
    // With the spoiler guard on, a masked story trophy is useless as a
    // "next up" hint — push it behind the trophies whose names are visible.
    if (state.spoiler && t.kind === 'story' && t.id !== 1) score += 50;
    if (t.counts) {
      const have = state.counts[t.id] || 0;
      const ratio = Math.min(1, have / t.counts.target);
      score -= ratio * 9;
    }
    return { t, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, n).map((s) => s.t);
}
