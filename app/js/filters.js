// filters.js — combine kind filter + text search + spoiler setting
// into one predicate over the trophy list, and apply the spoiler
// masking class to the rendered rows.

/** Kind filter values offered by the chips in #filter-bar. */
export const KIND_FILTERS = [
  'all',
  'story',
  'missable',
  'collectibles',
  'activities',
  'crime',
  'hidden',
  'online',
];

/** Does one trophy pass the kind filter? */
export function matchesKind(trophy, kind) {
  if (!kind || kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'hidden') return trophy.hidden === true;
  if (kind === 'online') return trophy.kind === 'online';
  return trophy.kind === kind;
}

/** Does one trophy match the free-text query (name + description + guide)? */
export function matchesSearch(trophy, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [trophy.name, trophy.description, trophy.guide]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/**
 * Filter the trophy list by kind + search. Returns a new array.
 * `state` is { kind, query }.
 */
export function applyFilters(trophies, state) {
  return trophies.filter(
    (t) => matchesKind(t, state.kind) && matchesSearch(t, state.query),
  );
}

/**
 * Is this trophy's name/description spoiler-masked right now?
 * Spoiler-safe hides STORY trophies until they are earned.
 */
export function isSpoilerHidden(trophy, spoilerOn, isEarned) {
  return spoilerOn === true && trophy.kind === 'story' && !isEarned;
}

/**
 * Apply (or remove) the spoiler masking class on a rendered row element.
 * Rows carry .spoiler-hidden; the stylesheet hides .tname/.tdesc inside it.
 */
export function applySpoilerClass(rowEl, trophy, spoilerOn, isEarned) {
  rowEl.classList.toggle(
    'spoiler-hidden',
    isSpoilerHidden(trophy, spoilerOn, isEarned),
  );
}

/** The placeholder text a spoiler-masked trophy shows instead of its name. */
export const SPOILER_PLACEHOLDER = 'Hidden story trophy — earn it to reveal';
