// Leonida Platinum Atlas — wiring. Loads the three local JSON files, renders
// the active view, and keeps the progress header in sync. URL parameters
// pick the opening view for deep links and screenshots:
//   ?view=checklist|roadmap|missables|eggs|glitch|launch|tracker
//   ?detail=<trophy name>   (opens that trophy's guide pane)
//   ?spoiler=on|off
import { loadAll } from './data.js';
import { loadState, saveState, toggleEarned, setCount, setSpoiler, setNote, exportFile, importFile } from './store.js';
import { filterTrophies, filterEggs, nextUp } from './filters.js';
import { checklistView, roadmapView, missablesView, eggsView, glitchView, launchView, trackerView } from './views.js';

const viewEl = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
const params = new URLSearchParams(location.search);

const data = await loadAll();
let state = loadState();
if (params.get('spoiler') === 'on') state.spoiler = true;
if (params.get('spoiler') === 'off') state.spoiler = false;

const ui = {
  view: params.get('view') || 'checklist',
  kind: 'all',
  grade: 'all',
  query: '',
  detail: params.get('detail') || null,
  eggCategory: 'all',
  eggStatus: 'all',
  eggQuery: '',
};
if (!['checklist', 'roadmap', 'missables', 'eggs', 'glitch', 'launch', 'tracker'].includes(ui.view)) ui.view = 'checklist';

function updateHeader() {
  const earned = new Set(state.earned);
  const total = data.trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  document.getElementById('progressText').textContent = earned.size + ' / ' + total;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressSub').textContent = pct + '% to platinum · 52/55 guides confirmed · 2 reported · 1 unknown (Ten Pin)';
}

function render() {
  updateHeader();
  for (const b of tabsEl.querySelectorAll('button')) {
    b.classList.toggle('active', b.dataset.view === ui.view);
  }
  let html = '';
  if (ui.view === 'checklist') {
    const filtered = filterTrophies(data.trophies, { kind: ui.kind, grade: ui.grade, query: ui.query, earned: new Set(state.earned) });
    html = checklistView(data, state, ui, filtered);
  } else if (ui.view === 'roadmap') {
    html = roadmapView(data.panels);
  } else if (ui.view === 'missables') {
    html = missablesView(data.panels);
  } else if (ui.view === 'eggs') {
    const filtered = filterEggs(data.eggs, { category: ui.eggCategory, status: ui.eggStatus, query: ui.eggQuery });
    html = eggsView(data.eggs, ui, filtered);
  } else if (ui.view === 'glitch') {
    html = glitchView(data.panels);
  } else if (ui.view === 'launch') {
    html = launchView(data.panels);
  } else {
    html = trackerView(data, state, nextUp(data.trophies, state));
  }
  viewEl.innerHTML = html;
  bindView();
}

function bindView() {
  // Row clicks open the detail pane. The checkbox inside a row gets its own
  // listener with stopPropagation, so ticking a trophy is never swallowed
  // by the row's re-render.
  for (const row of viewEl.querySelectorAll('tr[data-open]')) {
    row.addEventListener('click', () => {
      ui.detail = row.dataset.open;
      ui.view = 'checklist';
      render();
      const detail = document.getElementById('detail');
      if (detail) detail.scrollIntoView({ block: 'nearest' });
    });
  }
  for (const box of viewEl.querySelectorAll('input[data-toggle]')) {
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      state = toggleEarned(state, box.dataset.toggle);
      render();
    });
  }
  for (const input of viewEl.querySelectorAll('input[data-count-for]')) {
    input.addEventListener('change', () => {
      state = setCount(state, input.dataset.countFor, input.value);
      render();
    });
  }
  for (const area of viewEl.querySelectorAll('textarea[data-note-for]')) {
    area.addEventListener('change', () => {
      state = setNote(state, area.dataset.noteFor, area.value);
    });
  }
  const q = document.getElementById('q');
  if (q) {
    q.addEventListener('input', () => {
      ui.query = q.value;
      const pos = q.selectionStart;
      render();
      const q2 = document.getElementById('q');
      if (q2) {
        q2.focus();
        q2.setSelectionRange(pos, pos);
      }
    });
  }
  const gradeSel = document.getElementById('gradeSel');
  if (gradeSel) gradeSel.addEventListener('change', () => { ui.grade = gradeSel.value; render(); });
  const spoilerToggle = document.getElementById('spoilerToggle');
  if (spoilerToggle) spoilerToggle.addEventListener('change', () => { state = setSpoiler(state, spoilerToggle.checked); render(); });
  for (const chip of viewEl.querySelectorAll('[data-kind]')) {
    chip.addEventListener('click', () => { ui.kind = chip.dataset.kind; render(); });
  }
  const eggQ = document.getElementById('eggQ');
  if (eggQ) {
    eggQ.addEventListener('input', () => {
      ui.eggQuery = eggQ.value;
      const pos = eggQ.selectionStart;
      render();
      const q2 = document.getElementById('eggQ');
      if (q2) {
        q2.focus();
        q2.setSelectionRange(pos, pos);
      }
    });
  }
  for (const chip of viewEl.querySelectorAll('[data-eggcat]')) {
    chip.addEventListener('click', () => { ui.eggCategory = chip.dataset.eggcat; render(); });
  }
  for (const chip of viewEl.querySelectorAll('[data-eggstatus]')) {
    chip.addEventListener('click', () => { ui.eggStatus = chip.dataset.eggstatus; render(); });
  }
  for (const btn of viewEl.querySelectorAll('[data-action="close-detail"]')) {
    btn.addEventListener('click', () => { ui.detail = null; render(); });
  }
  for (const btn of viewEl.querySelectorAll('[data-action="open-next"]')) {
    btn.addEventListener('click', () => { ui.detail = btn.dataset.name; ui.view = 'checklist'; render(); });
  }
  for (const btn of viewEl.querySelectorAll('[data-action="export"]')) {
    btn.addEventListener('click', () => exportFile(state));
  }
  for (const btn of viewEl.querySelectorAll('[data-action="reset"]')) {
    btn.addEventListener('click', () => {
      if (confirm('Reset all progress, counts and notes?')) {
        localStorage.removeItem('leonida-platinum-atlas-v1');
        state = loadState();
        render();
      }
    });
  }
  const importInput = document.getElementById('importFile');
  if (importInput) {
    importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      if (!file) return;
      try {
        state = await importFile(file);
      } catch {
        alert('That file is not a valid progress export.');
      }
      render();
    });
  }
}

tabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-view]');
  if (!btn) return;
  ui.view = btn.dataset.view;
  ui.detail = null;
  render();
});

render();
