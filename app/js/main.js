/* main.js — boot the guide: load data, wire filters, tracker, views. */

import { loadGuideData, computeAudit } from "./data.js";
import {
  loadEarned,
  saveEarned,
  toggleEarned,
  clearEarned,
  loadSettings,
  saveSettings,
  exportProgress,
  parseImportedProgress,
  importProgressSet,
  setDemoEarned,
} from "./store.js";
import { applyFilters, nextUpTrophies } from "./filters.js";
import {
  renderTrophyList,
  renderTrophyDetail,
  renderProgressPane,
  renderRoadmapView,
  renderGlitchView,
  renderEggsView,
  escapeHtml,
} from "./views.js";

const state = {
  data: null,
  earned: new Set(),
  settings: { spoiler: false, hideEarned: false },
  kind: "all",
  grade: "all",
  query: "",
  selectedName: null,
  view: "tracker",
  eggFilter: "all",
};

const $ = (id) => document.getElementById(id);

function currentFilters() {
  return {
    kind: state.kind,
    grade: state.grade,
    query: state.query,
    hideEarned: state.settings.hideEarned,
    earned: state.earned,
  };
}

function refreshTracker() {
  const filtered = applyFilters(state.data.trophies, currentFilters());
  $("list-count").textContent = `${filtered.length} shown`;
  renderTrophyList($("trophy-list"), filtered, {
    earned: state.earned,
    spoiler: state.settings.spoiler,
    selectedName: state.selectedName,
  });
  const selected = state.data.trophies.find((t) => t.name === state.selectedName) || null;
  renderTrophyDetail($("trophy-detail"), selected, state.data, {
    earned: state.earned,
    spoiler: state.settings.spoiler,
  });
  renderProgressPane(state, state.data);
  renderNextUp();
}

function renderNextUp() {
  const list = $("next-up-list");
  if (!list) return;
  const next = nextUpTrophies(state.data.trophies, state.earned, 5);
  if (next.length === 0) {
    list.innerHTML = `<li>Semua trophy sudah didapat — platinum milikmu!</li>`;
    return;
  }
  list.innerHTML = next
    .map(
      (trophy) =>
        `<li><button type="button" data-next="${escapeHtml(trophy.name)}">${escapeHtml(trophy.name)}</button> <span class="tag kind-${escapeHtml(trophy.kind)}">${escapeHtml(trophy.kind)}</span></li>`
    )
    .join("");
  list.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => selectTrophy(button.getAttribute("data-next")));
  });
}

function selectTrophy(name) {
  state.selectedName = name;
  switchView("tracker");
  refreshTracker();
  const detail = $("trophy-detail-pane");
  if (detail) detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll("#view-tabs .tab").forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-view") === view);
  });
  document.querySelectorAll("#app-main .view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
  if (view === "roadmap") {
    renderRoadmapView($("view-roadmap"), state.data, state, selectTrophy);
  } else if (view === "glitch") {
    renderGlitchView($("view-glitch"), state.data);
  } else if (view === "eggs") {
    renderEggsView($("view-eggs"), state.data, {
      eggFilter: state.eggFilter,
      onEggFilter: (filter) => {
        state.eggFilter = filter;
        renderEggsView($("view-eggs"), state.data, {
          eggFilter: state.eggFilter,
          onEggFilter: (next) => {
            state.eggFilter = next;
            switchView("eggs");
          },
        });
      },
    });
  }
}

function renderHeaderStats(audit) {
  $("stat-claims").textContent = String(audit.cited);
  $("stat-twoplus").textContent = String(audit.twoPlus);
  $("stat-eggs").textContent = String(state.data.eggs.length);
  $("stat-trophies").textContent = String(state.data.trophies.length);
  const pct = audit.total === 0 ? 0 : Math.round((audit.cited / audit.total) * 100);
  $("audit-strip").innerHTML =
    `<strong>Audit strip:</strong> ${audit.cited}/${audit.total} claims cited (${pct}%), ` +
    `${audit.twoPlus} on 2+ sites, ${audit.sources} sources. ` +
    `Setiap langkah panduan mengutip sumbernya — klaim tanpa sumber tidak dihitung.`;
  const names = state.data.sources.map((s) => s.name).join(", ");
  $("footer-source-count").textContent = `${audit.sources} sources — ${names}`;
}

function applyShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return;
  /* Deterministic screenshot states: demo progress lives in memory only,
     never in localStorage, so shots are reproducible. */
  const demoNames = state.data.trophies.slice(0, 13).map((t) => t.name);
  if (shot === "01-cover") {
    setDemoEarned(demoNames);
    state.earned = loadEarned();
    state.selectedName = "Positive Mental Attitude";
    switchView("tracker");
  } else if (shot === "02-roadmap") {
    setDemoEarned(demoNames);
    state.earned = loadEarned();
    switchView("roadmap");
  } else if (shot === "03-glitch") {
    setDemoEarned([]);
    state.earned = loadEarned();
    switchView("glitch");
  } else if (shot === "04-spoiler") {
    setDemoEarned(demoNames);
    state.earned = loadEarned();
    state.settings.spoiler = true;
    $("spoiler-toggle").checked = true;
    state.selectedName = "Road to Rehabilitation";
    switchView("tracker");
  }
  refreshTracker();
}

function wireEvents() {
  document.querySelectorAll("#view-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.getAttribute("data-view")));
  });

  document.querySelectorAll("#kind-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.kind = chip.getAttribute("data-kind");
      document.querySelectorAll("#kind-chips .chip").forEach((c) => c.classList.toggle("active", c === chip));
      refreshTracker();
    });
  });

  document.querySelectorAll("#grade-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.grade = chip.getAttribute("data-grade");
      document.querySelectorAll("#grade-chips .chip").forEach((c) => c.classList.toggle("active", c === chip));
      refreshTracker();
    });
  });

  $("search-input").addEventListener("input", (event) => {
    state.query = event.target.value;
    refreshTracker();
  });

  $("spoiler-toggle").addEventListener("change", (event) => {
    state.settings.spoiler = event.target.checked;
    saveSettings(state.settings);
    refreshTracker();
  });

  $("earned-toggle").addEventListener("change", (event) => {
    state.settings.hideEarned = event.target.checked;
    saveSettings(state.settings);
    refreshTracker();
  });

  /* Trophy list: checkbox toggles earned, row click opens the guide. */
  $("trophy-list").addEventListener("click", (event) => {
    const row = event.target.closest(".trophy-row");
    if (!row) return;
    const name = row.getAttribute("data-trophy");
    if (event.target.matches('input[type="checkbox"]')) {
      state.earned = toggleEarned(state.earned, name);
      refreshTracker();
      return;
    }
    selectTrophy(name);
  });
  $("trophy-list").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".trophy-row");
    if (!row) return;
    event.preventDefault();
    selectTrophy(row.getAttribute("data-trophy"));
  });

  $("export-btn").addEventListener("click", () => {
    const count = exportProgress(state.earned);
    $("save-status").textContent = `Exported ${count} earned trophies to JSON.`;
  });
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseImportedProgress(text);
    if (!parsed) {
      $("save-status").textContent = "Import gagal: file bukan progress JSON yang valid.";
      return;
    }
    const known = new Set(state.data.trophies.map((t) => t.name));
    const valid = new Set([...parsed].filter((name) => known.has(name)));
    state.earned = importProgressSet(valid);
    $("save-status").textContent = `Imported ${valid.size} earned trophies.`;
    refreshTracker();
  });
  $("reset-btn").addEventListener("click", () => {
    if (!window.confirm("Reset semua progres tracker?")) return;
    state.earned = clearEarned();
    $("save-status").textContent = "Progress direset.";
    refreshTracker();
  });
}

async function bootGuide() {
  state.data = await loadGuideData();
  state.earned = loadEarned();
  state.settings = loadSettings();
  $("spoiler-toggle").checked = state.settings.spoiler;
  $("earned-toggle").checked = state.settings.hideEarned;
  const audit = computeAudit(state.data);
  renderHeaderStats(audit);
  wireEvents();
  applyShotMode();
  if (!state.selectedName) {
    state.selectedName = state.data.trophies[0].name;
  }
  refreshTracker();
}

bootGuide().catch((error) => {
  const strip = $("audit-strip");
  if (strip) strip.textContent = `Gagal memuat data panduan: ${error.message}`;
  console.error(error);
});
