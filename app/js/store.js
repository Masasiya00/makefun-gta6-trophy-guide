// store.js — checklist state in localStorage, plus export / import.
// Nothing here touches the network. The state is the user's own progress.

const KEY = 'gta6-trophy-guide-v1';

export function defaultState() {
  return {
    earned: {},        // trophy name -> true
    counts: {},        // trophy name -> current number
    nextUp: [],        // trophy names, in planner order
    spoiler: true,     // spoiler shield defaults ON
    page: 'guide',
    selected: null,    // selected trophy name
    filters: { kind: '', grade: '', status: '', query: '' },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      earned: { ...(parsed.earned || {}) },
      counts: { ...(parsed.counts || {}) },
      nextUp: Array.isArray(parsed.nextUp) ? parsed.nextUp : [],
      filters: { ...base.filters, ...(parsed.filters || {}) },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): progress still works
    // for this session, it just will not survive a reload.
  }
}

export function toggleEarned(state, name) {
  if (state.earned[name]) delete state.earned[name];
  else state.earned[name] = true;
  saveState(state);
}

export function setCount(state, name, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  state.counts[name] = n;
  saveState(state);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => state.earned[t.name]).length;
}

export function addNextUp(state, name) {
  if (!state.nextUp.includes(name)) state.nextUp.push(name);
  saveState(state);
}

export function removeNextUp(state, name) {
  state.nextUp = state.nextUp.filter((n) => n !== name);
  saveState(state);
}

export function moveNextUp(state, name, dir) {
  const i = state.nextUp.indexOf(name);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.nextUp.length) return;
  const [item] = state.nextUp.splice(i, 1);
  state.nextUp.splice(j, 0, item);
  saveState(state);
}

export function exportJson(state) {
  const payload = {
    app: 'gta6-trophy-guide',
    version: 1,
    exported_at: new Date().toISOString(),
    earned: Object.keys(state.earned).filter((k) => state.earned[k]),
    counts: state.counts,
    nextUp: state.nextUp,
    spoiler: state.spoiler,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadExport(state) {
  const blob = new Blob([exportJson(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Returns { ok, message } — never throws on bad input.
export function importJson(state, text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, message: 'That file is not a progress export.' };
  }
  const earned = {};
  for (const name of Array.isArray(parsed.earned) ? parsed.earned : []) {
    if (typeof name === 'string') earned[name] = true;
  }
  state.earned = earned;
  state.counts = {};
  if (parsed.counts && typeof parsed.counts === 'object') {
    for (const [k, v] of Object.entries(parsed.counts)) {
      if (typeof k === 'string' && Number.isFinite(Number(v))) state.counts[k] = Math.max(0, Math.floor(Number(v)));
    }
  }
  state.nextUp = Array.isArray(parsed.nextUp)
    ? parsed.nextUp.filter((n) => typeof n === 'string') : [];
  if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
  saveState(state);
  return { ok: true, message: `Imported ${Object.keys(earned).length} earned trophies.` };
}

export function resetState() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return defaultState();
}
