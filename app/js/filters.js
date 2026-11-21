/* filters.js — kind / grade / search filtering and the spoiler rule. */

export const KIND_FILTERS = ["all", "story", "missable", "collectibles", "activities", "crime", "hidden"];
export const GRADE_FILTERS = ["all", "platinum", "gold", "silver", "bronze"];

/* A trophy matches the kind chip: "missable" matches the missable flag,
   "hidden" matches the hidden flag, anything else matches its kind. */
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
  const haystack = `${trophy.name} ${trophy.description || ""} ${trophy.guide || ""}`.toLowerCase();
  return haystack.includes(q);
}

/* Full filter pass over the trophy list. */
export function applyFilters(trophies, { kind, grade, query, hideEarned, earned }) {
  return trophies.filter((trophy) => {
    if (!matchesKind(trophy, kind)) return false;
    if (!matchesGrade(trophy, grade)) return false;
    if (!matchesSearch(trophy, query)) return false;
    if (hideEarned && earned.has(trophy.name)) return false;
    return true;
  });
}

/* The spoiler shield masks a story trophy's name and description until it
   is earned. Hidden trophies are masked the same way when the shield is on
   and the trophy is still unearned. */
export function isSpoilerMasked(trophy, { spoiler, earned }) {
  if (!spoiler) return false;
  if (earned.has(trophy.name)) return false;
  if (trophy.kind === "story") return true;
  if (trophy.hidden) return true;
  return false;
}

/* Next Up: the earliest roadmap stage first, story before side content,
   unearned trophies in roadmap order. */
const KIND_ORDER = { story: 0, missable: 1, collectibles: 2, activities: 3, crime: 4 };

export function nextUpTrophies(trophies, earned, limit = 5) {
  const remaining = trophies.filter((trophy) => !earned.has(trophy.name));
  remaining.sort((a, b) => {
    const stageDiff = (a.roadmap_stage || 99) - (b.roadmap_stage || 99);
    if (stageDiff !== 0) return stageDiff;
    const kindDiff = (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9);
    if (kindDiff !== 0) return kindDiff;
    return a.name.localeCompare(b.name);
  });
  return remaining.slice(0, limit);
}
