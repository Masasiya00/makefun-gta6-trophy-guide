// View renderers for Leonida Platinum Atlas. Each function returns an HTML
// string; main.js puts it in #view and binds the events. All text that comes
// from the data files goes through esc() so a stray quote can never break
// the markup.
import { displayName, displayDescription, spoilerMasked } from './data.js';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gradeBadge(grade) {
  return '<span class="grade ' + esc(grade) + '">' + esc(grade) + '</span>';
}

function verifiedBadge(v) {
  if (v === 'confirmed') return '<span class="badge confirmed">Confirmed</span>';
  if (v === 'reported') return '<span class="badge reported">Reported</span>';
  return '<span class="badge unknown">Unknown</span>';
}

function statusBadge(s) {
  if (s === 'confirmed') return '<span class="badge confirmed">Confirmed</span>';
  if (s === 'reported') return '<span class="badge reported">Reported</span>';
  return '<span class="badge disputed">Disputed</span>';
}

function overlapBadge(o) {
  if (o === 'auto') return '<span class="badge auto">Auto with 100%</span>';
  if (o === 'partial') return '<span class="badge partial">Partly with 100%</span>';
  return '<span class="badge separate">Separate from 100%</span>';
}

function sourceLinks(sources) {
  if (!sources || sources.length === 0) return '<p class="src">Source: not yet verified in-game.</p>';
  const links = sources.map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>').join('');
  return '<p class="src">Sources: ' + links + '</p>';
}

function countInput(t, state) {
  if (!t.count) return '';
  const cur = state.counts[t.name] || 0;
  return '<div class="countbox"><label>Your count: <input type="number" min="0" max="' + t.count.target + '" value="' + cur + '" data-count-for="' + esc(t.name) + '"></label><span>/ ' + t.count.target + ' ' + esc(t.count.label) + '</span></div>';
}

// The open trophy's detail pane. When the spoiler guard masks it, the steps
// and the sources are hidden too — showing them would spoil the mission.
export function trophyDetail(t, state) {
  const earned = new Set(state.earned);
  const masked = spoilerMasked(t, state.spoiler, earned);
  const name = displayName(t, state.spoiler, earned);
  const desc = displayDescription(t, state.spoiler, earned);
  let html = '<section class="detail" id="detail"><h3>' + esc(name) + ' ' + gradeBadge(t.grade) + '</h3>';
  html += '<p>' + esc(desc) + '</p><p>';
  if (t.hidden === true) html += '<span class="badge hidden">Hidden trophy</span>';
  if (t.hidden === 'unverified') html += '<span class="badge hidden">Hidden? — unverified</span>';
  if (t.missable) html += '<span class="badge missable">Missable</span>';
  html += verifiedBadge(t.verified) + overlapBadge(t.overlap100) + '</p>';
  if (masked) {
    html += '<p class="muted">Spoiler guard is on: the guide, steps and sources for this story trophy stay hidden until you earn it. Turn spoilers off in the Checklist controls to read it now.</p>';
  } else {
    html += '<p>' + esc(t.guide) + '</p>';
    if (t.steps && t.steps.length) {
      html += '<ol>' + t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    }
    html += countInput(t, state);
    if (t.note) html += '<div class="panel"><h3>Disagreement — both sides</h3><p>' + esc(t.note) + '</p></div>';
    html += sourceLinks(t.sources);
  }
  const note = state.notes[t.name] || '';
  html += '<p><label>Your note:<br><textarea rows="2" style="width:100%" data-note-for="' + esc(t.name) + '">' + esc(note) + '</textarea></label></p>';
  html += '<p><button type="button" class="btn ghost" data-action="close-detail">Close detail</button></p></section>';
  return html;
}

export function checklistView(data, state, ui, filtered) {
  const earned = new Set(state.earned);
  let html = '<h2>Trophy checklist</h2>';
  html += '<p class="muted">55 official trophies · 1 platinum · 2 gold · 6 silver · 46 bronze · 28 hidden · <strong>0 online trophies</strong> — no multiplayer needed for the platinum. Click a row to open its guide.</p>';
  html += '<div class="controls"><input type="search" id="q" placeholder="Search trophies…" value="' + esc(ui.query) + '">'
    + '<label>Grade <select id="gradeSel"><option value="all">All</option>'
    + ['platinum', 'gold', 'silver', 'bronze'].map((g) => '<option value="' + g + '"' + (ui.grade === g ? ' selected' : '') + '>' + g + '</option>').join('')
    + '</select></label></div>';
  const chips = [['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['crime', 'Crime'], ['stranger', 'Strangers'], ['hidden', 'Hidden'], ['earned', 'Earned'], ['remaining', 'Remaining'], ['online', 'Online (0)']];
  html += '<div class="controls">' + chips.map((c) => '<button type="button" class="chip' + (ui.kind === c[0] ? ' on' : '') + '" data-kind="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
  html += '<div class="toggles"><label><input type="checkbox" id="spoilerToggle"' + (state.spoiler ? ' checked' : '') + '> Spoiler guard (hide un-earned story trophies)</label>'
    + '<span class="muted">Showing ' + filtered.length + ' of 55</span></div>';
  if (ui.detail) {
    const t = data.trophies.find((x) => x.name === ui.detail);
    if (t) html += trophyDetail(t, state);
  }
  html += '<table><thead><tr><th>Earned</th><th>Trophy</th><th>Grade</th><th>Official description</th><th>Guide preview</th></tr></thead><tbody>';
  for (const t of filtered) {
    const isEarned = earned.has(t.name);
    const masked = spoilerMasked(t, state.spoiler, earned);
    const name = displayName(t, state.spoiler, earned);
    const desc = displayDescription(t, state.spoiler, earned);
    const preview = masked ? 'Hidden until earned.' : t.guide;
    html += '<tr class="clickable' + (isEarned ? ' earned' : '') + '" data-open="' + esc(t.name) + '">'
      + '<td><input type="checkbox" data-toggle="' + esc(t.name) + '"' + (isEarned ? ' checked' : '') + ' aria-label="Mark ' + esc(name) + ' earned"></td>'
      + '<td><strong>' + esc(name) + '</strong>' + (t.missable ? ' <span class="badge missable">Missable</span>' : '') + (t.hidden === true ? ' <span class="badge hidden">Hidden</span>' : '') + (t.hidden === 'unverified' ? ' <span class="badge hidden">Hidden?</span>' : '') + '</td>'
      + '<td>' + gradeBadge(t.grade) + '</td>'
      + '<td>' + esc(desc) + '</td>'
      + '<td>' + esc(preview) + '</td></tr>';
  }
  html += '</tbody></table>';
  return html;
}

export function roadmapView(panels) {
  let html = '<h2>Roadmap to the platinum</h2>';
  html += '<p class="muted">One playthrough is enough — no mission replay, no New Game+. Story takes roughly 60–80 hours; the full platinum is commonly estimated at 200–300 hours depending on how much cleanup you leave for free-roam.</p>';
  for (const stage of panels.roadmap) {
    html += '<section class="panel"><h3>Stage ' + stage.stage + ' — ' + esc(stage.title) + '</h3><p>' + esc(stage.text) + '</p><p class="muted">Trophies: ' + stage.trophies.map(esc).join(' · ') + '</p><p class="muted">Estimate: ' + esc(stage.time) + '</p></section>';
  }
  html += '<section class="panel"><h3>What the 100% checklist covers</h3><p>' + esc(panels.overlap100.summary) + '</p></section>';
  return html;
}

export function missablesView(panels) {
  let html = '<h2>Missables — one trophy can be missed</h2>';
  html += '<div class="warn"><h3>Positive Mental Attitude — the only missable trophy</h3><p>Meditate at every spot across Leonida (18 spots). The first meditation happens on the balcony of Jason\'s house in Chapter 1: after the mission "Down to Earth", talk to Lucia in the kitchen in the morning, follow her to the balcony and accept. It can be missed once Chapter 1 ends — and it is not yet confirmed whether that first meditation is required for the trophy (its counter rises but it is not marked as a Meditation Spot). PowerPyx earned the trophy after doing it, so do it anyway. Keep a manual save from before "Down to Earth" as insurance.</p></div>';
  html += '<table><thead><tr><th>Chapter</th><th>Missable risk</th><th>Notes</th></tr></thead><tbody>';
  for (const row of panels.missable_grid) {
    html += '<tr><td>' + esc(row.chapter) + '</td><td>' + esc(row.risk) + '</td><td>' + esc(row.notes) + '</td></tr>';
  }
  html += '</tbody></table>';
  html += '<section class="panel"><h3>Save strategy</h3><p>' + esc(panels.save_strategy.text) + '</p><ul>' + panels.save_strategy.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></section>';
  html += '<section class="panel"><h3>Warnings</h3><ul>' + panels.warnings.map((w) => '<li><strong>' + esc(w.title) + ':</strong> ' + esc(w.text) + '</li>').join('') + '</ul></section>';
  return html;
}

export function eggsView(eggs, ui, filtered) {
  const counts = { 'easter-egg': 0, bug: 0, oddity: 0 };
  for (const e of eggs) counts[e.category] = (counts[e.category] || 0) + 1;
  const conf = eggs.filter((e) => e.status === 'confirmed').length;
  const rep = eggs.filter((e) => e.status === 'reported').length;
  const dis = eggs.filter((e) => e.status === 'disputed').length;
  let html = '<h2>Easter Eggs, Bugs &amp; Hal Aneh</h2>';
  html += '<p class="muted">86 items researched 21 Nov 2026, two days after launch: ' + counts['easter-egg'] + ' easter eggs, ' + counts.bug + ' bugs, ' + counts.oddity + ' oddities. ' + conf + ' confirmed · ' + rep + ' reported · ' + dis + ' disputed. Nothing here is confirmed by Rockstar. "Viral" is not "verified" — disputed items are shown with their caveats, never as fact.</p>';
  html += '<div class="controls"><input type="search" id="eggQ" placeholder="Search easter eggs, bugs, oddities…" value="' + esc(ui.eggQuery) + '"></div>';
  const cats = [['all', 'All'], ['easter-egg', 'Easter eggs'], ['bug', 'Bugs'], ['oddity', 'Hal aneh']];
  html += '<div class="controls">' + cats.map((c) => '<button type="button" class="chip' + (ui.eggCategory === c[0] ? ' on' : '') + '" data-eggcat="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
  const stats = [['all', 'All statuses'], ['confirmed', 'Confirmed'], ['reported', 'Reported'], ['disputed', 'Disputed']];
  html += '<div class="controls">' + stats.map((c) => '<button type="button" class="chip' + (ui.eggStatus === c[0] ? ' on' : '') + '" data-eggstatus="' + c[0] + '">' + c[1] + '</button>').join('') + '<span class="muted">Showing ' + filtered.length + ' of ' + eggs.length + '</span></div>';
  for (const e of filtered) {
    html += '<article class="egg"><h3>' + esc(e.title) + ' ' + statusBadge(e.status) + '</h3>'
      + '<p class="loc">' + esc(e.location) + '</p><p>' + esc(e.description) + '</p>' + sourceLinks(e.sources) + '</article>';
  }
  return html;
}

export function glitchView(panels) {
  const g = panels.glitch_farming;
  let html = '<h2>Glitch &amp; Farming</h2>';
  html += '<div class="warn"><h3>Apollo Aggregates money glitch — REPORTED, disputed</h3><p>' + esc(g.apollo.text) + '</p><ol>' + g.apollo.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol><p><strong>2 sources say it works</strong> (KeeNgamer, allblogthings, 20 Nov) vs <strong>2 say no working money glitch exists yet</strong> (afleurdenet, vanotherlevel, 18–20 Nov). Treat it as unproven and patchable at any time. Never enter PSN, Xbox or Rockstar credentials into any "cash generator" site — those are phishing.</p>' + sourceLinks(g.apollo.sources) + '</div>';
  html += '<section class="panel"><h3>Legit money — the reliable route</h3><p>' + esc(g.legit.text) + '</p><ul>' + g.legit.items.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></section>';
  html += '<section class="panel"><h3>Legal farming tricks (not glitches)</h3><ul>' + g.tricks.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></section>';
  html += '<section class="panel"><h3>Disagreements</h3>';
  for (const d of panels.disagreements) {
    html += '<p><strong>' + esc(d.title) + ':</strong> ' + esc(d.text) + '</p>';
  }
  html += '</section>';
  return html;
}

export function launchView(panels) {
  const l = panels.launch_status;
  let html = '<h2>Launch status — 21 Nov 2026</h2>';
  html += '<div class="cards">';
  for (const item of l.items) {
    html += '<div class="card"><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></div>';
  }
  html += '</div>';
  html += '<section class="panel"><h3>Sources index</h3><ul>' + panels.sources_index.map((s) => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a> — ' + esc(s.used_for) + '</li>').join('') + '</ul></section>';
  return html;
}

export function trackerView(data, state, next) {
  const earned = new Set(state.earned);
  const total = data.trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  const allSteps = data.trophies.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const backed = data.trophies.filter((t) => t.sources && t.sources.length >= 2)
    .reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const multiSource = data.trophies.filter((t) => t.sources && t.sources.length >= 2).length;
  let html = '<h2>Tracker &amp; Next Up</h2>';
  html += '<div class="cards"><div class="card"><div class="num">' + earned.size + ' / ' + total + '</div><p>Trophies earned (' + pct + '% to platinum)</p></div>'
    + '<div class="card"><div class="num">' + allSteps + '</div><p>Cited guide steps across all trophies</p></div>'
    + '<div class="card"><div class="num">' + backed + '</div><p>Steps backed by 2+ sources (' + multiSource + ' of 55 trophies cite 2+ sources)</p></div></div>';
  if (next) {
    const masked = spoilerMasked(next, state.spoiler, earned);
    const name = masked ? 'Hidden story trophy' : next.name;
    html += '<section class="nextup"><h3>Next Up</h3><p><strong>' + esc(name) + '</strong> — ' + (masked ? 'a hidden story trophy. Earn it to reveal the guide.' : esc(next.guide)) + '</p>'
      + (next.count ? '<p>Progress: ' + (state.counts[next.name] || 0) + ' / ' + next.count.target + ' ' + esc(next.count.label) + '</p>' : '')
      + '<p><button type="button" class="btn" data-action="open-next" data-name="' + esc(next.name) + '">Open its guide</button></p></section>';
  } else {
    html += '<section class="nextup"><h3>Next Up</h3><p>Platinum earned — Leonida Legend. Congratulations!</p></section>';
  }
  html += '<section class="panel"><h3>Save &amp; share your progress</h3><p>Progress lives in this browser (localStorage). Export a JSON backup, or import one from another device.</p>'
    + '<p><button type="button" class="btn" data-action="export">Export progress (JSON)</button> '
    + '<label class="btn ghost" style="display:inline-block">Import progress <input id="importFile" type="file" accept="application/json" style="display:none"></label> '
    + '<button type="button" class="btn ghost" data-action="reset">Reset progress</button></p></section>';
  html += '<section class="panel"><h3>Counted trophies — your numbers</h3><table><thead><tr><th>Trophy</th><th>Target</th><th>Yours</th></tr></thead><tbody>';
  for (const t of data.trophies.filter((x) => x.count)) {
    html += '<tr><td>' + esc(displayName(t, state.spoiler, earned)) + '</td><td>' + t.count.target + ' ' + esc(t.count.label) + '</td><td>' + (state.counts[t.name] || 0) + '</td></tr>';
  }
  html += '</tbody></table></section>';
  return html;
}
