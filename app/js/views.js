// views.js — every render function for the guide: the trophy checklist,
// the selected trophy's detail pane, progress, Next Up planner, roadmap,
// glitch & farming, and the easter-eggs list. All output is built from
// the loaded JSON data; nothing here fetches the network.

import { applyFilters, applySpoilerClass, SPOILER_PLACEHOLDER } from './filters.js';

export const GRADE_LABELS = {
  platinum: 'PLAT',
  gold: 'GOLD',
  silver: 'SILVER',
  bronze: 'BRONZE',
};

export const VERIFIED_LABELS = {
  confirmed: 'CONFIRMED',
  reported: 'REPORTED',
  unknown: 'UNKNOWN — not yet verified',
};

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gradeLabel(grade) {
  return GRADE_LABELS[grade] || grade.toUpperCase();
}

/** Switch the visible view (tracker / roadmap / glitch / eggs). */
export function showView(name) {
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === 'view-' + name);
  });
  document.querySelectorAll('.mainnav button[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
}

/**
 * Render the trophy checklist rows into #trophy-list.
 * `filterState` is { kind, query, spoilerOn }; `selectedId` highlights
 * the open trophy. `onSelect` runs when a row is clicked.
 */
export function renderTrophyList(listEl, trophies, store, filterState, onSelect, selectedId) {
  const visible = applyFilters(trophies, filterState);
  if (visible.length === 0) {
    listEl.innerHTML =
      '<p class="view-intro" style="padding:12px">No trophies match this filter' +
      ' — try another kind or clear the search.</p>';
    return;
  }
  listEl.innerHTML = '';
  for (const t of visible) {
    const earned = store.isEarned(t.id);
    const row = document.createElement('label');
    row.className = 'trow grade-' + t.grade + (t.missable ? ' missable-row' : '');
    if (t.verified === 'unknown') row.classList.add('unknown-row');
    row.dataset.trophy = t.id;
    if (t.id === selectedId) row.style.background = 'var(--panel2)';
    applySpoilerClass(row, t, filterState.spoilerOn, earned);

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.dataset.trophy = t.id;
    check.checked = earned;
    check.setAttribute('aria-label', 'Mark earned: ' + t.name);
    check.addEventListener('change', () => {
      // No stopPropagation here: the change must bubble to #trophy-list,
      // whose delegated listener refreshes progress, Next Up and masking.
      store.setEarned(t.id, check.checked);
    });

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = gradeLabel(t.grade);

    const name = document.createElement('span');
    name.className = 'tname';
    name.textContent = t.name;

    const desc = document.createElement('span');
    desc.className = 'tdesc';
    desc.textContent = t.description;

    row.append(check, badge, name, desc);
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'tflag missable-flag';
      flag.textContent = 'MISSABLE';
      row.append(flag);
    }
    if (t.hidden) {
      const flag = document.createElement('span');
      flag.className = 'tflag hidden-flag';
      flag.textContent = 'HIDDEN';
      row.append(flag);
    }
    if (t.verified === 'unknown') {
      const flag = document.createElement('span');
      flag.className = 'tflag unknown-flag';
      flag.textContent = 'UNKNOWN';
      row.append(flag);
    }
    if (t.counts) {
      const count = document.createElement('span');
      count.className = 'tcount';
      count.textContent = t.counts;
      row.append(count);
    }
    row.addEventListener('click', (event) => {
      if (event.target === check) return;
      onSelect(t);
    });
    listEl.append(row);
  }
}

/**
 * Render the selected trophy's full guide into #detail-pane:
 * official name, description and grade, numbered steps each with its
 * sources, the source list, verification status, missable warning and
 * the 100%-completion overlap note.
 */
export function renderDetail(detailEl, trophy, store, spoilerOn) {
  if (!trophy) {
    detailEl.innerHTML =
      '<h2>Pick a trophy</h2><p class="detail-desc">Select any trophy on ' +
      'the left to see its guide, steps and sources.</p>';
    return;
  }
  const earned = store.isEarned(trophy.id);
  const masked = spoilerOn === true && trophy.kind === 'story' && !earned;
  const shownName = masked ? SPOILER_PLACEHOLDER : trophy.name;
  const shownDesc = masked
    ? 'A story trophy. Earn it in-game to reveal its official description and guide.'
    : trophy.description;

  let html = '<div class="detail-head">';
  html += '<span class="badge grade-' + trophy.grade + '">' + gradeLabel(trophy.grade) + '</span>';
  html += '<h2 id="detail-name">' + escapeHtml(shownName) + '</h2>';
  if (trophy.missable) html += '<span class="tflag missable-flag">MISSABLE — only one in the game</span>';
  if (trophy.hidden) html += '<span class="tflag hidden-flag">HIDDEN</span>';
  html += '</div>';
  html += '<p class="detail-desc">' + escapeHtml(shownDesc) + '</p>';
  html += '<p class="detail-meta">Verified: <strong>' +
    escapeHtml(VERIFIED_LABELS[trophy.verified] || trophy.verified.toUpperCase()) +
    '</strong> · Sources: ' + escapeHtml(trophy.sources.join(' · ') || '—') +
    ' · 100% overlap: <strong>' + (trophy.overlap100 ? 'Yes' : 'No') + '</strong>' +
    (trophy.counts ? ' · Count: ' + escapeHtml(trophy.counts) : '') +
    ' · Earned: <strong>' + (earned ? 'Yes' : 'Not yet') + '</strong></p>';

  if (masked) {
    html += '<p class="warn">Spoiler-safe is on: this story trophy stays hidden until ' +
      'you mark it earned. Tick its checkbox when you earn it in-game.</p>';
    detailEl.innerHTML = html;
    return;
  }

  if (trophy.missable) {
    html += '<p class="warn">WARNING: the only potentially missable trophy. ' +
      'No mission replay, no New Game+ — a manual save is the only safety net.</p>';
  }
  html += '<h3>Guide — in our own words</h3>';
  if (trophy.guide) html += '<p>' + escapeHtml(trophy.guide) + '</p>';
  if (trophy.steps.length > 0) {
    html += '<ol class="steps">';
    for (const step of trophy.steps) {
      html += '<li>' + escapeHtml(step.text);
      for (const src of step.sources) {
        html += ' <span class="src">Source: ' + escapeHtml(src) + '</span>';
      }
      html += '</li>';
    }
    html += '</ol>';
  }
  html += '<h3>Sources</h3><ul class="srclist">';
  for (const src of trophy.sources) html += '<li>' + escapeHtml(src) + '</li>';
  html += '</ul>';
  detailEl.innerHTML = html;
}

/** Render the header progress bar + text, the ring and the per-grade bars. */
export function renderProgress(trophies, store, citedSteps) {
  const { earned, total } = store.totals();
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const bar = document.getElementById('progress-bar');
  if (bar) bar.setAttribute('aria-valuenow', String(earned));
  const text = document.getElementById('progress-text');
  if (text) text.textContent = earned + ' / ' + total + ' trophies — ' + pct + '% to Platinum';
  const ring = document.getElementById('progress-ring');
  if (ring) ring.textContent = pct + '%';
  const cited = document.getElementById('stat-cited');
  if (cited) cited.textContent = citedSteps + ' cited steps';

  const bars = document.querySelector('.grade-bars');
  if (bars) {
    const byGrade = store.byGrade(trophies);
    const order = ['platinum', 'gold', 'silver', 'bronze'];
    bars.innerHTML = '';
    for (const grade of order) {
      const g = byGrade[grade] || { earned: 0, total: 0 };
      const rowPct = g.total === 0 ? 0 : Math.round((g.earned / g.total) * 100);
      const row = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = grade.charAt(0).toUpperCase() + grade.slice(1);
      const barWrap = document.createElement('div');
      barWrap.className = 'bar';
      const barFill = document.createElement('span');
      barFill.style.width = rowPct + '%';
      barWrap.append(barFill);
      const count = document.createElement('b');
      count.textContent = g.earned + '/' + g.total;
      row.append(label, barWrap, count);
      bars.append(row);
    }
  }
}

/**
 * Render Next Up: the next unearned trophies in roadmap order, with the
 * game's only missable trophy first when it is still unearned.
 */
export function renderNextUp(nextUpEl, trophies, panels, store) {
  const byName = new Map(trophies.map((t) => [t.name, t]));
  const ordered = [];
  const seen = new Set();
  for (const stage of panels.roadmap) {
    for (const name of stage.trophies || []) {
      if (!seen.has(name) && byName.has(name)) {
        seen.add(name);
        ordered.push(byName.get(name));
      }
    }
  }
  for (const t of trophies) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      ordered.push(t);
    }
  }
  const upcoming = ordered.filter((t) => !store.isEarned(t.id));
  upcoming.sort((a, b) => (b.missable ? 1 : 0) - (a.missable ? 1 : 0));
  const next = upcoming.slice(0, 3);
  const list = nextUpEl.querySelector('ol');
  if (!list) return;
  list.innerHTML = '';
  if (next.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<strong>Platinum earned!</strong> — every trophy is checked off.';
    list.append(li);
    return;
  }
  for (const t of next) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t.name;
    li.append(strong);
    li.append(document.createTextNode(' — ' + (t.missable ? 'do it NOW (only missable). ' : '') + t.description));
    list.append(li);
  }
}

/** Render the 7-stage roadmap list from panels.json. */
export function renderRoadmap(roadmapListEl, panels) {
  roadmapListEl.innerHTML = '';
  for (const stage of panels.roadmap) {
    const li = document.createElement('li');
    const head = document.createElement('strong');
    head.textContent = 'Stage ' + stage.stage + ' — ' + stage.title + '.';
    li.append(head);
    const names = (stage.trophies || []).join(' · ');
    li.append(document.createTextNode(' ' + names));
    if (stage.note) {
      const note = document.createElement('p');
      note.className = 'detail-note';
      note.textContent = stage.note;
      li.append(note);
    }
    roadmapListEl.append(li);
  }
}

/**
 * Render the glitch panel from panels.json: the Apollo Aggregates money
 * glitch (DISPUTED), its numbered steps, who says it works and who says
 * it does not, and the safety warning.
 */
export function renderGlitch(glitchPanelEl, panels) {
  const g = panels.glitch;
  if (!g) return;
  let html = '<h3>' + escapeHtml(g.title) + ' — money glitch</h3>';
  html += '<p class="status disputed">STATUS: ' + escapeHtml(g.status) + '</p>';
  if (g.detail) html += '<p>' + escapeHtml(g.detail) + '</p>';
  if (Array.isArray(g.steps) && g.steps.length > 0) {
    html += '<ol class="steps">';
    for (const step of g.steps) html += '<li>' + escapeHtml(step) + '</li>';
    html += '</ol>';
  }
  html += '<p><strong>For:</strong> ' + escapeHtml((g.pro || []).join(', ')) +
    ' <strong>Against:</strong> ' + escapeHtml((g.contra || []).join(', ')) + '</p>';
  if (g.warning) html += '<p class="warn">' + escapeHtml(g.warning) + '</p>';
  glitchPanelEl.innerHTML = html;
}

/**
 * Render the easter-eggs list, filtered by kind ('all' | 'egg' | 'bug' |
 * 'oddity') and optionally by status. Each item shows its status and sources.
 */
export function renderEggs(eggsListEl, eggs, eggKind, eggStatus) {
  const items = eggs.items.filter((e) => {
    if (eggKind && eggKind !== 'all' && e.kind !== eggKind) return false;
    if (eggStatus && eggStatus !== 'all' && e.status !== eggStatus) return false;
    return true;
  });
  eggsListEl.innerHTML = '';
  if (items.length === 0) {
    eggsListEl.innerHTML = '<p class="view-intro">No items match this filter.</p>';
    return;
  }
  for (const item of items) {
    const article = document.createElement('article');
    article.className = 'egg';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const meta = document.createElement('p');
    meta.className = 'egg-meta';
    meta.textContent =
      item.kind.toUpperCase() + ' · ' + item.status.toUpperCase() +
      (item.sources.length > 0 ? ' · ' + item.sources.join(', ') : '');
    const text = document.createElement('p');
    text.textContent = item.text;
    article.append(title, meta, text);
    eggsListEl.append(article);
  }
}
