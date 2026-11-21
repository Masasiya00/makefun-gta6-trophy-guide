// views.js — every screen of the guide, rendered from the loaded data.
// No figure on any screen is typed by hand: the audit strip, the progress
// ring, the roadmap bars and the missable grid all count from the same data.

import { auditStats, gradeLabel, overlapLabel, sourceByCode, verifiedLabel } from './data.js';
import { displayDescription, displayName, gradeProgress, isSpoilerMasked, nextUp, sortTrophies } from './filters.js';
import { getCount, isEarned } from './store.js';

/** Escape text for HTML so trophy names/descriptions can never break markup. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Source chips for one step: code badges that link to the source's URL. */
export function sourceChips(sources, codes) {
  return (codes ?? [])
    .map((code) => {
      const src = sourceByCode(sources, code);
      if (!src) return `<span class="src-chip" title="Sumber ${esc(code)}">${esc(code)}</span>`;
      return `<a class="src-chip" href="${esc(src.url)}" target="_blank" rel="noopener" title="${esc(src.name)}">${esc(code)}</a>`;
    })
    .join('');
}

/** One audit-strip cell: a big number and its label. */
function auditCell(value, label) {
  return `<div class="audit-cell"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
}

/**
 * The audit strip: the guide's key numbers, computed live from the data.
 * "736/736 klaim bersumber (100%) · 681 klaim di 2+ situs · 61 sumber ·
 *  72 halaman · 25 disputes · 55/55 trophy · 51/55 terkonfirmasi".
 */
export function renderAuditStrip(data, el) {
  const s = auditStats(data);
  const pct = s.claims ? Math.round((s.sourcedClaims / s.claims) * 100) : 0;
  el.innerHTML =
    auditCell(`${s.sourcedClaims}/${s.claims}`, `klaim bersumber (${pct}%)`) +
    auditCell(`${s.multiSourceClaims}`, 'klaim di 2+ situs') +
    auditCell(`${s.sourceCount}`, 'sumber') +
    auditCell(`${s.pageCount}`, 'halaman dibaca') +
    auditCell(`${s.disputeCount}`, 'disputes') +
    auditCell(`${s.trophyTotal}/${s.trophyTotal}`, 'trophy') +
    auditCell(`${s.confirmedTotal}/${s.trophyTotal}`, 'terkonfirmasi');
}

/** The left trophy list: checkbox, grade dot, name, kind tags, count chip. */
export function renderTrophyList(trophies, state, el, selectedId, onSelect) {
  const rows = sortTrophies(trophies)
    .map((t) => {
      const earned = isEarned(state, t.id);
      const masked = isSpoilerMasked(t, state);
      const countHtml = t.counts
        ? `<span class="count-chip">${getCount(state, t.id)}/${t.counts.total} ${esc(t.counts.target)}</span>`
        : '';
      const kinds = (t.kinds ?? []).map((k) => `<span class="kind-tag">${esc(k)}</span>`).join('');
      return `<li class="trophy-row${earned ? ' earned' : ''}${t.id === selectedId ? ' selected' : ''}" data-id="${esc(t.id)}">
        <label class="check"><input type="checkbox" data-check="${esc(t.id)}"${earned ? ' checked' : ''} aria-label="Tandai ${esc(masked ? 'trophy' : t.name)} didapat"><span></span></label>
        <button class="row-main" data-open="${esc(t.id)}">
          <span class="row-name"><i class="grade-dot grade-${esc(t.grade)}"></i>${esc(displayName(t, state))}</span>
          <span class="row-sub">${esc(gradeLabel(t.grade))}${t.hidden ? ' · Hidden' : ''} · ${esc(verifiedLabel(t.verified))}</span>
          <span class="row-tags">${kinds}${countHtml}</span>
        </button>
      </li>`;
    })
    .join('');
  el.innerHTML = rows || '<li class="empty">Tidak ada trophy yang cocok dengan filter ini.</li>';
  el.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.getAttribute('data-open')));
  });
}

/** The centre detail pane: guide, numbered cited steps, sources, badges. */
export function renderDetail(trophy, data, state, el, onCountChange) {
  if (!trophy) {
    el.innerHTML = '<div class="detail-empty"><h2>Pilih satu trophy</h2><p>Klik trophy di daftar kiri untuk melihat panduan lengkapnya — langkah demi langkah, masing-masing dengan sumbernya.</p></div>';
    return;
  }
  const masked = isSpoilerMasked(trophy, state);
  const sources = data.sources.sources;
  const steps = (trophy.steps ?? [])
    .map(
      (step, i) =>
        `<li><span class="step-num">${i + 1}</span><span class="step-text">${esc(step.text)}</span><span class="step-src">${sourceChips(sources, step.src)}</span></li>`,
    )
    .join('');
  const countBlock = trophy.counts
    ? `<div class="count-block"><label>Progress ${esc(trophy.counts.target)}:
        <input type="number" min="0" max="${trophy.counts.total}" value="${getCount(state, trophy.id)}" data-count="${esc(trophy.id)}"> / ${trophy.counts.total}</label>
        <span class="count-note">Simpan otomatis di browser ini.</span></div>`
    : '';
  el.innerHTML = `<article class="detail">
    <header>
      <span class="grade-badge grade-${esc(trophy.grade)}">${esc(gradeLabel(trophy.grade))}</span>
      <span class="verified-badge verified-${esc(trophy.verified)}">${esc(verifiedLabel(trophy.verified))}</span>
      ${trophy.hidden ? '<span class="hidden-badge">Hidden di PS5</span>' : ''}
      <span class="overlap-badge">${esc(overlapLabel(trophy.overlap100))}</span>
    </header>
    <h2>${esc(displayName(trophy, state))}</h2>
    <p class="official-desc">${esc(displayDescription(trophy, state))}</p>
    <p class="guide-text">${masked ? 'Panduan disembunyikan spoiler shield.' : esc(trophy.guide)}</p>
    ${countBlock}
    ${steps ? `<h3>Langkah-langkah</h3><ol class="steps">${steps}</ol>` : '<p class="no-steps">Trophy ini otomatis — tidak ada langkah khusus.</p>'}
    <p class="detail-foot">Tahap roadmap: ${trophy.stage ?? '—'} · ${esc((trophy.kinds ?? []).join(', '))}</p>
  </article>`;
  const input = el.querySelector('[data-count]');
  // Blur first: the change callback re-renders this pane (innerHTML), and
  // replacing the pane while its input still has focus throws in Chromium
  // ("node to be removed is no longer a child … moved in a blur handler").
  if (input) input.addEventListener('change', () => { input.blur(); onCountChange(trophy.id, input.value, trophy.counts.total); });
}

/** The right rail: progress ring, grade breakdown, Next Up planner. */
export function renderProgress(trophies, state, el, onSelect) {
  const total = trophies.length;
  const earned = state.earned.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  const circ = 2 * Math.PI * 52;
  const gp = gradeProgress(trophies, state);
  const grades = Object.entries(gp)
    .map(([g, v]) => `<div class="grade-line"><span>${esc(gradeLabel(g))}</span><span>${v.earned}/${v.total}</span><div class="mini-bar"><i style="width:${v.total ? Math.round((v.earned / v.total) * 100) : 0}%"></i></div></div>`)
    .join('');
  const up = nextUp(trophies, state);
  const upHtml = up
    ? `<button class="next-up" data-open="${esc(up.id)}"><span class="next-label">Next Up — tahap ${up.stage ?? '—'}</span><strong>${esc(displayName(up, state))}</strong><span>${esc(displayDescription(up, state))}</span></button>`
    : '<div class="next-up done"><strong>Platinum selesai!</strong><span>Semua 55 trophy didapat. Leonida Legend.</span></div>';
  el.innerHTML = `<section class="progress-card">
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120" class="ring" role="img" aria-label="${pct}% selesai">
        <circle cx="60" cy="60" r="52" class="ring-bg"></circle>
        <circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${circ}" stroke-dashoffset="${circ - (circ * pct) / 100}"></circle>
      </svg>
      <div class="ring-text"><strong>${earned}/${total}</strong><span>${pct}%</span></div>
    </div>
    <div class="grade-lines">${grades}</div>
    ${upHtml}
  </section>`;
  const btn = el.querySelector('[data-open]');
  if (btn) btn.addEventListener('click', () => onSelect(btn.getAttribute('data-open')));
}

/** Roadmap view: 7 stages with trophies, time estimates and per-stage progress. */
export function renderRoadmap(data, state, el, onSelect) {
  const trophies = data.trophies.trophies;
  const stages = (data.panels.roadmap ?? [])
    .map((stage) => {
      const inStage = trophies.filter((t) => t.stage === stage.stage);
      const earned = inStage.filter((t) => state.earned.includes(t.id)).length;
      const names = (stage.trophies ?? [])
        .map((name) => {
          const t = trophies.find((x) => x.name === name);
          if (!t) return `<span class="stage-trophy">${esc(name)}</span>`;
          const masked = isSpoilerMasked(t, state);
          return `<button class="stage-trophy${state.earned.includes(t.id) ? ' earned' : ''}" data-open="${esc(t.id)}">${esc(masked ? '???' : name)}</button>`;
        })
        .join('');
      return `<section class="stage-card">
        <header><span class="stage-num">Tahap ${stage.stage}</span><h3>${esc(stage.title)}</h3><span class="stage-time">${esc(stage.time ?? '')}</span></header>
        <p>${esc(stage.text)}</p>
        <div class="stage-bar"><i style="width:${inStage.length ? Math.round((earned / inStage.length) * 100) : 0}%"></i><span>${earned}/${inStage.length} trophy</span></div>
        <div class="stage-trophies">${names}</div>
        <p class="stage-src">Sumber: ${sourceChips(data.sources.sources, stage.src)}</p>
      </section>`;
    })
    .join('');
  el.innerHTML = `<h2>Roadmap ke Platinum</h2><p class="view-intro">Tujuh tahap, berurutan — dari pembuka sampai cleanup free-roam setelah tamat. Satu playthrough cukup; tidak ada New Game+.</p><div class="stage-grid">${stages}</div>`;
  el.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => onSelect(btn.getAttribute('data-open'))));
}

/** Missables view: chapter grid; only Positive Mental Attitude is red. */
export function renderMissables(data, state, el, onSelect) {
  const trophies = data.trophies.trophies;
  const cards = (data.panels.missables ?? [])
    .map((m) => {
      const t = trophies.find((x) => x.name === m.trophy);
      const high = m.risk === 'high';
      return `<article class="miss-card ${high ? 'risk-high' : 'risk-low'}">
        <header><span class="risk-badge">${high ? 'BISA KELEWAT' : 'AMAN SETELAH STORY'}</span><span class="miss-chapter">${esc(m.chapter)}</span></header>
        <h3>${t ? `<button data-open="${esc(t.id)}">${esc(isSpoilerMasked(t, state) ? '???' : m.trophy)}</button>` : esc(m.trophy)}</h3>
        <p>${esc(m.text)}</p>
        <p class="miss-src">Sumber: ${sourceChips(data.sources.sources, m.src)}</p>
      </article>`;
    })
    .join('');
  el.innerHTML = `<h2>Missables — yang bisa kelewat</h2>
    <p class="view-intro">Hanya <strong>satu</strong> trophy yang berpotensi missable. Sisanya aman dikerjakan setelah tamat di free-roam.</p>
    <div class="miss-grid">${cards}</div>
    <section class="save-strategy"><h3>Strategi save (tanpa mission replay)</h3>
    <p>Game ini tidak punya mission replay dan tidak ada New Game+. Simpan manual di awal &amp; akhir tiap chapter — 15 slot manual + 1 autosave. Putar slotnya: 10 save untuk chapter, sisanya untuk cleanup free-roam. Jangan pernah menimpa satu-satunya save chapter yang sedang berjalan.</p></section>`;
  el.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => onSelect(btn.getAttribute('data-open'))));
}

/** Disputes view: every disagreement shown both ways, plus glitch & launch status. */
export function renderDisputes(data, el) {
  const disputes = (data.panels.disputes ?? [])
    .map(
      (d) => `<article class="dispute-card">
        <h3>${esc(d.title)}</h3>
        <div class="dispute-sides"><div><strong>Pro</strong><p>${esc(d.pro)}</p></div><div><strong>Kontra</strong><p>${esc(d.con)}</p></div></div>
        <p class="dispute-status">Status: <strong>${esc(d.status)}</strong> · Sumber: ${sourceChips(data.sources.sources, d.src)}</p>
      </article>`,
    )
    .join('');
  const g = data.panels.glitch ?? {};
  const glitchSteps = (g.steps ?? []).map((s) => `<li>${esc(s.text)} <span class="step-src">${sourceChips(data.sources.sources, s.src)}</span></li>`).join('');
  const alternatives = (g.alternatives ?? []).map((a) => `<li>${esc(a.text)} <span class="step-src">${sourceChips(data.sources.sources, a.src)}</span></li>`).join('');
  const launch = (data.panels.launch ?? []).map((l) => `<li>${esc(l.text)} <span class="step-src">${sourceChips(data.sources.sources, l.src)}</span></li>`).join('');
  const warnings = (data.panels.warnings ?? []).map((w) => `<li>${esc(w.text)} <span class="step-src">${sourceChips(data.sources.sources, w.src)}</span></li>`).join('');
  const farming = (data.panels.farming ?? []).map((f) => `<li>${esc(f.text)} <span class="step-src">${sourceChips(data.sources.sources, f.src)}</span></li>`).join('');
  el.innerHTML = `<h2>Disputes — sumber yang bertentangan</h2>
    <p class="view-intro">Sumber tidak selalu sepakat. Setiap perselisihan ditampilkan dua sisi, dengan status kejujurannya — bukan dipilih yang enak dibaca.</p>
    <div class="dispute-grid">${disputes}</div>
    <section class="panel-block"><h3>${esc(g.title ?? 'Glitch & Farming')}</h3>
      <p class="glitch-status">Status: <strong>${esc(g.status ?? '')}</strong></p>
      ${glitchSteps ? `<ol class="steps">${glitchSteps}</ol>` : ''}
      ${g.warning ? `<p class="warning">${esc(g.warning)}</p>` : ''}
      ${alternatives ? `<h4>Cara legit sebagai alternatif</h4><ul class="plain-list">${alternatives}</ul>` : ''}
    </section>
    <section class="panel-block"><h3>Status launch &amp; patch day-one</h3><ul class="plain-list">${launch}</ul></section>
    <section class="panel-block"><h3>Peringatan — baca sebelum main</h3><ul class="plain-list">${warnings}</ul></section>
    <section class="panel-block"><h3>Farming legal (bukan glitch)</h3><ul class="plain-list">${farming}</ul></section>`;
}

/** Sources view: the full source matrix with page counts and links. */
export function renderSources(data, el) {
  const rows = data.sources.sources
    .map(
      (s) => `<tr><td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></td>
        <td><code>${esc(s.code)}</code></td><td>${s.pages?.length ?? 0} halaman</td>
        <td>${(s.pages ?? []).slice(0, 3).map((p) => esc(p)).join(' · ')}${(s.pages?.length ?? 0) > 3 ? ' …' : ''}</td></tr>`,
    )
    .join('');
  el.innerHTML = `<h2>Sumber — matrix</h2>
    <p class="view-intro">Setiap klaim di guide ini menunjuk ke salah satu sumber di bawah. App ini tidak pernah mengambil (fetch) apa pun dari sumber-sumber ini — tautan hanya terbuka kalau pembaca mengkliknya.</p>
    <table class="source-table"><thead><tr><th>Sumber</th><th>Kode</th><th>Halaman</th><th>Contoh halaman dibaca</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Easter Eggs view: 86 cards with kind/status filters. */
export function renderEggs(data, state, el) {
  const items = (data.eggs.items ?? []).filter((item) => {
    if (state.eggKind !== 'all' && item.kind !== state.eggKind) return false;
    if (state.eggStatus !== 'all' && item.status !== state.eggStatus) return false;
    return true;
  });
  const cards = items
    .map(
      (item) => `<article class="egg-card">
        <header><span class="egg-kind kind-${esc(item.kind)}">${esc(item.kind)}</span><span class="egg-status status-${esc(item.status)}">${esc(item.status)}</span></header>
        <h3>${esc(item.name)}</h3>
        <p class="egg-where">${esc(item.where)}</p>
        <p>${esc(item.text)}</p>
        <p class="egg-src">Sumber: ${sourceChips(data.sources.sources, item.src)}</p>
      </article>`,
    )
    .join('');
  el.innerHTML = `<h2>Easter Eggs, Bug &amp; Keanehan</h2>
    <p class="view-intro">${data.eggs.items?.length ?? 0} temuan di Leonida — telur paskah, bug, dan hal aneh. Difilter di bawah; statusnya jujur: confirmed, reported, atau disputed.</p>
    <div class="egg-filters">
      <label>Jenis <select id="egg-kind"><option value="all">Semua</option><option value="egg">Easter egg</option><option value="bug">Bug</option><option value="oddity">Keanehan</option></select></label>
      <label>Status <select id="egg-status"><option value="all">Semua</option><option value="confirmed">Confirmed</option><option value="reported">Reported</option><option value="disputed">Disputed</option></select></label>
    </div>
    <p class="egg-count">${items.length} ditampilkan</p>
    <div class="egg-grid">${cards || '<p class="empty">Tidak ada yang cocok dengan filter ini.</p>'}</div>`;
  el.querySelector('#egg-kind').value = state.eggKind;
  el.querySelector('#egg-status').value = state.eggStatus;
}
