// Local progress store: earned trophies, per-trophy count trackers, spoiler setting.
// One localStorage key, one JSON object, export/import as a file.
const KEY = 'leonida-platinum-atlas-v1';

function blank() {
  return { earned: [], counts: {}, spoiler: true, notes: {} };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return { ...blank(), ...parsed, earned: Array.isArray(parsed.earned) ? parsed.earned : [] };
  } catch {
    return blank();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const i = state.earned.indexOf(id);
  if (i >= 0) state.earned.splice(i, 1);
  else state.earned.push(id);
  saveState(state);
  return state;
}

export function getCount(state, id) {
  return typeof state.counts[id] === 'number' ? state.counts[id] : 0;
}

export function setCount(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  state.counts[id] = n;
  saveState(state);
  return n;
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-atlas-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function importFile(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('Not a Leonida Platinum Atlas progress file.');
  const next = { ...blank(), ...parsed };
  saveState(next);
  return next;
}
