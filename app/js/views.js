// Leonida Platinum Atlas — view renderers (Round 7, written fresh).
// Every name/description that reaches the screen goes through the spoiler
// mask here, so no view can leak a story trophy name while the shield is on.
import { isEarned, countOf } from './store.js';
import { KIND_LABELS, gradeRank } from './filters.js';
import { sourceTitle } from './data.js';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isMasked(t, st) {
  return !!st.spoiler && t.kind === 'story' && !isEarned(st, t.name);
}

export function shownName(t, st) {
  return isMasked(t, st) ? 'Story trophy — spoiler hidden' : t.name;
}

export function shownDesc(t, st) {
  if (isMasked(t, st)) return 'Description hidden — the spoiler shield is on. Earn this trophy, or turn the shield off, to reveal it.';
  return t.description || '';
}

export function gradeBadge(t) {
  return '<span class="badge grade-' + esc(t.grade) + '">' + esc(t.grade.toUpperCase()) + '</span>';
}

export function srcChips(src, byCode) {
  if (!src || src.length === 0) return '<span class="src none">Source: —</span>';
  const codes = src.map(esc).join(', ');
  const title = byCode ? sourceTitle(src, byCode) : src.join(', ');
  return '<span class="src" title="' + esc(title) + '">Source: ' + codes + '</span>';
}

function overlapLabel(t) {
  if (t.overlap100 === 'auto') return 'Auto saat 100% — earned together with the Platinum';
  if (t.overlap100 === 'separate') return 'Terpisah dari 100% — needs its own run after the Platinum path';
  return 'Sebagian — partly counts toward 100%, partly separate';
}

function countLine(t, st) {
  if (!t.counts) return '';
  const have = countOf(st, t.name);
  const label = esc(t.counts.label || 'progress');
  return (
    '<div class="countbox" data-countbox="' + esc(t.name) + '">' +
    '<span class="count-label">' + label + ': <b>' + have + ' / ' + t.counts.total + '</b></span> ' +
    '<button type="button" data-count="-1" data-name="' + esc(t.name) + '" aria-label="Decrease">−</button>' +
    '<button type="button" data-count="1" data-name="' + esc(t.name) + '" aria-label="Increase">+</button>' +
    '<label>Set <input type="number" min="0" max="' + t.counts.total + '" value="' + have + '" data-count-input="' + esc(t.name) + '"></label>' +
    '</div>'
  );
}

export function renderAudit(el, stats) {
  el.innerHTML =
    '<span class="audit-item"><b>AUDIT</b> ' + stats.cited + '/' + stats.total + ' claims cited</span>' +
    '<span class="audit-item">' + stats.twoPlus + ' on 2+ sites</span>' +
    '<span class="audit-item">' + stats.sources + ' sources</span>' +
    '<span class="audit-item">' + stats.pages + ' pages</span>' +
    '<span class="audit-item">' + stats.confirmed + '/' + stats.trophies + ' confirmed · ' + stats.unknown + ' unknown (Ten Pin)</span>';
}

export function renderList(el, trophies, st) {
  if (trophies.length === 0) {
    el.innerHTML = '<li class="empty">No trophies match these filters.</li>';
    return;
  }
  el.innerHTML = trophies
    .map((t) => {
      const earned = isEarned(st, t.name);
      const sel = st.selected === t.name ? ' selected' : '';
      const tags = [];
      if (t.hidden) tags.push('<span class="tag">HIDDEN</span>');
      if (t.missable) tags.push('<span class="tag miss">MISSABLE</span>');
      if (t.verified === 'unknown') tags.push('<span class="tag unk">UNKNOWN</span>');
      const counts = t.counts ? '<span class="mini-count">' + countOf(st, t.name) + '/' + t.counts.total + '</span>' : '';
      return (
        '<li><button type="button" class="trophy-row' + sel + (earned ? ' earned' : '') + '" data-select="' + esc(t.name) + '">' +
        '<span class="check">' + (earned ? '✓' : '') + '</span>' +
        '<span class="row-main"><span class="row-name">' + esc(shownName(t, st)) + '</span>' +
        '<span class="row-sub">' + gradeBadge(t) + ' ' + tags.join(' ') + ' <span class="kind">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span></span></span>' +
        counts +
        '</button></li>'
      );
    })
    .join('');
}

export function renderDetail(el, t, data, st) {
  if (!t) {
    el.innerHTML = '<p class="empty">Pick a trophy on the left to see its full guide.</p>';
    return;
  }
  const earned = isEarned(st, t.name);
  const masked = isMasked(t, st);
  const steps = (t.steps || [])
    .map(
      (s, i) =>
        '<li><span class="step-num">' + (i + 1) + '</span><span class="step-text">' + esc(s.text) + '</span> ' +
        srcChips(s.src, data.byCode) + '</li>',
    )
    .join('');
  const sources = (t.steps || [])
    .flatMap((s) => s.src || [])
    .filter((v, i, a) => a.indexOf(v) === i);
  const sourceList = sources.length
    ? '<h3>Sources for this trophy</h3><ul class="srclist">' +
      sources
        .map((c) => {
          const s = data.byCode.get(c);
          if (!s) return '<li>' + esc(c) + '</li>';
          const pages = (s.pages || []).map((p) => esc(p.title)).join(' · ');
          return '<li><b>' + esc(s.code) + '</b> — ' + esc(s.name) + (pages ? ' <span class="muted">(' + pages + ')</span>' : '') + '</li>';
        })
        .join('') +
      '</ul>'
    : '';
  const missableBox = t.missable_box
    ? '<div class="missable-box"><b>⚠ MISSABLE</b><p>' + esc(t.missable_box) + '</p>' +
      (t.points_of_no_return ? '<p><b>Point of no return:</b> ' + esc(t.points_of_no_return) + '</p>' : '') + '</div>'
    : t.points_of_no_return
      ? '<div class="missable-box"><p><b>Point of no return:</b> ' + esc(t.points_of_no_return) + '</p></div>'
      : '';
  el.innerHTML =
    '<div class="detail-head"><h2>' + esc(shownName(t, st)) + '</h2>' +
    '<div class="detail-meta">' + gradeBadge(t) + ' ' +
    (t.hidden ? '<span class="tag">HIDDEN</span>' : '') + ' ' +
    (t.missable ? '<span class="tag miss">MISSABLE</span>' : '') + ' ' +
    '<span class="kind">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span> ' +
    '<span class="verified v-' + esc(t.verified) + '">' + esc(t.verified) + '</span></div></div>' +
    '<p class="desc">' + esc(shownDesc(t, st)) + '</p>' +
    '<p class="overlap">' + esc(overlapLabel(t)) + (t.gamerscore ? ' · ' + t.gamerscore + ' Gamerscore' : '') + (t.rarity ? ' · rarity ' + esc(t.rarity) : '') + '</p>' +
    '<div class="detail-actions"><button type="button" data-earn="' + esc(t.name) + '">' + (earned ? '✓ Earned — click to undo' : 'Mark earned') + '</button></div>' +
    countLine(t, st) +
    missableBox +
    (masked
      ? '<p class="muted">Steps hidden by the spoiler shield — earn this trophy or turn the shield off to reveal the guide.</p>'
      : '<p class="guide">' + esc(t.guide || '') + '</p><h3>Steps — every step cited</h3><ol class="steps">' + steps + '</ol>') +
    (masked ? '' : sourceList);
}

export function renderProgress(el, trophies, st) {
  const earned = trophies.filter((t) => isEarned(st, t.name)).length;
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  const perGrade = {};
  for (const t of trophies) {
    perGrade[t.grade] = perGrade[t.grade] || { got: 0, all: 0 };
    perGrade[t.grade].all++;
    if (isEarned(st, t.name)) perGrade[t.grade].got++;
  }
  const rows = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => {
      const p = perGrade[g] || { got: 0, all: 0 };
      return '<div class="grade-row"><span class="badge grade-' + g + '">' + g.toUpperCase() + '</span><span>' + p.got + ' / ' + p.all + '</span><span class="bar"><i style="width:' + (p.all ? Math.round((p.got / p.all) * 100) : 0) + '%"></i></span></div>';
    })
    .join('');
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (circ * pct) / 100;
  el.innerHTML =
    '<h2>Platinum progress</h2>' +
    '<div class="ring-wrap"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Platinum progress ' + pct + ' percent">' +
    '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#3b2a63" stroke-width="10"/>' +
    '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#ff7a3d" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
    '<text x="60" y="56" text-anchor="middle" class="ring-num">' + pct + '%</text>' +
    '<text x="60" y="74" text-anchor="middle" class="ring-sub">' + earned + '/' + total + '</text></svg>' +
    '<p class="muted">' + (total - earned) + ' trophies left to the Platinum. Missables first — they cannot be replayed in the same save.</p></div>' +
    rows;
}

export function renderRoadmapMini(el, panels, st, data) {
  const stages = (panels.roadmap || []).map((s) => {
    const names = (s.trophies || []).map((n) => {
      const t = data.byName.get(n);
      return t ? shownName(t, st) : n;
    });
    return '<li><b>Stage ' + s.stage + ' — ' + esc(s.title) + '</b> <span class="muted">(' + esc(s.time || '') + ')</span><br><span class="muted">' + names.map(esc).join(', ') + '</span></li>';
  });
  el.innerHTML = '<h2>Roadmap — 7 stages</h2><ol class="mini-roadmap">' + stages.join('') + '</ol>';
}

export function renderRoadmap(el, panels, data, st) {
  const stages = (panels.roadmap || [])
    .map((s) => {
      const names = (s.trophies || []).map((n) => {
        const t = data.byName.get(n);
        return '<li>' + esc(t ? shownName(t, st) : n) + '</li>';
      });
      const claims = (s.claims || [])
        .map((c) => '<li>' + esc(c.text) + ' ' + srcChips(c.src, data.byCode) + '</li>')
        .join('');
      return (
        '<section class="stage"><h3>Stage ' + s.stage + ' — ' + esc(s.title) + ' <span class="muted">(' + esc(s.time || '') + ')</span></h3>' +
        '<ul class="stage-trophies">' + names.join('') + '</ul>' +
        (claims ? '<ul class="claims">' + claims + '</ul>' : '') + '</section>'
      );
    })
    .join('');
  el.innerHTML = '<h2>Roadmap — 7 stages to the Platinum</h2><p class="muted">Play in stage order. Every stage claim carries its sources.</p>' + stages;
}

export function renderMissables(el, panels, data, st) {
  const grid = ((panels.missables || {}).grid || [])
    .map((row) => {
      const items = (row.items || [])
        .map((it) => {
          const t = data.byName.get(it.trophy);
          const name = t ? shownName(t, st) : it.trophy;
          return (
            '<article class="miss-item"><h4>' + esc(name) + ' <span class="risk risk-' + esc(it.risk || 'high') + '">' + esc((it.risk || 'high').toUpperCase()) + ' RISK</span></h4>' +
            '<p>' + esc(it.text) + '</p>' + srcChips(it.src, data.byCode) + '</article>'
          );
        })
        .join('');
      return '<section class="chapter"><h3>' + esc(row.chapter) + '</h3><div class="miss-grid">' + items + '</div></section>';
    })
    .join('');
  const save = ((panels.missables || {}).save_strategy || [])
    .map((c) => '<li>' + esc(c.text) + ' ' + srcChips(c.src, data.byCode) + '</li>')
    .join('');
  el.innerHTML =
    '<h2>Missables — what you can lose forever</h2>' +
    '<p class="muted">Grid per chapter, in story order. Check the risk before every point of no return.</p>' +
    grid +
    (save ? '<h3>Save strategy</h3><ul class="claims">' + save + '</ul>' : '');
}

export function renderGlitch(el, panels, data) {
  const g = panels.glitch || {};
  const claim = (c) => '<li>' + esc(c.text) + ' ' + srcChips(c.src, data.byCode) + '</li>';
  const claims = (g.claims || []).map(claim).join('');
  const pro = (g.pro || []).map(claim).join('');
  const con = (g.con || []).map(claim).join('');
  const launch = (panels.launch_status || []).map(claim).join('');
  const farming = (panels.farming || []).map(claim).join('');
  const warnings = (panels.warnings || []).map(claim).join('');
  el.innerHTML =
    '<h2>Glitch &amp; farming</h2>' +
    '<p><span class="tag unk">APOLLO GLITCH: ' + esc((g.status || 'reported').toUpperCase()) + '</span> <span class="muted">— debated, not confirmed. Read both sides before you try it.</span></p>' +
    (claims ? '<ul class="claims">' + claims + '</ul>' : '') +
    '<div class="procon"><section><h3>Pro — it works</h3><ul class="claims">' + (pro || '<li>No pro claims recorded.</li>') + '</ul></section>' +
    '<section><h3>Con — it does not / it risks your save</h3><ul class="claims">' + (con || '<li>No con claims recorded.</li>') + '</ul></section></div>' +
    (g.warning ? '<div class="warn-box"><b>⚠ ' + esc(g.warning) + '</b></div>' : '') +
    (farming ? '<h3>Legal farming tricks</h3><ul class="claims">' + farming + '</ul>' : '') +
    (warnings ? '<h3>Warnings</h3><ul class="claims">' + warnings + '</ul>' : '') +
    (launch ? '<h3>Launch status</h3><ul class="claims">' + launch + '</ul>' : '');
}

export function renderDisputes(el, panels, data) {
  const list = (panels.disputes || [])
    .map((d) => {
      const claim = (c) => '<li>' + esc(c.text) + ' ' + srcChips(c.src, data.byCode) + '</li>';
      const pro = (d.pro || []).map(claim).join('');
      const con = (d.con || []).map(claim).join('');
      return (
        '<article class="dispute"><h3>' + esc(d.topic) + ' <span class="tag">' + esc((d.status || 'open').toUpperCase()) + '</span></h3>' +
        '<div class="procon"><section><h4>Pro</h4><ul class="claims">' + (pro || '<li>—</li>') + '</ul></section>' +
        '<section><h4>Con</h4><ul class="claims">' + (con || '<li>—</li>') + '</ul></section></div></article>'
      );
    })
    .join('');
  el.innerHTML = '<h2>Disputes — where the guides disagree</h2><p class="muted">' + (panels.disputes || []).length + ' open disagreements, argued claim by claim with sources on both sides.</p>' + list;
}

export function renderEggs(el, eggs) {
  const rows = eggs
    .map(
      (e) =>
        '<tr><td>' + esc(e.title) + '</td><td>' + esc(e.category) + '</td><td><span class="tag">' + esc((e.status || 'reported').toUpperCase()) + '</span></td><td>' + esc(e.text) + ' ' + srcChips(e.src, null) + '</td></tr>',
    )
    .join('');
  el.innerHTML =
    '<h2>Easter eggs, bugs &amp; oddities — ' + eggs.length + ' items</h2>' +
    '<p class="muted">Status per item: confirmed, reported, or disputed. Every item cites its source.</p>' +
    '<table class="eggs"><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>What it is</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

export function renderNextUp(el, trophies, st) {
  const sorted = [...trophies]
    .filter((t) => !isEarned(st, t.name))
    .sort((a, b) => (b.missable - a.missable) || (a.roadmap_stage - b.roadmap_stage) || (gradeRank(a.grade) - gradeRank(b.grade)));
  const top = sorted.slice(0, 5);
  el.innerHTML =
    '<h2>Next up</h2>' +
    (top.length === 0
      ? '<p>Platinum earned — every trophy is checked. Leonida is yours.</p>'
      : '<ol>' +
        top
          .map(
            (t) =>
              '<li><button type="button" data-select="' + esc(t.name) + '">' + esc(shownName(t, st)) + '</button> ' +
              gradeBadge(t) + (t.missable ? ' <span class="tag miss">MISSABLE</span>' : '') + '</li>',
          )
          .join('') + '</ol>');
}

export function renderSources(el, data) {
  el.innerHTML = data.sources
    .map((s) => '<li><b>' + esc(s.code) + '</b> — ' + esc(s.name) + ' <span class="muted">' + esc(s.url || '') + ' · ' + (s.pages || []).length + ' pages</span></li>')
    .join('');
}
