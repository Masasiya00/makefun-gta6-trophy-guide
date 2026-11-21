// main.js — entry point. Loads the guide data, wires the store, the
// filters and every view, then applies the ?shot= screenshot mode.
// ES module; every import is a relative file under app/.

import { loadGuideData, countCitedSteps } from './data.js';
import { createStore } from './store.js';
import { applySpoilerClass } from './filters.js';
import {
  showView,
  renderTrophyList,
  renderDetail,
  renderProgress,
  renderNextUp,
  renderRoadmap,
  renderGlitch,
  renderEggs,
} from './views.js';

const SHOT_MODES = ['cover', 'roadmap', 'glitch', 'spoiler'];
const COVER_TROPHY = 'Maximum Withdrawal';
const DEFAULT_TROPHY = 'Positive Mental Attitude';

function $(id) {
  return document.getElementById(id);
}

function shotMode() {
  const mode = new URLSearchParams(window.location.search).get('shot');
  return SHOT_MODES.includes(mode) ? mode : null;
}

async function start() {
  const { trophies, panels, eggs } = await loadGuideData();
  const store = createStore(trophies.map((t) => t.id));
  const citedSteps = countCitedSteps(trophies);

  const listEl = $('trophy-list');
  const detailEl = $('detail-pane');
  const nextUpEl = $('next-up');
  const roadmapListEl = $('roadmap-list');
  const glitchPanelEl = $('glitch-panel');
  const eggsListEl = $('eggs-list');
  const searchEl = $('search');
  const spoilerToggle = $('spoiler-toggle');

  const filterState = {
    kind: 'all',
    query: '',
    spoilerOn: spoilerToggle ? spoilerToggle.checked : true,
  };
  let selectedId = DEFAULT_TROPHY;
  let eggKind = 'all';

  function setBodySpoiler(on) {
    document.body.classList.toggle('spoiler-on', on);
  }

  function selectedTrophy() {
    return trophies.find((t) => t.id === selectedId) || null;
  }

  function selectTrophy(t) {
    selectedId = t.id;
    renderDetail(detailEl, t, store, filterState.spoilerOn);
    renderTrophyList(listEl, trophies, store, filterState, selectTrophy, selectedId);
  }

  function refreshAll() {
    renderTrophyList(listEl, trophies, store, filterState, selectTrophy, selectedId);
    renderDetail(detailEl, selectedTrophy(), store, filterState.spoilerOn);
    renderProgress(trophies, store, citedSteps);
    renderNextUp(nextUpEl, trophies, panels, store);
  }

  function refreshAfterToggle() {
    // A checkbox just changed earned state: progress, Next Up, the
    // spoiler masking and the open detail may all have changed.
    renderProgress(trophies, store, citedSteps);
    renderNextUp(nextUpEl, trophies, panels, store);
    renderDetail(detailEl, selectedTrophy(), store, filterState.spoilerOn);
    listEl.querySelectorAll('.trow').forEach((row) => {
      const t = trophies.find((x) => x.id === row.dataset.trophy);
      if (t) applySpoilerClass(row, t, filterState.spoilerOn, store.isEarned(t.id));
    });
  }

  // Keep the checklist in sync when a checkbox is ticked: the store
  // change listener runs after renderTrophyList attaches its own handler,
  // so delegate on the list itself.
  listEl.addEventListener('change', (event) => {
    const box = event.target;
    if (box && box.matches('input[type="checkbox"][data-trophy]')) {
      refreshAfterToggle();
    }
  });

  // Filter chips (kind).
  document.querySelectorAll('#filter-bar .chip[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      filterState.kind = chip.dataset.filter;
      document.querySelectorAll('#filter-bar .chip[data-filter]').forEach((c) => {
        c.classList.toggle('active', c === chip);
      });
      renderTrophyList(listEl, trophies, store, filterState, selectTrophy, selectedId);
    });
  });

  // Free-text search (name + description + guide).
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      filterState.query = searchEl.value;
      renderTrophyList(listEl, trophies, store, filterState, selectTrophy, selectedId);
    });
  }

  // Spoiler-safe toggle.
  if (spoilerToggle) {
    spoilerToggle.addEventListener('change', () => {
      filterState.spoilerOn = spoilerToggle.checked;
      setBodySpoiler(filterState.spoilerOn);
      refreshAll();
    });
  }

  // View navigation.
  document.querySelectorAll('.mainnav button[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  // Easter-egg kind filters.
  document.querySelectorAll('.egg-filters .chip[data-egg]').forEach((chip) => {
    chip.addEventListener('click', () => {
      eggKind = chip.dataset.egg;
      document.querySelectorAll('.egg-filters .chip[data-egg]').forEach((c) => {
        c.classList.toggle('active', c === chip);
      });
      renderEggs(eggsListEl, eggs, eggKind, 'all');
    });
  });

  // Export / import progress.
  const exportBtn = $('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => store.exportToFile());
  }
  const importBtn = $('import-btn');
  const importFile = $('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      try {
        const count = await store.importFromFile(file);
        refreshAll();
        window.alert('Imported progress for ' + count + ' trophies.');
      } catch {
        window.alert('Could not import that file — it is not a valid progress export.');
      }
      importFile.value = '';
    });
  }

  // Static views rendered once from data.
  renderRoadmap(roadmapListEl, panels);
  renderGlitch(glitchPanelEl, panels);
  renderEggs(eggsListEl, eggs, 'all', 'all');

  setBodySpoiler(filterState.spoilerOn);
  refreshAll();

  // Screenshot modes (?shot=...): deterministic states for the 4 shots.
  const mode = shotMode();
  if (mode === 'cover') {
    filterState.spoilerOn = false;
    if (spoilerToggle) spoilerToggle.checked = false;
    setBodySpoiler(false);
    showView('tracker');
    selectedId = COVER_TROPHY;
    refreshAll();
  } else if (mode === 'roadmap') {
    showView('roadmap');
  } else if (mode === 'glitch') {
    showView('glitch');
  } else if (mode === 'spoiler') {
    filterState.spoilerOn = true;
    if (spoilerToggle) spoilerToggle.checked = true;
    setBodySpoiler(true);
    showView('tracker');
    refreshAll();
  }
}

start().catch((err) => {
  const listEl = $('trophy-list');
  if (listEl) {
    listEl.innerHTML =
      '<p class="view-intro" style="padding:12px">Could not load the guide data: ' +
      String(err && err.message ? err.message : err) + '</p>';
  }
  console.error(err);
});
