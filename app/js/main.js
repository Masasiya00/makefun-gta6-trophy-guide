// main.js — boot and hash router for LEONIDA PLATINUM ATLAS.
//
// Routes (all hash-based, so the app stays one static page):
//   #/                  checklist (the tracker)
//   #/roadmap           7-stage platinum roadmap
//   #/missables         the one missable trophy + chapter grid
//   #/glitch            Apollo money glitch + honest farming
//   #/status            launch status + platinum-saving warnings
//   #/planner           Next Up — nearest unearned trophies first
//   #/settings          spoiler guard, export / import / reset, data stats
//   #/trophy/<name>     one trophy's guide, steps and sources (side pane)
//
// The header filter bar and the footer export/import/reset buttons live
// in index.html; this file wires them. All rendering is delegated to
// views.js; all saved progress goes through store.js.

import { loadPanels, loadTrophies } from "./data.js";
import {
  exportProgress,
  getCount,
  importProgress,
  loadState,
  resetAll,
  saveState,
  setCount,
  setNote,
  toggleEarned,
} from "./store.js";
import { visibleName } from "./filters.js";
import { renderChecklist, renderDetail, renderGlitch, renderMissables, renderPlanner, renderRoadmap, renderSettings, renderStatus } from "./views.js";

const state = loadState();
let trophies = [];
let panels = null;

const filters = { search: "", kind: "", grade: "", status: "" };

const viewEl = document.getElementById("view");
const detailEl = document.getElementById("detail");
const progressTextEl = document.getElementById("progress-text");
const progressBarEl = document.getElementById("progress-bar");

/** Everything the renderers need, rebuilt fresh on every render. */
function context() {
  return { trophies, panels, state, filters };
}

/** The header's "X / 55 earned (Y%)" line and progress bar. */
function updateProgressHeader() {
  const earned = Object.keys(state.earned).filter((name) => state.earned[name]).length;
  const total = trophies.length || 55;
  const percent = Math.round((earned / total) * 100);
  progressTextEl.textContent = earned + " / " + total + " earned (" + percent + "%)";
  progressBarEl.style.width = percent + "%";
}

/** Mark the current section's nav link as the active one. */
function updateNav(route) {
  const active = route.startsWith("trophy") ? "checklist" : route;
  const titles = {
    checklist: "Checklist",
    roadmap: "Roadmap",
    missables: "Missables",
    glitch: "Glitch & Farming",
    status: "Launch Status",
    planner: "Next Up Planner",
    settings: "Settings",
  };
  document.title = "LEONIDA PLATINUM ATLAS — " + (titles[active] || "Checklist");
  for (const link of document.querySelectorAll(".main-nav a[data-route]")) {
    if (link.dataset.route === active) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  }
}

/** Render the view for the current hash, then refresh header + nav. */
function render() {
  const hash = window.location.hash || "#/";
  const path = hash.replace(/^#\/?/, "");
  const [route, ...rest] = path.split("/");
  updateProgressHeader();
  updateNav(route || "checklist");

  if (route === "roadmap") {
    viewEl.innerHTML = renderRoadmap(context());
    detailEl.innerHTML = "<p>Roadmap open. Pick a trophy in a stage to see its guide here.</p>";
  } else if (route === "missables") {
    viewEl.innerHTML = renderMissables(context());
    detailEl.innerHTML = "<p>Only one trophy can be missed. Its guide is one click away in the checklist.</p>";
  } else if (route === "glitch") {
    viewEl.innerHTML = renderGlitch(context());
    detailEl.innerHTML = "<p>The Apollo glitch is labelled REPORTED — 2 sources for, 2 against. The legit alternatives below it pay better in the long run.</p>";
  } else if (route === "status") {
    viewEl.innerHTML = renderStatus(context());
    detailEl.innerHTML = "<p>Launch status as of 21 Nov 2026, 00:30 WIB. Unverified claims stay labelled unverified.</p>";
  } else if (route === "planner") {
    viewEl.innerHTML = renderPlanner(context());
    detailEl.innerHTML = "<p>Next Up is ordered by roadmap stage, then by how little is left to do.</p>";
  } else if (route === "settings") {
    viewEl.innerHTML = renderSettings(context());
    detailEl.innerHTML = "<p>Settings apply immediately and are saved with your progress.</p>";
  } else if (route === "trophy" && rest.length > 0) {
    const name = decodeURIComponent(rest.join("/"));
    viewEl.innerHTML = renderChecklist(context());
    detailEl.innerHTML = renderDetail(context(), name);
  } else {
    viewEl.innerHTML = renderChecklist(context());
    detailEl.innerHTML = "<p>Select a trophy to see its guide, steps and sources.</p>";
  }
}

/** Re-render after any state change (tick, count, note, import, reset). */
function rerender() {
  render();
}

/* ------------------------------------------------------------------ */
/* Wiring: header filters, footer buttons, delegated view events      */
/* ------------------------------------------------------------------ */

function wireHeaderFilters() {
  const searchEl = document.getElementById("search");
  const kindEl = document.getElementById("kind");
  const gradeEl = document.getElementById("grade");
  const statusEl = document.getElementById("status");
  const spoilerEl = document.getElementById("spoiler-toggle");
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      filters.search = searchEl.value;
      rerender();
    });
  }
  if (kindEl) kindEl.addEventListener("change", () => { filters.kind = kindEl.value; rerender(); });
  if (gradeEl) gradeEl.addEventListener("change", () => { filters.grade = gradeEl.value; rerender(); });
  if (statusEl) statusEl.addEventListener("change", () => { filters.status = statusEl.value; rerender(); });
  if (spoilerEl) {
    spoilerEl.checked = state.spoiler;
    spoilerEl.addEventListener("change", () => {
      state.spoiler = spoilerEl.checked;
      saveState(state);
      rerender();
    });
  }
}

function wireFooterButtons() {
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  const resetBtn = document.getElementById("reset-btn");
  if (exportBtn) exportBtn.addEventListener("click", () => exportProgress(state));
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      importProgress(file)
        .then((imported) => {
          Object.assign(state, imported);
          saveState(state);
          const spoilerEl = document.getElementById("spoiler-toggle");
          if (spoilerEl) spoilerEl.checked = state.spoiler;
          rerender();
          window.alert("Progress imported: " + Object.keys(state.earned).length + " trophies earned.");
        })
        .catch((error) => window.alert("Import failed: " + error.message));
      importFile.value = "";
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!window.confirm("Reset all progress? Earned ticks, counts and notes will be cleared.")) return;
      const fresh = resetAll();
      Object.assign(state, fresh);
      const spoilerEl = document.getElementById("spoiler-toggle");
      if (spoilerEl) spoilerEl.checked = state.spoiler;
      rerender();
    });
  }
}

/** One delegated listener for ticks, counts, notes and view buttons. */
function wireViewEvents() {
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const name = target.dataset.name;
    if (!action || !name) return;
    if (action === "toggle") {
      toggleEarned(state, name);
      rerender();
    } else if (action === "count") {
      const trophy = trophies.find((item) => item.name === name);
      const total = trophy && trophy.counts ? trophy.counts.target : undefined;
      setCount(state, name, target.value, total);
      // Keep the input's own value (clamped) without a full re-render,
      // so the number field does not lose focus mid-typing.
      target.value = String(getCount(state, name));
      updateProgressHeader();
    } else if (action === "spoiler") {
      state.spoiler = target.checked;
      saveState(state);
      const headerToggle = document.getElementById("spoiler-toggle");
      if (headerToggle) headerToggle.checked = state.spoiler;
      rerender();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const name = button.dataset.name;
    if (action === "save-note" && name) {
      const field = document.getElementById("note-field");
      setNote(state, name, field ? field.value : "");
      // The alert is user-facing, so it shows the name the reader can see:
      // the masked label while the spoiler guard hides this trophy.
      const trophy = trophies.find((item) => item.name === name);
      const label = trophy ? visibleName(trophy, state) : name;
      window.alert("Note saved for " + label);
      rerender();
    } else if (action === "export") {
      exportProgress(state);
    } else if (action === "import") {
      const importFile = document.getElementById("import-file");
      if (importFile) importFile.click();
    } else if (action === "reset") {
      if (!window.confirm("Reset all progress? Earned ticks, counts and notes will be cleared.")) return;
      const fresh = resetAll();
      Object.assign(state, fresh);
      const spoilerEl = document.getElementById("spoiler-toggle");
      if (spoilerEl) spoilerEl.checked = state.spoiler;
      rerender();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */

async function boot() {
  try {
    trophies = await loadTrophies();
    panels = await loadPanels();
  } catch (error) {
    viewEl.innerHTML = "<p>Could not load the trophy data (" + error.message
      + "). The data files are plain JSON under app/data/ and work offline — check that the app is served from app/.</p>";
    return;
  }
  wireHeaderFilters();
  wireFooterButtons();
  wireViewEvents();
  window.addEventListener("hashchange", render);
  render();
}

boot();
