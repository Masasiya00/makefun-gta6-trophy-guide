/* store.js — saved progress in localStorage, plus export / import. */

const PROGRESS_KEY = "leonida-platinum-atlas-progress-v1";
const SETTINGS_KEY = "leonida-platinum-atlas-settings-v1";

/* The earned set is a Set of trophy names. A demo override (used only by
   ?shot= screenshots) keeps demo progress out of localStorage. */
let demoEarned = null;

export function setDemoEarned(names) {
  demoEarned = new Set(names || []);
}

export function isDemoMode() {
  return demoEarned !== null;
}

export function loadEarned() {
  if (demoEarned !== null) return new Set(demoEarned);
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === "string"));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  if (demoEarned !== null) {
    demoEarned = new Set(earned);
    return;
  }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort()));
  } catch {
    /* Storage full or blocked: progress still lives in memory this session. */
  }
}

export function isEarned(earned, trophyName) {
  return earned.has(trophyName);
}

export function toggleEarned(earned, trophyName) {
  const next = new Set(earned);
  if (next.has(trophyName)) next.delete(trophyName);
  else next.add(trophyName);
  saveEarned(next);
  return next;
}

export function clearEarned() {
  demoEarned = null;
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* ignore */
  }
  return new Set();
}

/* Settings: spoiler shield on/off, hide-earned on/off. */
export function loadSettings() {
  const defaults = { spoiler: false, hideEarned: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      spoiler: parsed.spoiler === true,
      hideEarned: parsed.hideEarned === true,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/* Export the earned list as a downloadable JSON file. */
export function exportProgress(earned) {
  const payload = {
    app: "LEONIDA PLATINUM ATLAS",
    version: 1,
    exported_at: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "leonida-platinum-atlas-progress.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload.earned.length;
}

/* Parse an imported file back into an earned set. Accepts our own export
   shape ({earned: [...]}) or a bare array of trophy names. Returns null
   when the file is not a shape we recognise. */
export function parseImportedProgress(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) return null;
  const cleaned = names.filter((name) => typeof name === "string");
  if (cleaned.length === 0 && names.length > 0) return null;
  return new Set(cleaned);
}

export function importProgressSet(earned) {
  saveEarned(earned);
  return new Set(earned);
}
