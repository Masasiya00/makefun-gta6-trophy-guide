// main.js — bootstrap for the Leonida Platinum Atlas.
// Loads the data, restores saved progress, wires the filters, the spoiler
// shield, export/import and the hash-routed views (tracker, roadmap,
// missables, disputes, glitch, sources, easter eggs).

import { auditStats, loadGuideData } from './data.js';
import { applyFilters } from './filters.js';
import { downloadFile, exportState, getCount, loadState, parseImport, resetProgress, saveState, setCount, toggleEarned } from './store.js';
import {
  renderAuditStrip,
  renderDetail,
  renderDisputes,
  renderEggs,
  renderMissables,
  renderProgress,
  renderRoadmap,
  renderSources,
  renderTrophyList,
} from './views.js';

const VIEWS = ['tracker', 'roadmap', 'missables', 'disputes', 'sources', 'eggs'];
const VIEW_TITLES = {
  tracker: 'Tracker',
  roadmap: 'Roadmap',
  missables: 'Missables',
  disputes: 'Disputes',
  sources: 'Sources',
  eggs: 'Easter Eggs',
};

/** Read the view from the URL hash (#roadmap etc.), defaulting to tracker. */
function viewFromHash() {
  const v = location.hash.replace('#', '').split('/')[0];
  return VIEWS.includes(v) ? v : 'tracker';
}

async function boot() {
  const data = await loadGuideData();
  const trophies = data.trophies.trophies;
  const state = loadState();
  const stats = auditStats(data);

  const $ = (id) => document.getElementById(id);
  const auditEl = $('audit-strip');
  const listEl = $('trophy-list');
  const detailEl = $('detail-pane');
  const progressEl = $('progress-rail');
  const viewEl = $('view-pane');
  const filterForm = $('filters');

  const filters = { kind: 'all', grade: 'all', status: 'all', query: '' };
  let selectedId = state.selectedId ?? trophies[0]?.id ?? null;

  renderAuditStrip(data, auditEl);
  $('dispute-badge').textContent = String(stats.disputeCount);

  // Header counts, computed from the data — never hard-coded (hidden = 27
  // confirmed; +2 unverified candidates are named in the README).
  const gradeCount = (g) => trophies.filter((t) => t.grade === g).length;
  $('header-counts').textContent =
    `${gradeCount('platinum')} Platinum · ${gradeCount('gold')} Gold · ${gradeCount('silver')} Silver · ${gradeCount('bronze')} Bronze · ${stats.hiddenTotal} Hidden`;

  /** Re-render the tracker panes (list + detail + progress) from current state. */
  function renderTracker() {
    const filtered = applyFilters(trophies, state, filters);
    $('list-count').textContent = `${filtered.length}/${trophies.length} trophy`;
    $('earned-count').textContent = `${state.earned.length}/${trophies.length} didapat`;
    renderTrophyList(filtered, state, listEl, selectedId, (id) => {
      selectedId = id;
      state.selectedId = id;
      saveState(state);
      renderTracker();
    });
    const selected = trophies.find((t) => t.id === selectedId) ?? null;
    renderDetail(selected, data, state, detailEl, (id, value, total) => {
      setCount(state, id, value, total);
      renderTracker();
    });
    renderProgress(trophies, state, progressEl, (id) => {
      selectedId = id;
      state.selectedId = id;
      saveState(state);
      renderTracker();
    });
  }

  /** Re-render the active secondary view (roadmap, missables, ...). */
  function renderView() {
    const view = state.view;
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.view === view);
      tab.setAttribute('aria-current', tab.dataset.view === view ? 'page' : 'false');
    });
    const isTracker = view === 'tracker';
    $('tracker-layout').hidden = !isTracker;
    viewEl.hidden = isTracker;
    if (isTracker) {
      renderTracker();
      return;
    }
    const goToTrophy = (id) => {
      selectedId = id;
      state.selectedId = id;
      state.view = 'tracker';
      saveState(state);
      location.hash = '#tracker';
      renderView();
    };
    if (view === 'roadmap') renderRoadmap(data, state, viewEl, goToTrophy);
    if (view === 'missables') renderMissables(data, state, viewEl, goToTrophy);
    if (view === 'disputes') renderDisputes(data, viewEl);
    if (view === 'sources') renderSources(data, viewEl);
    if (view === 'eggs') {
      renderEggs(data, state, viewEl);
      $('egg-kind').addEventListener('change', (e) => {
        state.eggKind = e.target.value;
        saveState(state);
        renderView();
      });
      $('egg-status').addEventListener('change', (e) => {
        state.eggStatus = e.target.value;
        saveState(state);
        renderView();
      });
    }
  }

  /** Switch view from nav or hash. */
  function setView(view) {
    state.view = VIEWS.includes(view) ? view : 'tracker';
    saveState(state);
    renderView();
  }

  // Filters.
  filterForm.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'kind') filters.kind = t.value;
    if (t.name === 'grade') filters.grade = t.value;
    if (t.name === 'status') filters.status = t.value;
    if (t.name === 'query') filters.query = t.value;
    renderTracker();
  });

  // Checklist toggles (delegated: the list re-renders on every change).
  listEl.addEventListener('change', (e) => {
    const box = e.target.closest('[data-check]');
    if (!box) return;
    toggleEarned(state, box.getAttribute('data-check'));
    renderTracker();
  });

  // Spoiler shield toggle.
  const shield = $('spoiler-shield');
  shield.checked = state.spoilerShield;
  shield.addEventListener('change', () => {
    state.spoilerShield = shield.checked;
    saveState(state);
    renderView();
  });

  // Export / import / reset.
  $('export-btn').addEventListener('click', () => {
    downloadFile('leonida-platinum-atlas-progress.json', exportState(state));
  });
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      state.earned = imported.earned.filter((id) => trophies.some((t) => t.id === id));
      state.counts = imported.counts;
      saveState(state);
      renderView();
      $('import-status').textContent = `Diimpor: ${state.earned.length} trophy didapat.`;
    } catch (err) {
      $('import-status').textContent = `Gagal impor: ${err.message}`;
    }
    e.target.value = '';
  });
  $('reset-btn').addEventListener('click', () => {
    if (window.confirm('Hapus semua progres tracker? (Pengaturan spoiler tetap.)')) {
      resetProgress(state);
      renderView();
    }
  });

  // Nav tabs + hash routing (screenshots open views by hash: #roadmap, #disputes, #sources).
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      location.hash = `#${tab.dataset.view}`;
    });
  });
  window.addEventListener('hashchange', () => setView(viewFromHash()));

  setView(viewFromHash());
}

boot().catch((err) => {
  const el = document.getElementById('load-error');
  if (el) {
    el.hidden = false;
    el.textContent = `Gagal memuat data guide: ${err.message}. Pastikan app/data/*.json ada dan server statis berjalan.`;
  }
  console.error(err);
});
