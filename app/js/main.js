// Leonida Platinum Atlas — wiring (Round 7, written fresh).
// Boots the data, renders every pane, and wires every control.
// URL ?shot=cover|roadmap|glitch|spoiler picks the screenshot state.
import { loadData, auditStats } from './data.js';
import { loadState, saveState, toggleEarned, setCount, countOf, exportState, importState, isEarned } from './store.js';
import { applyFilters, filterCounts } from './filters.js';
import * as V from './views.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let data;
let state;
let stats;

const $ = (id) => document.getElementById(id);

function currentTrophy() {
  return data.byName.get(state.selected) || null;
}

function renderAll() {
  const counts = filterCounts(data.trophies);
  document.querySelectorAll('[data-grade-chip]').forEach((b) => {
    const g = b.dataset.gradeChip;
    b.textContent = (g === 'all' ? 'All' : g[0].toUpperCase() + g.slice(1)) + ' (' + (counts[g] || 0) + ')';
    b.classList.toggle('active', state.grade === g);
  });
  $('kind-filter').value = state.kind;
  $('verified-filter').value = state.verified;
  $('missable-filter').checked = state.missableOnly;
  $('search').value = state.q;
  $('spoiler-toggle').textContent = state.spoiler ? 'Spoiler shield: ON' : 'Spoiler shield: OFF';
  $('spoiler-toggle').classList.toggle('on', state.spoiler);
  document.querySelectorAll('[data-view-tab]').forEach((b) => b.classList.toggle('active', state.view === b.dataset.viewTab));
  const filtered = applyFilters(data.trophies, state);
  $('result-count').textContent = filtered.length + ' of ' + data.trophies.length + ' trophies';
  V.renderAudit($('audit-strip'), stats);
  V.renderList($('trophy-list'), filtered, state);
  V.renderDetail($('detail'), currentTrophy(), data, state);
  V.renderProgress($('progress'), data.trophies, state);
  V.renderRoadmapMini($('roadmap-mini'), data.panels, state, data);
  V.renderNextUp($('next-up'), data.trophies, state);
  V.renderRoadmap($('view-roadmap'), data.panels, data, state);
  V.renderMissables($('view-missables'), data.panels, data, state);
  V.renderGlitch($('view-glitch'), data.panels, data);
  V.renderDisputes($('view-disputes'), data.panels, data);
  V.renderEggs($('view-eggs'), data.eggs);
  V.renderSources($('sources-list'), data);
  for (const v of ['checklist', 'roadmap', 'missables', 'glitch', 'disputes', 'eggs']) {
    $('view-' + v).hidden = state.view !== v;
  }
  document.querySelector('.layout').classList.toggle('no-list', state.view !== 'checklist');
  saveState(state);
}

function pickDefaultSelected() {
  if (shot === 'spoiler') {
    const story = data.trophies.find((t) => t.kind === 'story' && !isEarned(state, t.name));
    if (story) return story.name;
  }
  if (shot === 'cover') {
    // The cover shows a guide with cited steps, so pick the trophy with the
    // most steps and lift the spoiler shield for this capture.
    let best = null;
    for (const t of data.trophies) {
      if (!best || (t.steps || []).length > (best.steps || []).length) best = t;
    }
    if (best) return best.name;
  }
  const plat = data.trophies.find((t) => t.grade === 'platinum');
  if (plat) return plat.name;
  return data.trophies.length ? data.trophies[0].name : null;
}

async function boot() {
  data = await loadData();
  stats = auditStats(data);
  state = loadState();
  if (shot === 'roadmap') state.view = 'roadmap';
  else if (shot === 'glitch') state.view = 'glitch';
  else if (shot === 'spoiler') {
    state.view = 'checklist';
    state.spoiler = true;
  } else {
    // Cover capture: steps must be visible, so the shield is off here.
    state.view = 'checklist';
    if (shot === 'cover') state.spoiler = false;
  }
  if (!state.selected || !data.byName.has(state.selected)) state.selected = pickDefaultSelected();
  renderAll();

  document.querySelector('[data-view-tabs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view-tab]');
    if (!b) return;
    state.view = b.dataset.viewTab;
    renderAll();
  });
  $('search').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderAll();
  });
  $('kind-filter').addEventListener('change', (e) => {
    state.kind = e.target.value;
    renderAll();
  });
  $('verified-filter').addEventListener('change', (e) => {
    state.verified = e.target.value;
    renderAll();
  });
  $('missable-filter').addEventListener('change', (e) => {
    state.missableOnly = e.target.checked;
    renderAll();
  });
  document.querySelector('[data-grade-chips]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-grade-chip]');
    if (!b) return;
    state.grade = b.dataset.gradeChip;
    renderAll();
  });
  $('spoiler-toggle').addEventListener('click', () => {
    state.spoiler = !state.spoiler;
    renderAll();
  });
  document.body.addEventListener('click', (e) => {
    const sel = e.target.closest('[data-select]');
    if (sel) {
      state.selected = sel.dataset.select;
      state.view = 'checklist';
      renderAll();
      return;
    }
    const earn = e.target.closest('[data-earn]');
    if (earn) {
      toggleEarned(state, earn.dataset.earn);
      renderAll();
      return;
    }
    const cnt = e.target.closest('[data-count]');
    if (cnt) {
      const name = cnt.dataset.name;
      setCount(state, name, countOf(state, name) + Number(cnt.dataset.count));
      renderAll();
    }
  });
  document.body.addEventListener('change', (e) => {
    const input = e.target.closest('[data-count-input]');
    if (input) {
      setCount(state, input.dataset.countInput, input.value);
      renderAll();
    }
  });
  $('export-btn').addEventListener('click', () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-platinum-atlas-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state = importState(await file.text());
      if (!state.selected || !data.byName.has(state.selected)) state.selected = pickDefaultSelected();
      renderAll();
    } catch {
      alert('That file is not a Leonida Atlas export.');
    }
    e.target.value = '';
  });
}

boot().catch((err) => {
  document.getElementById('detail').innerHTML =
    '<p class="empty">Could not load the guide data. Serve the app/ folder over HTTP (see serve.ts) and reload. ' + V.esc(err.message) + '</p>';
});
