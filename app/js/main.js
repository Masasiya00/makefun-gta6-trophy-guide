// main.js — startup: fetches the data, wires the three panes, routes pages
// and honours the ?shot= presets (the four screenshot compositions).

import { loadData, computeAudit } from './data.js';
import {
  loadState, saveState, toggleEarned, setCount,
  addNextUp, removeNextUp, moveNextUp,
  downloadExport, importJson, resetState,
} from './store.js';
import * as views from './views.js';

const $ = (id) => document.getElementById(id);

const nodes = {
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

let guideData = null;
let auditData = null;
let appState = loadState();
let eggFilter = '';

// Demo overlay behind the ?shot= presets: what the screenshots display.
// It is folded into the view state when rendering and NEVER saved to
// localStorage, so a screenshot preset can never contaminate the real list.
const demo = { earned: {}, nextUp: [] };

function currentView() {
  return {
    ...appState,
    earned: { ...appState.earned, ...demo.earned },
    nextUp: appState.nextUp.length ? appState.nextUp : demo.nextUp,
    filters: appState.filters,
  };
}

function renderEverything() {
  const vs = currentView();
  views.renderList(guideData, vs, nodes);
  views.renderAudit(guideData, vs, auditData, nodes);
  views.renderNextUp(guideData, vs, nodes);
  renderCenter(vs);
  nodes.spoilerToggle.textContent = `Spoiler shield: ${appState.spoiler ? 'ON' : 'OFF'}`;
  nodes.spoilerToggle.setAttribute('aria-pressed', String(appState.spoiler));
  document.querySelectorAll('#pagenav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === appState.page);
  });
}

function renderCenter(vs) {
  const view = vs || currentView();
  switch (appState.page) {
    case 'roadmap': views.renderRoadmap(guideData, nodes); break;
    case 'missables': views.renderMissables(guideData, nodes); break;
    case 'glitch': views.renderGlitch(guideData, nodes); break;
    case 'launch': views.renderLaunch(guideData, nodes); break;
    case 'disputes': views.renderDisputes(guideData, nodes); break;
    case 'eggs': views.renderEggs(guideData, view, nodes, eggFilter); break;
    case 'sources': views.renderSources(guideData, nodes); break;
    case 'settings': views.renderSettings(guideData, view, nodes, auditData); break;
    default: views.renderDetail(guideData, view, nodes);
  }
}

function goToPage(page) {
  appState.page = page;
  saveState(appState);
  renderEverything();
}

// ?shot= presets behind the four screenshots. They only alter what shows
// in this session, through the demo overlay; the stored checklist is
// never rewritten by a shot.
function applyShotPreset() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  if (shot === '01-cover') {
    appState.page = 'guide';
    appState.selected = 'Positive Mental Attitude';
    // Demo progress shown in-memory for the cover composition only.
    const demoEarned = ['Just Like Paradise', 'Paradise Lost', 'Positive Mental Attitude',
      'T**s Ass Drug Money', 'Trust', 'Road to Rehabilitation', 'This Was No Boat Accident',
      'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
      'Fair Game', 'Vice City, Baby!', 'Break the Bank'];
    for (const n of demoEarned) demo.earned[n] = true;
    demo.nextUp = ['Top Of The World, Ma', 'Family Matters', 'DWNFALL'];
  } else if (shot === '02-roadmap') {
    appState.page = 'roadmap';
  } else if (shot === '03-glitch') {
    appState.page = 'glitch';
  } else if (shot === '04-spoiler') {
    appState.page = 'guide';
    appState.spoiler = true;
    appState.selected = 'Just Like Paradise';
    demo.nextUp = ['Positive Mental Attitude', 'T**s Ass Drug Money', 'Trust'];
  }
}

function wireEvents() {
  // Left pane: search + filters.
  $('search').addEventListener('input', (e) => {
    appState.filters.query = e.target.value;
    saveState(appState);
    views.renderList(guideData, appState, nodes);
  });
  $('filter-kind').addEventListener('change', (e) => {
    appState.filters.kind = e.target.value; saveState(appState);
    views.renderList(guideData, appState, nodes);
  });
  $('filter-grade').addEventListener('change', (e) => {
    appState.filters.grade = e.target.value; saveState(appState);
    views.renderList(guideData, appState, nodes);
  });
  $('filter-status').addEventListener('change', (e) => {
    appState.filters.status = e.target.value; saveState(appState);
    views.renderList(guideData, appState, nodes);
  });
  // Put the saved filter values back into the controls.
  $('search').value = appState.filters.query || '';
  $('filter-kind').value = appState.filters.kind || '';
  $('filter-grade').value = appState.filters.grade || '';
  $('filter-status').value = appState.filters.status || '';

  // Page nav.
  $('pagenav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (btn) goToPage(btn.dataset.page);
  });

  // Spoiler toggle (header).
  nodes.spoilerToggle.addEventListener('click', () => {
    appState.spoiler = !appState.spoiler;
    saveState(appState);
    renderEverything();
  });

  // Export / import (header + right pane).
  const doExport = () => { downloadExport(appState); setIoStatus('Exported your progress as JSON.'); };
  $('export-btn').addEventListener('click', doExport);
  $('export-btn-2').addEventListener('click', doExport);
  const doImport = async (file) => {
    if (!file) return;
    const text = await file.text();
    const res = importJson(appState, text);
    setIoStatus(res.message);
    renderEverything();
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
      toggleEarned(appState, earnBox.dataset.earn);
      renderEverything();
      return;
    }
    if (nextBtn) { addNextUp(appState, nextBtn.dataset.nextup); renderEverything(); return; }
    if (rmBtn) { removeNextUp(appState, rmBtn.dataset.removeNextup); renderEverything(); return; }
    if (upBtn) { moveNextUp(appState, upBtn.dataset.moveUp, -1); renderEverything(); return; }
    if (downBtn) { moveNextUp(appState, downBtn.dataset.moveDown, 1); renderEverything(); return; }
    if (eggBtn) { eggFilter = eggBtn.dataset.eggFilter; renderCenter(); return; }
    if (settingsSpoiler) { appState.spoiler = !appState.spoiler; saveState(appState); renderEverything(); return; }
    if (settingsExport) { doExport(); return; }
    if (settingsReset) {
      if (window.confirm('Reset all progress? This clears your earned trophies, counts and Next Up list.')) {
        appState = resetState();
        renderEverything();
      }
      return;
    }
    if (countInput) return; // typing in the count box is handled below
    if (li) {
      appState.selected = li.dataset.name;
      appState.page = 'guide';
      saveState(appState);
      renderEverything();
    }
  });

  // Count tracker inputs + settings import file input (delegated, survives re-render).
  document.addEventListener('change', (e) => {
    const countInput = e.target.closest('input[data-count]');
    if (countInput) {
      setCount(appState, countInput.dataset.count, countInput.value);
      renderEverything();
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
    guideData = await loadData();
  } catch (err) {
    nodes.center.innerHTML = `<p>Could not load the guide data: ${err.message}</p>`;
    return;
  }
  auditData = computeAudit(guideData);
  if (!appState.selected) appState.selected = guideData.trophies[0]?.name || null;
  applyShotPreset();
  wireEvents();
  renderEverything();
}

boot();
