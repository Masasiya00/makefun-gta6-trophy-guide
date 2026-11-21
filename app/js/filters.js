/* filters.js — kind / grade / search filtering plus the spoiler rule.
   Pure functions, no DOM: the list, the counts and Next Up all share
   this logic so they can never disagree. */

export const KIND_FILTERS = ["all", "story", "missable", "collectibles", "activities", "crime", "hidden"];
export const GRADE_FILTERS = ["all", "platinum", "gold", "silver", "bronze"];

/* Kind match: "missable" means the missable flag is set, "hidden" means
   the hidden flag is set, any other kind matches the trophy's kind. */
export function matchesKind(trophy, kind) {
  if (kind === "all") return true;
  if (kind === "missable") return trophy.missable === true;
  if (kind === "hidden") return trophy.hidden === true;
  return trophy.kind === kind;
}

export function matchesGrade(trophy, grade) {
  if (grade === "all") return true;
  return trophy.grade === grade;
}

export function matchesSearch(trophy, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;
  const text = `${trophy.name} ${trophy.description || ""} ${trophy.guide || ""}`.toLowerCase();
  return text.includes(q);
}

/* One pass over the trophy list applying every active filter. */
export function applyFilters(trophies, { kind, grade, query, hideEarned, earned }) {
  return trophies.filter((trophy) => {
    if (!matchesKind(trophy, kind)) return false;
    if (!matchesGrade(trophy, grade)) return false;
    if (!matchesSearch(trophy, query)) return false;
    if (hideEarned && earned.has(trophy.name)) return false;
    return true;
  });
}

/* Spoiler shield: a story trophy's name and description stay masked
   until it is earned. Hidden trophies are masked the same way while
   the shield is on and the trophy is still unearned. */
export function isSpoilerMasked(trophy, { spoiler, earned }) {
  if (!spoiler) return false;
  if (earned.has(trophy.name)) return false;
  if (trophy.kind === "story") return true;
  if (trophy.hidden) return true;
  return false;
}

/* Next Up: earliest roadmap stage first, story before side content,
   then alphabetical. Only unearned trophies, capped at the limit. */
const KIND_RANK = { story: 0, missable: 1, collectibles: 2, activities: 3, crime: 4 };

export function nextUpTrophies(trophies, earned, limit = 5) {
  const left = trophies.filter((trophy) => !earned.has(trophy.name));
  left.sort((a, b) => {
    const stageGap = (a.roadmap_stage || 99) - (b.roadmap_stage || 99);
    if (stageGap !== 0) return stageGap;
    const kindGap = (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9);
    if (kindGap !== 0) return kindGap;
    return a.name.localeCompare(b.name);
  });
  return left.slice(0, limit);
}
