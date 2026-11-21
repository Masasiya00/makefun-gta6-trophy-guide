// store.js — the tracker's saved state in localStorage.
// One JSON object under one key: earned trophy ids, per-trophy counters,
// the spoiler shield, the active view and the selected trophy.
// Export writes the same object to a file; import reads it back.

const STORAGE_KEY = 'leonida-platinum-atlas-v1';

/** Fresh default state. */
export function defaultState() {
  return {
    earned: [],
    counts: {},
    spoilerShield: true,
    view: 'tracker',
    selectedId: null,
    eggKind: 'all',
    eggStatus: 'all',
  };
}

/** Read the saved state, falling back to defaults on any problem. */
export function loadState() {
  const fresh = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fresh;
    return {
      ...fresh,
      ...parsed,
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    };
  } catch {
    return fresh;
  }
}

/** Persist the state. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the tracker still works for this session.
  }
}

/** Is this trophy earned? */
export function isEarned(state, id) {
  return state.earned.includes(id);
}

/** Toggle a trophy's earned flag and persist. */
export function toggleEarned(state, id) {
  const i = state.earned.indexOf(id);
  if (i >= 0) state.earned.splice(i, 1);
  else state.earned.push(id);
  saveState(state);
  return state;
}

/** Set a trophy's manual counter (clamped to 0..total) and persist. */
export function setCount(state, id, value, total) {
  const n = Math.max(0, Math.min(total, Math.floor(Number(value) || 0)));
  state.counts[id] = n;
  saveState(state);
  return n;
}

/** Read a trophy's manual counter (0 when untouched). */
export function getCount(state, id) {
  return state.counts[id] ?? 0;
}

/** Wipe all progress and counters, keep settings. */
export function resetProgress(state) {
  state.earned = [];
  state.counts = {};
  saveState(state);
  return state;
}

/** Serialise the portable part of the state for export. */
export function exportState(state) {
  return JSON.stringify(
    { app: 'leonida-platinum-atlas', version: 1, earned: state.earned, counts: state.counts },
    null,
    2,
  );
}

/** Parse an imported file's text into earned/counts. Throws on bad shape. */
export function parseImport(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('file is not a tracker export');
  if (!Array.isArray(parsed.earned)) throw new Error('export has no earned list');
  return {
    earned: parsed.earned.filter((id) => typeof id === 'string'),
    counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
  };
}

/** Download a text file from the browser (used by export). */
export function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
