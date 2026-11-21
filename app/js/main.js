// main.js — bootstrap: loads data, wires the panes, routes pages and
// ?shot= presets (the four screenshot compositions).

import { loadData, computeAudit } from './data.js';
import {
  loadState, saveState, toggleEarned, setCount,
  addNextUp, removeNextUp, moveNextUp,
  downloadExport, importJson, resetState,
} from './store.js';
import * as views from './views.js';

const $ = (id) => document.getElementById(id);

const els = {
  list: $('trophy-list'),
  count: $('list-count'),
  progress: $('progress-block'),
  center: $('center-content'),
  audit: $('audit-card'),
  auditMini: $('audit-mini'),
  roadmapMini: $('roadmap-mini'),
  nextUp: $('nextup-card'),
  foot: $('foot-audit'),
  spoilerToggle: $('spoiler-toggle'),
};

let data = null;
let audit = null;
let state = loadState();
let eggFilter = '';

// Demo overlay for ?shot= presets: what the screenshots show. It is merged
// into the view state at render time and NEVER written to localStorage, so
// a screenshot preset can never pollute the user's real checklist.
const demo = { earned: {}, nextUp: [] };

function viewState() {
  return {
    ...state,
    earned: { ...state.earned, ...demo.earned },
    nextUp: state.nextUp.length ? state.nextUp : demo.nextUp,
    filters: state.filters,
  };
}

function renderAll() {
  const vs = viewState();
  views.renderList(data, vs, els);
  views.renderAudit(data, vs, audit, els);
  views.renderNextUp(data, vs, els);
  renderCenter(vs);
  els.spoilerToggle.textContent = `Spoiler shield: ${state.spoiler ? 'ON' : 'OFF'}`;
  els.spoilerToggle.setAttribute('aria-pressed', String(state.spoiler));
  document.querySelectorAll('#pagenav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === state.page);
  });
}

function renderCenter(vs) {
  const s = vs || viewState();
  switch (state.page) {
    case 'roadmap': views.renderRoadmap(data, els); break;
    case 'missables': views.renderMissables(data, els); break;
    case 'glitch': views.renderGlitch(data, els); break;
    case 'launch': views.renderLaunch(data, els); break;
    case 'disputes': views.renderDisputes(data, els); break;
    case 'eggs': views.renderEggs(data, s, els, eggFilter); break;
    case 'sources': views.renderSources(data, els); break;
    case 'settings': views.renderSettings(data, s, els, audit); break;
    default: views.renderDetail(data, s, els);
  }
}

function setPage(page) {
  state.page = page;
  saveState(state);
  renderAll();
}

// ?shot= presets used for the four screenshots. They only change what is
// shown in this session, through the demo overlay; the saved checklist is
// never rewritten by a shot.
function applyShotPreset() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  if (shot === '01-cover') {
    state.page = 'guide';
    state.selected = 'Positive Mental Attitude';
    // Demo progress shown in-memory for the cover composition only.
    const demoEarned = ['Just Like Paradise', 'Paradise Lost', 'Positive Mental Attitude',
      'T**s Ass Drug Money', 'Trust', 'Road to Rehabilitation', 'This Was No Boat Accident',
      'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
      'Fair Game', 'Vice City, Baby!', 'Break the Bank'];
    for (const n of demoEarned) demo.earned[n] = true;
    demo.nextUp = ['Top Of The World, Ma', 'Family Matters', 'DWNFALL'];
  } else if (shot === '02-roadmap') {
    state.page = 'roadmap';
  } else if (shot === '03-glitch') {
    state.page = 'glitch';
  } else if (shot === '04-spoiler') {
    state.page = 'guide';
    state.spoiler = true;
    state.selected = 'Just Like Paradise';
    demo.nextUp = ['Positive Mental Attitude', 'T**s Ass Drug Money', 'Trust'];
  }
}

function wireEvents() {
  // Left pane: search + filters.
  $('search').addEventListener('input', (e) => {
    state.filters.query = e.target.value;
    saveState(state);
    views.renderList(data, state, els);
  });
  $('filter-kind').addEventListener('change', (e) => {
    state.filters.kind = e.target.value; saveState(state);
    views.renderList(data, state, els);
  });
  $('filter-grade').addEventListener('change', (e) => {
    state.filters.grade = e.target.value; saveState(state);
    views.renderList(data, state, els);
  });
  $('filter-status').addEventListener('change', (e) => {
    state.filters.status = e.target.value; saveState(state);
    views.renderList(data, state, els);
  });
  // Restore saved filter values into the controls.
  $('search').value = state.filters.query || '';
  $('filter-kind').value = state.filters.kind || '';
  $('filter-grade').value = state.filters.grade || '';
  $('filter-status').value = state.filters.status || '';

  // Page nav.
  $('pagenav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (btn) setPage(btn.dataset.page);
  });

  // Spoiler toggle (header).
  els.spoilerToggle.addEventListener('click', () => {
    state.spoiler = !state.spoiler;
    saveState(state);
    renderAll();
  });

  // Export / import (header + right pane).
  const doExport = () => { downloadExport(state); setIoStatus('Exported your progress as JSON.'); };
  $('export-btn').addEventListener('click', doExport);
  $('export-btn-2').addEventListener('click', doExport);
  const doImport = async (file) => {
    if (!file) return;
    const text = await file.text();
    const res = importJson(state, text);
    setIoStatus(res.message);
    renderAll();
  };
  $('import-file').addEventListener('change', (e) => doImport(e.target.files[0]));
  $('import-file-2').addEventListener('change', (e) => doImport(e.target.files[0]));

  // Delegated clicks across list + center + right pane.
  document.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-name]');
    const earnBox = e.target.closest('input[data-earn]');
    const nextBtn = e.target.closest('[data-nextup]');
    const rmBtn = e.target.closest('[data-remove-nextup]');
    const upBtn = e.target.closest('[data-move-up]');
    const downBtn = e.target.closest('[data-move-down]');
    const countInput = e.target.closest('input[data-count]');
    const eggBtn = e.target.closest('[data-egg-filter]');
    const settingsSpoiler = e.target.closest('#settings-spoiler');
    const settingsExport = e.target.closest('#settings-export');
    const settingsReset = e.target.closest('#settings-reset');

    if (earnBox) {
      e.stopPropagation();
      toggleEarned(state, earnBox.dataset.earn);
      renderAll();
      return;
    }
    if (nextBtn) { addNextUp(state, nextBtn.dataset.nextup); renderAll(); return; }
    if (rmBtn) { removeNextUp(state, rmBtn.dataset.removeNextup); renderAll(); return; }
    if (upBtn) { moveNextUp(state, upBtn.dataset.moveUp, -1); renderAll(); return; }
    if (downBtn) { moveNextUp(state, downBtn.dataset.moveDown, 1); renderAll(); return; }
    if (eggBtn) { eggFilter = eggBtn.dataset.eggFilter; renderCenter(); return; }
    if (settingsSpoiler) { state.spoiler = !state.spoiler; saveState(state); renderAll(); return; }
    if (settingsExport) { doExport(); return; }
    if (settingsReset) {
      if (window.confirm('Reset all progress? This clears your earned trophies, counts and Next Up list.')) {
        state = resetState();
        renderAll();
      }
      return;
    }
    if (countInput) return; // typing in the count box is handled below
    if (li) {
      state.selected = li.dataset.name;
      state.page = 'guide';
      saveState(state);
      renderAll();
    }
  });

  // Count tracker inputs + settings import file input (delegated, survives re-render).
  document.addEventListener('change', (e) => {
    const countInput = e.target.closest('input[data-count]');
    if (countInput) {
      setCount(state, countInput.dataset.count, countInput.value);
      renderAll();
      return;
    }
    if (e.target.id === 'settings-import') doImport(e.target.files[0]);
  });
}

function setIoStatus(msg) {
  const el = $('io-status');
  if (el) el.textContent = msg;
  const el2 = $('settings-io-status');
  if (el2) el2.textContent = msg;
}

async function boot() {
  try {
    data = await loadData();
  } catch (err) {
    els.center.innerHTML = `<p>Could not load the guide data: ${err.message}</p>`;
    return;
  }
  audit = computeAudit(data);
  if (!state.selected) state.selected = data.trophies[0]?.name || null;
  applyShotPreset();
  wireEvents();
  renderAll();
}

boot();
