// store.js — earned-trophy checklist saved in localStorage, with
// export-to-file and import-from-file so progress survives a browser wipe.

export const STORAGE_KEY = 'tla-progress-v2';
export const EXPORT_FILENAME = 'leonida-platinum-atlas-progress.json';

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeRaw(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): progress stays in memory.
  }
}

/** Create the progress store. `validIds` is the set of trophy names. */
export function createStore(validIds) {
  const known = new Set(validIds);
  let earned = new Set();

  function load() {
    const raw = readRaw();
    earned = new Set(
      Object.keys(raw).filter((id) => known.has(id) && raw[id] === true),
    );
  }

  load();

  return {
    /** Is this trophy marked earned? */
    isEarned(id) {
      return earned.has(id);
    },

    /** Mark a trophy earned (true) or not earned (false). Persists. */
    setEarned(id, value) {
      if (!known.has(id)) return;
      if (value) earned.add(id);
      else earned.delete(id);
      this.save();
    },

    /** Toggle a trophy's earned state. Returns the new state. */
    toggle(id) {
      const next = !earned.has(id);
      this.setEarned(id, next);
      return next;
    },

    /** All earned trophy ids, in the order the guide lists them. */
    earnedIds() {
      return [...known].filter((id) => earned.has(id));
    },

    /** { earned, total } over the whole list. */
    totals() {
      return { earned: earned.size, total: known.size };
    },

    /** { earned, total } per grade: platinum / gold / silver / bronze. */
    byGrade(trophies) {
      const out = {};
      for (const t of trophies) {
        const g = t.grade;
        if (!out[g]) out[g] = { earned: 0, total: 0 };
        out[g].total += 1;
        if (earned.has(t.id)) out[g].earned += 1;
      }
      return out;
    },

    /** Persist the current set. */
    save() {
      const state = {};
      for (const id of earned) state[id] = true;
      writeRaw(state);
    },

    /** Serialisable snapshot for export. */
    snapshot() {
      return {
        app: 'leonida-platinum-atlas',
        version: 2,
        exportedAt: new Date().toISOString(),
        earned: this.earnedIds(),
      };
    },

    /** Replace progress from a parsed export object. Returns count applied. */
    restore(data) {
      const list = Array.isArray(data) ? data : data && data.earned;
      if (!Array.isArray(list)) return 0;
      earned = new Set(list.filter((id) => known.has(id)));
      this.save();
      return earned.size;
    },

    /** Download the progress snapshot as a JSON file. */
    exportToFile() {
      const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = EXPORT_FILENAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    /**
     * Read progress back from a File picked in the import input.
     * Resolves to the number of trophies restored, rejects on bad JSON.
     */
    async importFromFile(file) {
      const text = await file.text();
      const data = JSON.parse(text);
      return this.restore(data);
    },
  };
}
