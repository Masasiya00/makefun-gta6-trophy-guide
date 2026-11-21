// Progress store for Leonida Platinum Atlas. One localStorage key holds the
// whole save: earned trophy names, manual counts for counted trophies, the
// spoiler setting, and free-text notes. Export writes it as a JSON file;
// import reads such a file back. Nothing leaves the browser.
const KEY = 'leonida-platinum-atlas-v1';

function blank() {
  return { earned: [], counts: {}, spoiler: true, notes: {} };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      spoiler: parsed.spoiler !== false,
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return blank();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function earnedSet(state) {
  return new Set(state.earned);
}

export function toggleEarned(state, name) {
  const set = earnedSet(state);
  if (set.has(name)) set.delete(name);
  else set.add(name);
  state.earned = [...set];
  saveState(state);
  return state;
}

export function setCount(state, name, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  state.counts[name] = n;
  saveState(state);
  return state;
}

export function setSpoiler(state, on) {
  state.spoiler = !!on;
  saveState(state);
  return state;
}

export function setNote(state, name, text) {
  state.notes[name] = String(text || '');
  saveState(state);
  return state;
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-atlas-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const state = {
    earned: Array.isArray(parsed.earned) ? parsed.earned : [],
    counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    spoiler: parsed.spoiler !== false,
    notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
  };
  saveState(state);
  return state;
}
