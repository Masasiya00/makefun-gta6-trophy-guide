// Leonida Platinum Atlas — pure filters (Round 7, written fresh).
export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
};

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function gradeRank(grade) {
  const i = GRADE_ORDER.indexOf(grade);
  return i < 0 ? 99 : i;
}

export function applyFilters(trophies, st) {
  const q = (st.q || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (st.kind !== 'all' && t.kind !== st.kind) return false;
    if (st.grade !== 'all' && t.grade !== st.grade) return false;
    if (st.verified !== 'all' && t.verified !== st.verified) return false;
    if (st.missableOnly && !t.missable) return false;
    if (
      q &&
      !t.name.toLowerCase().includes(q) &&
      !(t.description || '').toLowerCase().includes(q) &&
      !(t.guide || '').toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

export function filterCounts(trophies) {
  const c = { all: trophies.length, missable: 0 };
  for (const t of trophies) {
    c[t.kind] = (c[t.kind] || 0) + 1;
    c[t.grade] = (c[t.grade] || 0) + 1;
    c[t.verified] = (c[t.verified] || 0) + 1;
    if (t.missable) c.missable++;
  }
  return c;
}
