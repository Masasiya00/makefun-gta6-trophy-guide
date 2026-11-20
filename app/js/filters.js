// filters.js — checklist filtering and the spoiler guard.
//
// Filters: free-text search over name + official description, kind,
// grade, and status (earned / not earned / missable / hidden).
// Spoiler guard: while it is on, a story trophy that has not been earned
// yet shows neither its real name nor its real description — both read
// "Hidden — spoiler disembunyikan" until the player earns it.

export const SPOILER_LABEL = "Hidden — spoiler disembunyikan";

/** True when this trophy's name and description must stay masked. */
export function isSpoilerHidden(trophy, state) {
  return Boolean(state.spoiler) && trophy.kind === "story" && !state.earned[trophy.name];
}

/** The name the checklist may show (masked when the spoiler guard hides it). */
export function visibleName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? SPOILER_LABEL : trophy.name;
}

/** The description the checklist may show (masked the same way). */
export function visibleDescription(trophy, state) {
  return isSpoilerHidden(trophy, state) ? SPOILER_LABEL : trophy.description;
}

/**
 * Filter a trophy list. `filters` is { search, kind, grade, status } with
 * empty strings meaning "no filter". Status accepts "earned", "unearned",
 * "missable" and "hidden" (the header's select also offers those values).
 * The search matches the real name and description even for a masked
 * trophy — the row still renders masked, so nothing leaks through it.
 */
export function applyFilters(trophies, state, filters) {
  const needle = (filters.search || "").trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (needle) {
      const haystack = (trophy.name + " " + trophy.description).toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.kind && trophy.kind !== filters.kind) return false;
    if (filters.grade && trophy.grade !== filters.grade) return false;
    if (filters.status === "earned" && !state.earned[trophy.name]) return false;
    if (filters.status === "unearned" && state.earned[trophy.name]) return false;
    if (filters.status === "missable" && !trophy.missable) return false;
    if (filters.status === "hidden" && !trophy.hidden) return false;
    return true;
  });
}

/** One-line summary for the checklist header: "Showing 12 of 55 trophies". */
export function filterSummary(shown, total) {
  if (shown === total) return "Showing all " + total + " trophies";
  return "Showing " + shown + " of " + total + " trophies";
}
