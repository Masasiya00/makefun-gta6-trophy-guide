// views.js — renders every pane and page from data + state.
// All text here is interface copy; guide content itself comes from the JSON.

import {
  displayName, displayDescription, isSpoilerHidden,
  sourceName, sourceByCode, trophyByName, gradeLabel, escapeHtml,
} from './data.js';
import { applyFilters, suggestNextUp } from './filters.js';

const h = escapeHtml;

function srcLinks(data, codes) {
  if (!codes || codes.length === 0) return '';
  const links = codes.map((code) => {
    const s = sourceByCode(data, code);
    const label = s ? h(s.name) : h(code);
    const url = s && s.url ? h(s.url) : '#';
    return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
  }).join('');
  return `<div class="srcs"><span class="src-count">${codes.length} source${codes.length > 1 ? 's' : ''}:</span> ${links}</div>`;
}

function claimHtml(data, claim) {
  return `<div class="claim"><p>${h(claim.text)}</p>${srcLinks(data, claim.src)}</div>`;
}

function gradeBadge(t) {
  return `<span class="grade grade-${h(t.grade)}">${h(gradeLabel(t.grade))}</span>`;
}

function statusTag(t) {
  if (t.verified === 'confirmed') return `<span class="tag tag-verified-confirmed">Confirmed</span>`;
  if (t.verified === 'reported') return `<span class="tag tag-verified-reported">Reported</span>`;
  return `<span class="tag tag-verified-unknown">Unknown</span>`;
}

// ---- left pane -------------------------------------------------------------

export function renderList(data, state, els) {
  const list = applyFilters(data.trophies, state);
  els.list.innerHTML = list.map((t) => {
    const earned = !!state.earned[t.name];
    const hidden = isSpoilerHidden(t, state.spoiler, earned);
    const name = h(displayName(t, state.spoiler, earned));
    const count = t.counts
      ? `<span class="tag">${state.counts[t.name] || 0}/${t.counts.total}</span>` : '';
    return `<li data-name="${h(t.name)}" class="${earned ? 'earned' : ''} ${state.selected === t.name ? 'selected' : ''}">
      <input type="checkbox" data-earn="${h(t.name)}" ${earned ? 'checked' : ''} aria-label="Mark ${name} earned">
      <div class="t-meta">
        <div class="t-name">${name}</div>
        <div class="t-sub">${gradeBadge(t)}
          <span class="tag">${h(t.kind)}</span>
          ${t.hidden ? '<span class="tag tag-hidden">Hidden</span>' : ''}
          ${t.missable ? '<span class="tag tag-missable">Missable</span>' : ''}
          ${statusTag(t)} ${count}
        </div>
      </div>
    </li>`;
  }).join('');
  els.count.textContent = `Showing ${list.length} of ${data.trophies.length} trophies`;
  const total = data.trophies.length;
  const earned = data.trophies.filter((t) => state.earned[t.name]).length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  els.progress.innerHTML = `
    <div class="progress-line"><span>Platinum progress</span><b>${earned} / ${total} &middot; ${pct}%</b></div>
    <div class="bar"><i style="width:${pct}%"></i></div>`;
}

// ---- center: trophy detail -------------------------------------------------

export function renderDetail(data, state, els) {
  const t = trophyByName(data, state.selected) || data.trophies[0];
  if (!t) { els.center.innerHTML = '<p>No trophy data loaded.</p>'; return; }
  const earned = !!state.earned[t.name];
  const hidden = isSpoilerHidden(t, state.spoiler, earned);
  const steps = (t.steps || []).map((s, i) => `
    <li><span class="step-no">${i + 1}.</span>${h(s.text)}${srcLinks(data, s.src)}</li>`).join('');
  const countBox = t.counts ? `
    <div class="count-box">
      <span>Count tracker:</span>
      <input type="number" min="0" max="${t.counts.total}" value="${state.counts[t.name] || 0}" data-count="${h(t.name)}" aria-label="Current count for ${h(t.name)}">
      <span>/ ${t.counts.total} ${t.counts.target ? `(target ${t.counts.target})` : ''}</span>
    </div>` : '';
  const dispute = (data.panels.disputes || []).find(
    (d) => d.topic.toLowerCase().includes(t.name.toLowerCase()));
  const disputeHtml = dispute ? `
    <div class="dispute-box"><h3>Disputed — ${h(dispute.topic)}</h3>
      <div class="side side-pro"><h4>One side says</h4>${dispute.pro.map((c) => claimHtml(data, c)).join('')}</div>
      <div class="side side-con"><h4>The other side says</h4>${dispute.con.map((c) => claimHtml(data, c)).join('')}</div>
    </div>` : '';
  els.center.innerHTML = `
    <article class="page detail">
      <div class="detail-head">
        <div class="t-name">${h(displayName(t, state.spoiler, earned))}</div>
        <p class="detail-desc">${h(displayDescription(t, state.spoiler, earned))}</p>
        <div class="detail-meta">
          ${gradeBadge(t)}
          <span class="tag">${h(t.kind)}</span>
          ${t.hidden ? '<span class="tag tag-hidden">Hidden trophy</span>' : ''}
          ${t.missable ? '<span class="tag tag-missable">Missable</span>' : ''}
          ${statusTag(t)}
          <span class="tag">Roadmap stage ${t.roadmap_stage}</span>
          ${t.overlap100 ? `<span class="tag">100% overlap: ${h(t.overlap100)}</span>` : ''}
        </div>
        ${hidden ? '<p class="status-line">Spoiler shield is on. This story trophy stays hidden until you mark it earned.</p>' : ''}
      </div>
      <div class="check-row">
        <label><input type="checkbox" data-earn="${h(t.name)}" ${earned ? 'checked' : ''}> Earned</label>
        ${countBox}
        <button class="btn btn-small" type="button" data-nextup="${h(t.name)}">+ Add to Next Up</button>
      </div>
      <h2>Guide</h2>
      <p>${h(t.guide)}</p>
      ${t.missable_box ? `<div class="warn-box"><h3>Missable — read before you play past it</h3><p>${h(t.missable_box)}</p></div>` : ''}
      ${t.points_of_no_return ? `<div class="warn-box"><h3>Point of no return</h3><p>${h(t.points_of_no_return)}</p></div>` : ''}
      <h2>Steps — ${(t.steps || []).length} cited claims</h2>
      <ol class="steps">${steps}</ol>
      ${disputeHtml}
    </article>`;
}

// ---- right pane ------------------------------------------------------------

export function renderAudit(data, state, audit, els) {
  const earned = data.trophies.filter((t) => state.earned[t.name]).length;
  els.auditMini.innerHTML = `
    <span><b>${audit.total}</b> claims</span>
    <span><b>${audit.twoPlus}</b> in 2+ sources</span>
    <span><b>${audit.sources}</b> sources</span>
    <span><b>${earned}/${data.trophies.length}</b> trophies</span>`;
  els.audit.innerHTML = `
    <h2>Audit strip</h2>
    <div class="audit-grid">
      <div class="audit-cell"><div class="num">${audit.total}</div><div class="lbl">claims, 100% cited</div></div>
      <div class="audit-cell"><div class="num">${audit.twoPlus}</div><div class="lbl">claims in 2+ sources</div></div>
      <div class="audit-cell"><div class="num">${audit.sources}</div><div class="lbl">sources (${audit.pages} pages)</div></div>
      <div class="audit-cell"><div class="num">${audit.steps}</div><div class="lbl">trophy steps (${audit.stepTwoPlus} in 2+)</div></div>
      <div class="audit-cell"><div class="num">${audit.eggs}</div><div class="lbl">easter eggs (${audit.eggsTwoPlus} in 2+)</div></div>
      <div class="audit-cell"><div class="num">${audit.disputes}</div><div class="lbl">open disputes</div></div>
    </div>
    <p class="audit-note">Every claim below cites at least one source. Disputed claims show both sides instead of picking one.</p>`;
  els.foot.textContent = `Audit: ${audit.total} claims · ${audit.twoPlus} in 2+ sources · ${audit.sources} sources · ${audit.pages} pages · ${audit.disputes} disputes · ${audit.eggs} easter eggs.`;
  els.roadmapMini.innerHTML = `
    <h2>Roadmap — 7 stages</h2>
    ${(data.panels.roadmap || []).map((s) => `
      <div class="mini-stage"><span class="st">Stage ${s.stage}</span><span>${h(s.title)}</span><span>${(s.trophies || []).length} trophies</span></div>`).join('')}
    <p class="audit-note">${h((data.panels.roadmap || []).length ? 'Open the Roadmap page for the full plan, stage by stage.' : '')}</p>`;
}

export function renderNextUp(data, state, els) {
  const items = state.nextUp.map((n) => trophyByName(data, n)).filter(Boolean);
  const suggestions = items.length < 5
    ? suggestNextUp(data.trophies, state, 5 - items.length)
        .filter((t) => !state.nextUp.includes(t.name)) : [];
  els.nextUp.innerHTML = `
    <h2>Next Up planner</h2>
    ${items.length ? `<ol class="nextup-list">${items.map((t) => `
      <li><span>${h(displayName(t, state.spoiler, !!state.earned[t.name]))}</span>
        <span>
          <button class="btn btn-small" type="button" data-move-up="${h(t.name)}" aria-label="Move up">&uarr;</button>
          <button class="btn btn-small" type="button" data-move-down="${h(t.name)}" aria-label="Move down">&darr;</button>
          <button class="btn btn-small" type="button" data-remove-nextup="${h(t.name)}" aria-label="Remove">&times;</button>
        </span></li>`).join('')}</ol>` : '<p class="nextup-empty">Nothing planned yet. Add trophies from their detail view, or take a suggestion below.</p>'}
    ${suggestions.length ? `<h3>Suggested next</h3><ol class="nextup-list">${suggestions.map((t) => `
      <li><span>${h(displayName(t, state.spoiler, false))} <span class="tag">${t.missable ? 'Missable' : `Stage ${t.roadmap_stage}`}</span></span>
      <button class="btn btn-small" type="button" data-nextup="${h(t.name)}">+ Add</button></li>`).join('')}</ol>` : ''}`;
}

// ---- pages -----------------------------------------------------------------

export function renderRoadmap(data, els) {
  els.center.innerHTML = `
    <div class="page"><h2>Roadmap — story to platinum in 7 stages</h2>
    <p class="status-line">Play in order. Stages 1–3 follow the story; stages 4–7 are cleanup. Each stage lists its trophies and the claims behind the plan.</p>
    ${(data.panels.roadmap || []).map((s) => `
      <section class="stage-card"><h3>Stage ${s.stage} — ${h(s.title)}</h3>
        <p class="status-line">${h(s.time || '')}</p>
        <p class="trophies-line">Trophies: ${(s.trophies || []).map((n) => h(n)).join(' · ')}</p>
        ${s.claims.map((c) => claimHtml(data, c)).join('')}
      </section>`).join('')}
    <h2>Missables at a glance</h2>
    <p class="status-line">The windows that close while you play. Full detail, chapter by chapter, is on the Missables page.</p>
    ${(data.panels.missables?.grid || []).map((ch) => `
      <h3>${h(ch.chapter)}</h3>
      <table class="grid"><thead><tr><th>Trophy / item</th><th>Window</th><th>Sources</th></tr></thead><tbody>
      ${ch.items.map((it) => `<tr><td>${h(it.trophy)}</td><td>${h(it.window)}</td><td>${(it.src || []).map((c) => h(sourceName(data, c))).join(', ')}</td></tr>`).join('')}
      </tbody></table>`).join('')}
    </div>`;
}

export function renderMissables(data, els) {
  els.center.innerHTML = `
    <div class="page"><h2>Missables — what can be lost, chapter by chapter</h2>
    <p class="status-line">Only one trophy is permanently missable, but several questlines close for a while. Save before each window below.</p>
    ${(data.panels.missables?.grid || []).map((ch) => `
      <h3>${h(ch.chapter)}</h3>
      <table class="grid"><thead><tr><th>Trophy / item</th><th>Window</th><th>Sources</th></tr></thead><tbody>
      ${ch.items.map((it) => `<tr><td>${h(it.trophy)}</td><td>${h(it.window)}</td><td>${(it.src || []).map((c) => h(sourceName(data, c))).join(', ')}</td></tr>`).join('')}
      </tbody></table>`).join('')}
    <h3>Save strategy</h3>
    ${(data.panels.missables?.save_strategy || []).map((c) => claimHtml(data, c)).join('')}
    </div>`;
}

export function renderGlitch(data, els) {
  const g = data.panels.glitch || {};
  els.center.innerHTML = `
    <div class="page"><h2>Glitch &amp; Farming</h2>
    <p><span class="badge badge-reported">${h(g.status || 'REPORTED')}</span>
    <span class="status-line"> — reported by players, not confirmed by the developers. Treat every money method as temporary: patches remove them.</span></p>
    <h3>What is reported</h3>
    ${(g.claims || []).map((c) => claimHtml(data, c)).join('')}
    <div class="dispute-box"><h3>Does it actually work? Both sides</h3>
      <div class="side side-pro"><h4>Reports it works</h4>${(g.pro || []).map((c) => claimHtml(data, c)).join('')}</div>
      <div class="side side-con"><h4>Reports it does not</h4>${(g.con || []).map((c) => claimHtml(data, c)).join('')}</div>
    </div>
    <div class="warn-box"><h3>Scam warning</h3>
      <p>Never type your account credentials into a "cash generator" or "money glitch" site. Those pages steal accounts; they do not give in-game money.</p>
    </div>
    <h3>Warnings</h3>
    ${(data.panels.warnings || []).map((c) => claimHtml(data, c)).join('')}
    <h3>Farming — legit ways to earn</h3>
    ${(data.panels.farming || []).map((c) => claimHtml(data, c)).join('')}
    </div>`;
}

export function renderLaunch(data, els) {
  els.center.innerHTML = `
    <div class="page"><h2>Launch Status</h2>
    <p class="status-line">What the launch actually looked like, claim by claim — patches, outages, crashes and what is still unverified.</p>
    ${(data.panels.launch_status || []).map((c) => `<section class="launch-card">${claimHtml(data, c)}</section>`).join('')}
    </div>`;
}

export function renderDisputes(data, els) {
  els.center.innerHTML = `
    <div class="page"><h2>Disputes — ${ (data.panels.disputes || []).length } open questions</h2>
    <p class="status-line">Where the sources disagree, this guide does not pick a winner. Both sides are shown with their citations.</p>
    ${(data.panels.disputes || []).map((d) => `
      <section class="dispute-card"><h3>${h(d.topic)} <span class="badge badge-disputed">${h(d.status || 'disputed')}</span></h3>
        <div class="side side-pro"><h4>One side says</h4>${(d.pro || []).map((c) => claimHtml(data, c)).join('')}</div>
        <div class="side side-con"><h4>The other side says</h4>${(d.con || []).map((c) => claimHtml(data, c)).join('')}</div>
      </section>`).join('')}
    </div>`;
}

export function renderEggs(data, state, els, eggFilter) {
  const cats = { egg: 'Easter eggs', bug: 'Bugs', oddity: 'Oddities' };
  const stats = { egg: 0, bug: 0, oddity: 0 };
  for (const e of data.eggs) if (stats[e.category] !== undefined) stats[e.category]++;
  const shown = data.eggs.filter((e) => !eggFilter || e.category === eggFilter || e.status === eggFilter);
  els.center.innerHTML = `
    <div class="page"><h2>Easter Eggs, Bugs &amp; Oddities — ${data.eggs.length} items</h2>
    <p class="status-line">${stats.egg} easter eggs · ${stats.bug} bugs · ${stats.oddity} oddities. Every item cites 2+ sources.</p>
    <div class="egg-filter">
      <button type="button" data-egg-filter="" class="${!eggFilter ? 'active' : ''}">All (${data.eggs.length})</button>
      <button type="button" data-egg-filter="egg" class="${eggFilter === 'egg' ? 'active' : ''}">Eggs (${stats.egg})</button>
      <button type="button" data-egg-filter="bug" class="${eggFilter === 'bug' ? 'active' : ''}">Bugs (${stats.bug})</button>
      <button type="button" data-egg-filter="oddity" class="${eggFilter === 'oddity' ? 'active' : ''}">Oddities (${stats.oddity})</button>
      <button type="button" data-egg-filter="disputed" class="${eggFilter === 'disputed' ? 'active' : ''}">Disputed</button>
    </div>
    ${shown.map((e) => `
      <section class="egg-card"><h3>${h(e.title)} <span class="badge badge-${e.status}">${h(e.status)}</span> <span class="tag">${h(cats[e.category] || e.category)}</span></h3>
      <p>${h(e.text)}</p>${srcLinks(data, e.src)}</section>`).join('')}
    </div>`;
}

export function renderSources(data, els) {
  els.center.innerHTML = `
    <div class="page"><h2>Sources — ${data.sources.length} sources, ${data.sources.reduce((n, s) => n + (s.pages || []).length, 0)} pages</h2>
    <p class="status-line">Every claim in this guide points at one of these. Open a source to check the claim yourself.</p>
    ${data.sources.map((s) => `
      <section class="src-card"><h3>${h(s.name)} <span class="tag">${h(s.code)}</span></h3>
      <div class="src-url"><a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.url)}</a></div>
      <ul>${(s.pages || []).map((p) => `<li><a href="${h(p.url)}" target="_blank" rel="noopener">${h(p.title)}</a></li>`).join('')}</ul>
      </section>`).join('')}
    </div>`;
}

export function renderSettings(data, state, els, audit) {
  const hiddenCount = data.trophies.filter((t) => t.hidden).length;
  els.center.innerHTML = `
    <div class="page"><h2>Settings</h2>
    <section class="stage-card"><h3>Spoiler shield</h3>
      <p>${state.spoiler ? 'ON' : 'OFF'} — ${state.spoiler
        ? 'the 12 main-story trophies show as ??? until you mark them earned.'
        : 'story trophy names and descriptions are visible.'}</p>
      <button class="btn" type="button" id="settings-spoiler">Toggle spoiler shield</button>
    </section>
    <section class="stage-card"><h3>Your data</h3>
      <dl class="kv">
        <dt>Earned trophies</dt><dd>${data.trophies.filter((t) => state.earned[t.name]).length} / ${data.trophies.length}</dd>
        <dt>Hidden trophies</dt><dd>${hiddenCount} of ${data.trophies.length}</dd>
        <dt>Next Up planned</dt><dd>${state.nextUp.length}</dd>
        <dt>Claims in this guide</dt><dd>${audit.total} (${audit.twoPlus} in 2+ sources)</dd>
      </dl>
      <div class="io-row">
        <button class="btn" type="button" id="settings-export">Export progress JSON</button>
        <label class="btn" for="settings-import">Import progress JSON</label>
        <input id="settings-import" type="file" accept="application/json,.json" hidden>
        <button class="btn btn-danger" type="button" id="settings-reset">Reset all progress</button>
      </div>
      <p class="io-status" id="settings-io-status"></p>
    </section>
    <section class="stage-card"><h3>About this guide</h3>
      <p>Unofficial fan-made guide for Grand Theft Auto VI. All data is stored locally in this app; nothing is sent anywhere. Trophy names and descriptions follow the official list. No Rockstar artwork, logos or game screenshots are used.</p>
    </section>
    </div>`;
}
