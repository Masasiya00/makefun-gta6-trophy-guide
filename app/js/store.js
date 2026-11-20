// store.js — the checklist's saved progress, kept in localStorage only.
//
// One key, one JSON object, nothing leaves the browser:
//   { earned: { "<trophy name>": true, ... },
//     counts: { "<trophy name>": <number done>, ... },
//     notes:  { "<trophy name>": "<free text>", ... },
//     spoiler: <true|false> }
// Export writes that object to a downloaded file; import reads one back
// after validating its shape, so a stray file can never corrupt the save.

export const STORE_KEY = "leonida-platinum-atlas-v1";

/** A fresh, empty progress state (spoiler guard on, matching the page). */
export function defaultState() {
  return { earned: {}, counts: {}, notes: {}, spoiler: true };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Read the saved state, merging it over the defaults so old saves survive. */
export function loadState() {
  const state = defaultState();
  let raw = null;
  try {
    raw = localStorage.getItem(STORE_KEY);
  } catch {
    return state;
  }
  if (!raw) return state;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!isPlainObject(parsed)) return state;
  for (const key of ["earned", "counts", "notes"]) {
    if (isPlainObject(parsed[key])) state[key] = parsed[key];
  }
  if (typeof parsed.spoiler === "boolean") state.spoiler = parsed.spoiler;
  return state;
}

/** Persist the whole state object under the store key. */
export function saveState(state) {
  state.savedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): progress just won't persist.
  }
}

/** Has this trophy been ticked earned? */
export function isEarned(state, name) {
  return Boolean(state.earned[name]);
}

/** How many trophies are ticked earned (platinum counts as one of the 55). */
export function earnedTotal(state) {
  return Object.keys(state.earned).filter((name) => state.earned[name]).length;
}

/** Flip one trophy's earned tick and save. Returns the new tick value. */
export function toggleEarned(state, name) {
  if (state.earned[name]) {
    delete state.earned[name];
  } else {
    state.earned[name] = true;
  }
  saveState(state);
  return Boolean(state.earned[name]);
}

/** Set a count trophy's progress (clamped to 0..total), then save. */
export function setCount(state, name, value, total) {
  let n = Math.floor(Number(value));
  if (!Number.isFinite(n)) n = 0;
  if (n < 0) n = 0;
  if (typeof total === "number" && n > total) n = total;
  if (n === 0) {
    delete state.counts[name];
  } else {
    state.counts[name] = n;
  }
  saveState(state);
  return n;
}

/** How far a count trophy has progressed (0 when never touched). */
export function getCount(state, name) {
  const n = state.counts[name];
  return typeof n === "number" && n > 0 ? n : 0;
}

/** Save a free-text note for a trophy (empty text clears it), then save. */
export function setNote(state, name, text) {
  const trimmed = String(text || "").trim();
  if (trimmed === "") {
    delete state.notes[name];
  } else {
    state.notes[name] = trimmed;
  }
  saveState(state);
}

/** Download the current progress as a JSON file. */
export function exportProgress(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-platinum-atlas-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Read progress back from a user-chosen file. Resolves with the validated
 * state (unknown fields and bad values are dropped, never trusted), or
 * rejects with a plain-language error when the file is not a progress file.
 */
export function importProgress(file) {
  return file.text().then((text) => {
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("That file is not valid JSON.");
    }
    if (!isPlainObject(parsed)) {
      throw new Error("That file is not a LEONIDA PLATINUM ATLAS progress file.");
    }
    const state = defaultState();
    for (const key of ["earned", "counts", "notes"]) {
      if (!isPlainObject(parsed[key])) continue;
      for (const [name, value] of Object.entries(parsed[key])) {
        if (key === "earned" && value === true) state.earned[name] = true;
        if (key === "counts" && typeof value === "number" && value > 0) {
          state.counts[name] = Math.floor(value);
        }
        if (key === "notes" && typeof value === "string" && value.trim() !== "") {
          state.notes[name] = value.trim();
        }
      }
    }
    if (typeof parsed.spoiler === "boolean") state.spoiler = parsed.spoiler;
    return state;
  });
}

/** Wipe the save entirely and return a fresh default state. */
export function resetAll() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Nothing to wipe.
  }
  return defaultState();
}
