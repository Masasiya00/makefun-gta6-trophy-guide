// Leonida Platinum Atlas — tracker state (Round 7, written fresh).
// localStorage only. Nothing leaves the browser.
const KEY = 'leonida-platinum-atlas-v7';

export function defaultState() {
  return {
    earned: {},
    counts: {},
    spoiler: true,
    view: 'checklist',
    q: '',
    kind: 'all',
    grade: 'all',
    verified: 'all',
    missableOnly: false,
    selected: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultState();
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(st) {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    // Storage full or blocked: the app still works for the session.
  }
}

export function isEarned(st, name) {
  return !!st.earned[name];
}

export function toggleEarned(st, name) {
  if (st.earned[name]) delete st.earned[name];
  else st.earned[name] = true;
  saveState(st);
  return st;
}

export function countOf(st, name) {
  return st.counts[name] || 0;
}

export function setCount(st, name, n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (n === 0) delete st.counts[name];
  else st.counts[name] = n;
  saveState(st);
  return st;
}

export function exportState(st) {
  return JSON.stringify(
    { app: 'leonida-platinum-atlas', version: 7, exportedAt: new Date().toISOString(), state: st },
    null,
    2,
  );
}

export function importState(text) {
  const parsed = JSON.parse(text);
  const st = parsed.state || parsed;
  if (typeof st !== 'object' || st === null || Array.isArray(st)) throw new Error('Not a Leonida Atlas export');
  return { ...defaultState(), ...st };
}
