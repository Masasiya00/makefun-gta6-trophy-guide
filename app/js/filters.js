// filters.js — filtering, searching and spoiler masking for the trophy list.
// The spoiler shield masks the name and description of every un-earned story
// trophy, in every view, until it is earned. Masking happens here, in one
// place, so no view can leak a story trophy's name by accident.

/** The 20 story trophies are the ones whose kinds include "story". */
export function isStoryTrophy(trophy) {
  return (trophy.kinds ?? []).includes('story');
}

/** Is this trophy's name/description hidden by the spoiler shield right now? */
export function isSpoilerMasked(trophy, state) {
  return state.spoilerShield && isStoryTrophy(trophy) && !state.earned.includes(trophy.id);
}

/** Display name: "???" while masked, the official name otherwise. */
export function displayName(trophy, state) {
  return isSpoilerMasked(trophy, state) ? '???' : trophy.name;
}

/** Display description: a spoiler note while masked, the official text otherwise. */
export function displayDescription(trophy, state) {
  return isSpoilerMasked(trophy, state)
    ? 'Nama & deskripsi disembunyikan spoiler shield — dapatkan trophy ini dulu, atau matikan shield.'
    : trophy.description;
}

/**
 * Filter the trophy list. opts: { kind, grade, status, query }.
 * kind: 'all' | 'story' | 'missable' | 'collectibles' | 'activities' | 'crime' | 'hidden'
 * grade: 'all' | 'platinum' | 'gold' | 'silver' | 'bronze'
 * status: 'all' | 'earned' | 'unearned'
 * query: free text matched against name + description + guide.
 */
export function applyFilters(trophies, state, opts) {
  const q = (opts.query ?? '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (opts.kind !== 'all') {
      if (opts.kind === 'hidden') {
        if (!t.hidden) return false;
      } else if (!(t.kinds ?? []).includes(opts.kind)) {
        return false;
      }
    }
    if (opts.grade !== 'all' && t.grade !== opts.grade) return false;
    const earned = state.earned.includes(t.id);
    if (opts.status === 'earned' && !earned) return false;
    if (opts.status === 'unearned' && earned) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Sort: platinum first, then gold, silver, bronze; within a grade, by stage then name. */
export function sortTrophies(trophies) {
  const rank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  return [...trophies].sort(
    (a, b) => rank[a.grade] - rank[b.grade] || (a.stage ?? 99) - (b.stage ?? 99) || a.name.localeCompare(b.name),
  );
}

/** Count earned trophies per grade, for the progress breakdown. */
export function gradeProgress(trophies, state) {
  const out = {};
  for (const t of trophies) {
    out[t.grade] = out[t.grade] ?? { total: 0, earned: 0 };
    out[t.grade].total++;
    if (state.earned.includes(t.id)) out[t.grade].earned++;
  }
  return out;
}

/** The next trophy to chase: lowest roadmap stage first, then count progress, then grade. */
export function nextUp(trophies, state) {
  const remaining = trophies.filter((t) => !state.earned.includes(t.id));
  if (remaining.length === 0) return null;
  const rank = { platinum: 3, gold: 2, silver: 1, bronze: 0 };
  const scored = remaining.map((t) => {
    let score = (t.stage ?? 99) * 100;
    if (t.counts) {
      const have = state.counts[t.id] ?? 0;
      score -= Math.round((have / t.counts.total) * 40);
    }
    score += rank[t.grade] ?? 0;
    return { trophy: t, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0].trophy;
}
