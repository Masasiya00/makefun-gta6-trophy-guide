// Wires the app: tabs + hash routing, filters, checklist, detail pane, Next Up,
// Easter Eggs section, settings (spoiler, export/import/reset).
import { loadAll } from './data.js';
import { loadState, saveState, toggleEarned, setCount, exportFile, importFile } from './store.js';
import { filterTrophies, filterEggs, nextUp } from './filters.js';
import {
  renderHeader, renderList, renderDetail, renderRoadmap, renderMissables,
  renderGlitch, renderEggs, renderSources, spoilerMasked,
} from './views.js';

const TABS = ['checklist', 'roadmap', 'missables', 'glitch', 'eggs', 'settings'];
const { trophies, trophyMeta, panels, eggs } = await loadAll();
let state = loadState();
let selectedId = 2;
let filterOpts = { q: '', kind: 'all', grade: 'all', status: 'all', missableOnly: false, hiddenOnly: false };
let eggOpts = { q: '', category: 'all', status: 'all' };

function showTab(name) {
  if (!TABS.includes(name)) name = 'checklist';
  for (const t of TABS) {
    document.getElementById('panel-' + t).classList.toggle('hidden', t !== name);
    document.querySelector(`#tabs button[data-tab="${t}"]`).classList.toggle('active', t === name);
  }
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
}

function refreshAll() {
  renderHeader(trophies, state, trophyMeta);
  const shown = filterTrophies(trophies, state, filterOpts);
  document.getElementById('countLine').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies — ${state.earned.length} earned.`;
  renderList(
    document.getElementById('trophyList'), shown, state,
    (id) => { selectedId = id; refreshDetail(); refreshListOnly(); },
    (id) => { toggleEarned(state, id); refreshAll(); },
    selectedId,
  );
  refreshDetail();
  renderRoadmap(panels, trophies, state);
  const ups = nextUp(trophies, state, 3);
  document.getElementById('nextUp').innerHTML =
    ups.length === 0
      ? '<b>Next Up:</b> all 55 trophies earned — Vice Got a Price! is yours.'
      : '<b>Next Up:</b> ' + ups.map((t) => {
        const label = spoilerMasked(t, state) ? 'Hidden story trophy' : t.name;
        const extra = t.counts ? ` (${state.counts[t.id] || 0}/${t.counts.target} ${t.counts.label})` : '';
        return `${label}${extra}`;
      }).join(' · ');
}

function refreshListOnly() {
  const shown = filterTrophies(trophies, state, filterOpts);
  renderList(
    document.getElementById('trophyList'), shown, state,
    (id) => { selectedId = id; refreshDetail(); refreshListOnly(); },
    (id) => { toggleEarned(state, id); refreshAll(); },
    selectedId,
  );
}

function refreshDetail() {
  const t = trophies.find((x) => x.id === selectedId) || trophies[0];
  renderDetail(
    document.getElementById('detail'), t, state, panels,
    (id, value) => { setCount(state, id, value); refreshAll(); },
    (id) => { toggleEarned(state, id); refreshAll(); },
  );
}

function refreshEggs() {
  renderEggs(filterEggs(eggs, eggOpts));
}

// Tabs + hash routing.
document.getElementById('tabs').addEventListener('click', (ev) => {
  const btn = ev.target.closest('button[data-tab]');
  if (btn) showTab(btn.dataset.tab);
});
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

// Checklist filters.
const bind = (id, key) => document.getElementById(id).addEventListener('input', (ev) => {
  filterOpts[key] = ev.target.value;
  refreshAll();
});
bind('q', 'q');
bind('kind', 'kind');
bind('grade', 'grade');
bind('status', 'status');
document.getElementById('missableOnly').addEventListener('change', (ev) => {
  filterOpts.missableOnly = ev.target.checked;
  refreshAll();
});
document.getElementById('hiddenOnly').addEventListener('change', (ev) => {
  filterOpts.hiddenOnly = ev.target.checked;
  refreshAll();
});

// Spoiler guard (two checkboxes kept in sync).
function setSpoiler(on) {
  state.spoiler = on;
  saveState(state);
  document.getElementById('spoiler').checked = on;
  document.getElementById('spoiler2').checked = on;
  refreshAll();
}
document.getElementById('spoiler').addEventListener('change', (ev) => setSpoiler(ev.target.checked));
document.getElementById('spoiler2').addEventListener('change', (ev) => setSpoiler(ev.target.checked));

// Easter Eggs filters.
document.getElementById('eggCat').addEventListener('change', (ev) => { eggOpts.category = ev.target.value; refreshEggs(); });
document.getElementById('eggStatus').addEventListener('change', (ev) => { eggOpts.status = ev.target.value; refreshEggs(); });
document.getElementById('eggQ').addEventListener('input', (ev) => { eggOpts.q = ev.target.value; refreshEggs(); });

// Settings: export / import / reset.
document.getElementById('exportBtn').addEventListener('click', () => {
  exportFile(state);
  document.getElementById('saveMsg').textContent = 'Progress exported as JSON.';
});
document.getElementById('importFile').addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    state = await importFile(file);
    document.getElementById('spoiler').checked = state.spoiler;
    document.getElementById('spoiler2').checked = state.spoiler;
    document.getElementById('saveMsg').textContent = `Imported ${state.earned.length} earned trophies.`;
    refreshAll();
  } catch (err) {
    document.getElementById('saveMsg').textContent = 'Import failed: ' + err.message;
  }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!window.confirm('Reset all progress? This clears every tick and count.')) return;
  state = { earned: [], counts: {}, spoiler: true, notes: {} };
  saveState(state);
  document.getElementById('spoiler').checked = true;
  document.getElementById('spoiler2').checked = true;
  document.getElementById('saveMsg').textContent = 'Progress reset.';
  refreshAll();
});

// Static sections.
renderMissables(panels);
renderGlitch(panels);
renderSources(panels);
document.getElementById('spoiler').checked = state.spoiler;
document.getElementById('spoiler2').checked = state.spoiler;
refreshAll();
refreshEggs();
showTab(location.hash.slice(1) || 'checklist');
