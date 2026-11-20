// views.js — every screen of the guide, rendered as HTML strings.
//
// main.js owns the data and the saved state; this file only turns them
// into markup for #view (the main column) and #detail (the side pane).
// Every renderer takes one context object:
//   { trophies, panels, state, filters, filtered }
// and returns an HTML string. Event handling lives in main.js, wired by
// delegation on data-action attributes, so these strings stay inert.
//
// Shared vocabulary (classes come from style.css):
//   chip chip-platinum/gold/silver/bronze — the grade medal
//   badge-hidden / badge-missable / badge-verified-* / badge-overlap-*
//   trophy-list / trophy-item / trophy-check / trophy-name / trophy-desc
//   count-line / count-input / note-field / panel / dispute / verdict
//   stage-bar / stage-head / chapter-grid / planner-list / warning-panel

import { countTarget, countTotal, overlapLabel, remainingCount } from "./data.js";
import { getCount, isEarned } from "./store.js";
import { applyFilters, filterSummary, isSpoilerHidden, SPOILER_LABEL, visibleDescription, visibleName } from "./filters.js";

/** Escape user- and data-supplied text before it joins the markup. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The coloured grade medal chip (Platinum / Gold / Silver / Bronze). */
function gradeChip(grade) {
  return '<span class="chip chip-' + esc(grade.toLowerCase()) + '">' + esc(grade) + "</span>";
}

/** "Confirmed" (green), "Reported" (amber) or "Unknown" (red) badge. */
function verifiedBadge(trophy) {
  const label = trophy.verified === "confirmed"
    ? "Verified: Confirmed"
    : trophy.verified === "reported"
      ? "Verified: Reported"
      : "Verified: Unknown";
  return '<span class="badge-verified-' + esc(trophy.verified) + '">' + label + "</span>";
}

/** Badge for how the trophy overlaps the 100% completion checklist. */
function overlapBadge(trophy) {
  return '<span class="badge-overlap-' + esc(trophy.overlap100) + '">' + esc(overlapLabel(trophy)) + "</span>";
}

/** The row of small flags under a trophy name: kind, hidden, missable... */
function trophyBadges(trophy) {
  const parts = [];
  parts.push('<span class="badge-kind">' + esc(trophy.kind) + "</span>");
  if (trophy.hidden) parts.push('<span class="badge-hidden">Hidden</span>');
  if (trophy.missable) parts.push('<span class="badge-missable">Missable</span>');
  parts.push(verifiedBadge(trophy));
  parts.push(overlapBadge(trophy));
  return parts.join(" ");
}

/** A list of cited sources: each one a real link the reader can follow. */
export function sourceList(sources) {
  if (!sources || sources.length === 0) return "<p>No source cited.</p>";
  const items = sources.map((source) =>
    '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.name) + "</a></li>"
  );
  return '<ul class="source-list">' + items.join("") + "</ul>";
}

/** The disagreement panels whose topic starts with this trophy's name. */
function disagreementFor(trophy, disagreements) {
  return (disagreements || []).filter((item) => item.topic.indexOf(trophy.name) === 0);
}

/** One "two sources disagree" panel, both sides shown, verdict at the end. */
export function disagreementPanel(item) {
  return '<section class="panel dispute"><h3>Disagreement — ' + esc(item.topic) + "</h3>"
    + '<p><strong>Side A (' + esc(item.sideA.source) + "):</strong> " + esc(item.sideA.claim) + "</p>"
    + '<p><strong>Side B (' + esc(item.sideB.source) + "):</strong> " + esc(item.sideB.claim) + "</p>"
    + '<p class="verdict"><strong>Our call:</strong> ' + esc(item.verdict) + "</p></section>";
}

/**
 * The label a masked trophy gets outside the checklist: the same
 * "Hidden — spoiler disembunyikan" text, plus its kind, and never the
 * real name — so a roadmap stage or planner row stays useful (stage +
 * kind still show) without leaking the story trophy's name.
 */
function maskedRowLabel(trophy) {
  return SPOILER_LABEL + " · " + trophy.kind + " trophy";
}

/**
 * A disagreement panel whose topic may start with a trophy name: when
 * that trophy is spoiler-hidden, the topic's leading name is masked the
 * same way, so the name cannot leak through a dispute heading on the
 * glitch page or inside a trophy's own detail pane.
 */
function maskedDisagreement(item, ctx) {
  const owner = ctx.trophies.find((trophy) => item.topic.indexOf(trophy.name) === 0);
  if (!owner || !isSpoilerHidden(owner, ctx.state)) return disagreementPanel(item);
  return disagreementPanel({
    ...item,
    topic: SPOILER_LABEL + item.topic.slice(owner.name.length),
  });
}

/** Progress line + number input for a count trophy (250 stunts, 42 golds...). */
function countEditor(trophy, state) {
  const target = countTarget(trophy);
  if (target === null) return "";
  const total = countTotal(trophy);
  const done = getCount(state, trophy.name);
  const totalText = total !== null && total !== target ? " of " + total + " in the world" : "";
  return '<p class="count-line">Progress: '
    + '<input class="count-input" type="number" min="0" max="' + target + '" value="' + done
    + '" data-action="count" data-name="' + esc(trophy.name) + '" aria-label="Progress for ' + esc(visibleName(trophy, state)) + '">'
    + " / " + target + totalText + "</p>";
}

/* ------------------------------------------------------------------ */
/* Checklist (route #/) — the tracker itself                          */
/* ------------------------------------------------------------------ */

function checklistRow(trophy, state) {
  const earned = isEarned(state, trophy.name);
  const hidden = isSpoilerHidden(trophy, state);
  const encoded = encodeURIComponent(trophy.name);
  const classes = "trophy-item" + (earned ? " earned" : "") + (hidden ? " spoiler-hidden" : "");
  return '<li class="' + classes + '">'
    + '<input type="checkbox" class="trophy-check" data-action="toggle" data-name="' + esc(trophy.name) + '"'
    + (earned ? " checked" : "") + ' aria-label="Earned: ' + esc(visibleName(trophy, state)) + '">'
    + "<div>"
    + '<h3 class="trophy-name">' + gradeChip(trophy.grade) + " " + esc(visibleName(trophy, state)) + "</h3>"
    + '<p class="trophy-desc">' + esc(visibleDescription(trophy, state)) + "</p>"
    + '<p class="trophy-meta">' + trophyBadges(trophy) + "</p>"
    + countEditor(trophy, state)
    + (state.notes[trophy.name]
      ? '<p class="trophy-desc">Note: ' + esc(state.notes[trophy.name]) + "</p>"
      : "")
    + '<p><a href="#/trophy/' + encoded + '">Open guide &amp; sources</a></p>'
    + "</div></li>";
}

/** The main checklist: every trophy (after filters) with its tick box. */
export function renderChecklist(ctx) {
  const shown = applyFilters(ctx.trophies, ctx.state, ctx.filters);
  const rows = shown.map((trophy) => checklistRow(trophy, ctx.state)).join("");
  const body = shown.length === 0
    ? '<p class="empty-state">No trophies match these filters. Clear the search or change a filter to see the list again.</p>'
    : '<ul class="trophy-list">' + rows + "</ul>";
  return "<h2>Trophy checklist</h2>"
    + "<p>" + esc(filterSummary(shown.length, ctx.trophies.length))
    + " — tick a trophy when it pops; progress saves in this browser.</p>"
    + (ctx.state.spoiler
      ? "<p>Spoiler guard is on: unearned story trophies show as “Hidden — spoiler disembunyikan” until you earn them.</p>"
      : "")
    + body;
}

/* ------------------------------------------------------------------ */
/* Trophy detail (route #/trophy/<name>) — rendered into #detail      */
/* ------------------------------------------------------------------ */

export function renderDetail(ctx, name) {
  const trophy = ctx.trophies.find((item) => item.name === name);
  if (!trophy) {
    return "<p>That trophy is not in the list. Pick one from the checklist to see its guide.</p>";
  }
  // Spoiler guard, full: while the guard is on, an unearned story trophy
  // hides its whole guide in the detail pane — the steps and sources would
  // name the trophy themselves. Only the masked name, the masked
  // description and the notice below are rendered: no guide, no steps, no
  // sources, no disagreements, no counts, no notes.
  if (isSpoilerHidden(trophy, ctx.state)) {
    return "<h2>" + gradeChip(trophy.grade) + " " + esc(visibleName(trophy, ctx.state)) + "</h2>"
      + '<p class="trophy-desc">' + esc(visibleDescription(trophy, ctx.state)) + "</p>"
      + '<p class="spoiler-notice">Spoiler guard is on — earn this trophy to reveal its guide.</p>';
  }
  const earned = isEarned(ctx.state, trophy.name);
  const steps = (trophy.steps || []).map((step) => "<li>" + esc(step) + "</li>").join("");
  const disputes = disagreementFor(trophy, ctx.panels ? ctx.panels.disagreements : []);
  const disputeHtml = disputes.map((item) => maskedDisagreement(item, ctx)).join("");
  const note = ctx.state.notes[trophy.name] || "";
  const target = countTarget(trophy);
  const remaining = remainingCount(trophy, getCount(ctx.state, trophy.name));
  const remainingLine = target === null
    ? ""
    : "<p>Still to go: <strong>" + remaining + " of " + target + "</strong>."
      + (remaining === 0 ? " Done — tick it earned." : "") + "</p>";
  return "<h2>" + gradeChip(trophy.grade) + " " + esc(visibleName(trophy, ctx.state)) + "</h2>"
    + '<p class="trophy-desc">' + esc(visibleDescription(trophy, ctx.state)) + "</p>"
    + '<p class="trophy-meta">' + trophyBadges(trophy) + "</p>"
    + remainingLine
    + "<p>" + esc(trophy.guide) + "</p>"
    + "<h3>Steps</h3><ol>" + steps + "</ol>"
    + "<h3>Sources</h3>" + sourceList(trophy.sources)
    + disputeHtml
    + "<h3>100% completion</h3><p>" + esc(overlapLabel(trophy)) + ".</p>"
    + "<h3>Your progress</h3>"
    + '<p><label><input type="checkbox" class="trophy-check" data-action="toggle" data-name="' + esc(trophy.name) + '"'
    + (earned ? " checked" : "") + "> Earned</label></p>"
    + countEditor(trophy, ctx.state)
    + '<p><label>Your note<br><textarea id="note-field" class="note-field" rows="3" data-name="'
    + esc(trophy.name) + '" placeholder="Where you are up to, a location that worked…">' + esc(note) + "</textarea></label></p>"
    + '<p><button type="button" data-action="save-note" data-name="' + esc(trophy.name) + '">Save note</button></p>';
}

/* ------------------------------------------------------------------ */
/* Roadmap (route #/roadmap) — 7 stages to the platinum               */
/* ------------------------------------------------------------------ */

export function renderRoadmap(ctx) {
  const strip = '<ol class="roadmap-strip">' + ctx.panels.roadmap.map((stage) => {
    const names = stage.trophies || [];
    const earned = names.filter((name) => ctx.state.earned[name]).length;
    return '<li><span class="strip-num">Stage ' + stage.stage + "</span> "
      + esc(stage.title) + ' · <span class="strip-count">' + earned + "/" + names.length + " earned</span></li>";
  }).join("") + "</ol>";
  const missTrophy = ctx.trophies.find((item) => item.name === ctx.panels.missables.only_missable);
  const missLabel = missTrophy ? visibleName(missTrophy, ctx.state) : ctx.panels.missables.only_missable;
  const stages = ctx.panels.roadmap.map((stage) => {
    const names = stage.trophies || [];
    const earned = names.filter((name) => ctx.state.earned[name]).length;
    const percent = names.length === 0 ? 0 : Math.round((earned / names.length) * 100);
    const chips = names.map((name) => {
      const trophy = ctx.trophies.find((item) => item.name === name);
      const tick = ctx.state.earned[name] ? " ✓" : "";
      if (trophy && isSpoilerHidden(trophy, ctx.state)) {
        return '<li class="spoiler-hidden-row">' + esc(maskedRowLabel(trophy)) + "</li>";
      }
      const label = trophy ? esc(trophy.name) : esc(name);
      return '<li><a href="#/trophy/' + encodeURIComponent(name) + '">' + label + "</a>" + tick + "</li>";
    }).join("");
    return '<section class="panel"><h3><span class="stage-num">Stage ' + stage.stage + "</span> "
      + esc(stage.title) + ' <span class="stage-time">' + esc(stage.estimate) + "</span></h3>"
      + '<p class="stage-head">Progress: ' + earned + " / " + names.length + " earned</p>"
      + '<div class="stage-bar"><div class="progress-fill" style="width:' + percent + '%"></div></div>'
      + "<p>" + esc(stage.description) + "</p>"
      + '<ul class="stage-trophies">' + chips + "</ul>"
      + "<h4>Sources</h4>" + sourceList(stage.sources)
      + "</section>";
  }).join("");
  return "<h2>Roadmap to the platinum</h2>"
    + "<p>Seven stages, in the order to play them. Story first (stages 1–2), "
    + "then the open-world cleanup after the credits — only one trophy can "
    + "ever be missed, and it sits in stage 1.</p>"
    + strip
    + "<p><strong>Missable summary:</strong> only <strong>1 of 55</strong> trophies can be missed — "
    + '<a href="#/trophy/' + encodeURIComponent(ctx.panels.missables.only_missable) + '">'
    + esc(missLabel) + "</a> (Chapter 1 balcony meditation). "
    + "Every other trophy is safe in free-roam after the story. "
    + '<a href="#/missables">Full missables page →</a></p>'
    + stages;
}

/* ------------------------------------------------------------------ */
/* Missables (route #/missables) — the one red chapter                 */
/* ------------------------------------------------------------------ */

export function renderMissables(ctx) {
  const miss = ctx.panels.missables;
  const only = ctx.trophies.find((item) => item.name === miss.only_missable);
  const onlyName = only ? visibleName(only, ctx.state) : miss.only_missable;
  const onlyDesc = only ? visibleDescription(only, ctx.state) : "";
  const cells = miss.chapter_grid.map((cell) => {
    const risk = cell.risk === "red" ? "risk-red" : "risk-safe";
    const names = (cell.trophies || []).map((name) => {
      const trophy = ctx.trophies.find((item) => item.name === name);
      const label = trophy ? visibleName(trophy, ctx.state) : name;
      return '<a href="#/trophy/' + encodeURIComponent(name) + '">' + esc(label) + "</a>";
    }).join(", ") || "None";
    return '<div class="chapter-cell ' + risk + '"><h3>' + esc(cell.chapter) + "</h3>"
      + "<p><strong>Trophies at risk:</strong> " + names + "</p>"
      + "<p>" + esc(cell.notes) + "</p></div>";
  }).join("");
  return "<h2>Missable trophies</h2>"
    + "<p>" + esc(miss.summary) + "</p>"
    + '<section class="panel warning-panel"><h3>The only missable trophy — '
    + esc(onlyName) + "</h3><p>"
    + esc(onlyDesc) + " "
    + "Meditate on the balcony of Jason's house in Chapter 1, when Lucia offers it "
    + "after the mission Down to Earth. After Chapter 1 ends it is gone for good — "
    + "and it is still unconfirmed whether that first meditation is required for the "
    + "trophy, so do it while you can.</p></section>"
    + '<div class="chapter-grid">' + cells + "</div>"
    + '<section class="panel"><h3>Save strategy — ' + esc(miss.save_strategy.slots) + "</h3><p>"
    + esc(miss.save_strategy.description) + "</p><h4>Sources</h4>"
    + sourceList(miss.save_strategy.sources) + "</section>"
    + "<h3>Sources</h3>" + sourceList(miss.sources);
}

/* ------------------------------------------------------------------ */
/* Glitch & farming (route #/glitch) — Apollo, honestly labelled      */
/* ------------------------------------------------------------------ */

/** One honest farming panel from panels.json (bank vaults, Focus...). */
function farmingPanel(title, tip) {
  const value = tip.value ? " — <strong>" + esc(tip.value) + "</strong>" : "";
  return '<section class="panel"><h3>' + esc(title) + value + "</h3><p>"
    + esc(tip.description) + "</p>" + sourceList(tip.sources) + "</section>";
}

export function renderGlitch(ctx) {
  const glitch = ctx.panels.glitch;
  const warehouse = glitch.apollo_warehouse;
  const steps = warehouse.how_it_works.map((step) => "<li>" + esc(step) + "</li>").join("");
  const pros = warehouse.pros.map((pro) =>
    "<li><strong>" + esc(pro.source) + ":</strong> " + esc(pro.claim) + "</li>"
  ).join("");
  const cons = warehouse.cons.map((con) =>
    "<li><strong>" + esc(con.source) + ":</strong> " + esc(con.claim) + "</li>"
  ).join("");
  const alternatives = warehouse.alternatives.map((alt) => "<li>" + esc(alt) + "</li>").join("");
  const disputes = (ctx.panels.disagreements || []).map((item) => maskedDisagreement(item, ctx)).join("");
  const shortSource = (source) => source.split(" — ")[0];
  const verdict = '<p class="glitch-verdict"><strong>2 PRO</strong> — '
    + warehouse.pros.map((pro) => esc(shortSource(pro.source))).join(", ")
    + " &nbsp;vs&nbsp; <strong>2 KONTRA</strong> — "
    + warehouse.cons.map((con) => esc(shortSource(con.source))).join(", ")
    + ' &nbsp;·&nbsp; <span class="label-reported">' + esc(warehouse.label) + "</span></p>";
  return "<h2>Glitch &amp; farming</h2>"
    + '<section class="panel"><h3>Apollo Aggregates money glitch — <span class="label-reported">'
    + esc(warehouse.label) + "</span></h3>"
    + verdict
    + "<p><strong>Where:</strong> " + esc(warehouse.location) + ".</p>"
    + "<h4>How it is reported to work</h4><ol>" + steps + "</ol>"
    + "<h4>Two sources say it works</h4><ul>" + pros + "</ul>"
    + "<h4>Two sources say it does not</h4><ul>" + cons + "</ul>"
    + '<p class="warning-panel">' + esc(warehouse.phishing_warning) + "</p>"
    + "<h4>Legit alternatives</h4><ul>" + alternatives + "</ul>"
    + "<h4>Sources</h4>" + sourceList(warehouse.sources)
    + "</section>"
    + "<h3>Honest farming — no glitch needed</h3>"
    + farmingPanel("Bank vaults — the legit money", glitch.bank_vault)
    + farmingPanel("Focus farm", glitch.focus_farm)
    + farmingPanel("Train tunnel escape", glitch.train_tunnel)
    + farmingPanel("Weapon discount (Chapter 1)", glitch.weapon_discount)
    + "<h3>Where sources disagree</h3>" + disputes;
}

/* ------------------------------------------------------------------ */
/* Launch status (route #/status) — day-one patches and open questions */
/* ------------------------------------------------------------------ */

export function renderStatus(ctx) {
  const status = ctx.panels.launchStatus;
  const items = status.items.map((item) =>
    '<section class="panel"><h3>' + esc(item.topic) + ' — <span class="badge-verified-' + esc(item.status) + '">'
    + esc(item.status) + "</span></h3><p>" + esc(item.detail) + "</p>"
    + sourceList(item.sources) + "</section>"
  ).join("");
  const warnings = ctx.panels.warnings.map((warning) =>
    '<section class="panel warning-panel"><h3>' + esc(warning.title) + "</h3><p>"
    + esc(warning.detail) + "</p>" + sourceList(warning.sources) + "</section>"
  ).join("");
  return "<h2>Launch status</h2>"
    + "<p>Research as of <strong>" + esc(status.as_of) + "</strong>. The game launched 19 Nov 2026; "
    + "this page is the honest state of patches, bugs and rumours at that date — "
    + "unverified claims are labelled unverified, never presented as fact.</p>"
    + items
    + "<h3>Warnings that can save a platinum run</h3>" + warnings;
}

/* ------------------------------------------------------------------ */
/* Planner (route #/planner) — Next Up, nearest first                 */
/* ------------------------------------------------------------------ */

/**
 * The nearest unearned trophies: roadmap stage first, then how little
 * is left to do (a count trophy at 240/250 beats one at 0/250; a plain
 * trophy counts as 1 step left). Story trophies come first because the
 * roadmap says to finish them before the cleanup.
 */
export function nextUp(ctx, limit) {
  const pending = ctx.trophies
    .filter((trophy) => !ctx.state.earned[trophy.name] && trophy.name !== "Vice Got a Price!")
    .map((trophy) => {
      const target = countTarget(trophy);
      const left = target === null ? 1 : Math.max(0, target - getCount(ctx.state, trophy.name));
      return { trophy, left };
    })
    .sort((a, b) =>
      (a.trophy.roadmap_stage - b.trophy.roadmap_stage) || (a.left - b.left)
    );
  return pending.slice(0, limit || 10);
}

export function renderPlanner(ctx) {
  const picks = nextUp(ctx, 10);
  const items = picks.map((pick) => {
    const target = countTarget(pick.trophy);
    const why = target === null
      ? "Stage " + pick.trophy.roadmap_stage + " · one step — " + pick.trophy.kind
      : "Stage " + pick.trophy.roadmap_stage + " · " + pick.left + " of " + target + " left";
    if (isSpoilerHidden(pick.trophy, ctx.state)) {
      return '<li class="planner-item"><span class="masked-name">'
        + gradeChip(pick.trophy.grade) + " " + esc(maskedRowLabel(pick.trophy)) + "</span>"
        + '<span class="why">' + esc(why) + "</span></li>";
    }
    return '<li class="planner-item"><a href="#/trophy/' + encodeURIComponent(pick.trophy.name) + '">'
      + gradeChip(pick.trophy.grade) + " " + esc(pick.trophy.name) + "</a>"
      + '<span class="why">' + esc(why) + "</span></li>";
  }).join("");
  const body = picks.length === 0
    ? '<p class="empty-state">Everything except the platinum is earned. Claim it — Vice Got a Price! is yours.</p>'
    : '<ol class="planner-list">' + items + "</ol>";
  return "<h2>Next Up planner</h2>"
    + "<p>Your nearest unearned trophies, in roadmap order — earliest stage first, "
    + "then the smallest amount left to do. Work this list top to bottom and the "
    + "platinum follows the roadmap instead of wandering the map.</p>"
    + '<p><strong>Your progress file:</strong> <button type="button" data-action="export">Export progress</button> '
    + '<button type="button" data-action="import">Import progress</button> '
    + '<button type="button" data-action="reset">Reset progress</button> '
    + "— the same file the footer and Settings use; progress lives only in this browser.</p>"
    + body
    + "<p><strong>Recommended order:</strong> finish the story and the Chapter 1 balcony "
    + "meditation first (stage 1, Story + Chapter 1 meditation), then the stranger questlines "
    + "(stage 2), then partner crimes and the two newly solved mysteries (stage 3), activities "
    + "and races (stage 4), collections and scanning (stage 5), robberies and fencing "
    + "(stage 6), and the 100% checklist cleanup last (stage 7) — the platinum pops with it.</p>";
}

/* ------------------------------------------------------------------ */
/* Settings (route #/settings) — spoiler, save file, and data stats   */
/* ------------------------------------------------------------------ */

export function renderSettings(ctx) {
  const confirmed = ctx.trophies.filter((trophy) => trophy.verified !== "unknown").length;
  const reported = ctx.trophies.filter((trophy) => trophy.verified === "reported").length;
  const unknown = ctx.trophies.filter((trophy) => trophy.verified === "unknown").length;
  const sourceCount = new Set(
    ctx.trophies.flatMap((trophy) => (trophy.sources || []).map((source) => source.name))
  ).size;
  const savedAt = ctx.state.savedAt ? new Date(ctx.state.savedAt).toLocaleString() : "not saved yet";
  return "<h2>Settings</h2>"
    + '<section class="panel"><h3>Spoiler guard</h3>'
    + '<p><label><input type="checkbox" id="spoiler-toggle-view" data-action="spoiler"'
    + (ctx.state.spoiler ? " checked" : "")
    + "> Hide story trophy names &amp; descriptions until they are earned</label></p>"
    + "<p>With the guard on, unearned story trophies read “Hidden — spoiler disembunyikan” "
    + "in the checklist, the roadmap, the planner, the missables page and trophy guides. It never hides a trophy you have already earned.</p></section>"
    + '<section class="panel"><h3>Your progress file</h3>'
    + "<p>Progress lives only in this browser (localStorage). Export it to keep a backup, "
    + "import it to restore one, or reset to start over.</p>"
    + '<p><button type="button" data-action="export">Export progress</button> '
    + '<button type="button" data-action="import">Import progress</button> '
    + '<button type="button" data-action="reset">Reset progress</button></p>'
    + "<p>Last saved: " + esc(savedAt) + ".</p></section>"
    + '<section class="panel"><h3>Guide data — the numbers behind this app</h3><ul>'
    + "<li><strong>55</strong> trophies: 1 Platinum · 2 Gold · 6 Silver · 46 Bronze · 28 Hidden · 0 Online</li>"
    + "<li><strong>" + confirmed + " of 55</strong> unlock methods confirmed by at least one trusted source ("
    + reported + " of them reported by a single source, still labelled as such)</li>"
    + "<li><strong>" + unknown + " trophy still unverified:</strong> Ten Pin — shown honestly as Unknown</li>"
    + "<li><strong>" + (ctx.panels.disagreements || []).length + " disagreement panels</strong> — where sources contradict each other, both sides are shown</li>"
    + "<li><strong>" + sourceCount + " named sources</strong> cited across the trophy guides</li>"
    + "<li>Research as of 21 Nov 2026, 00:30 WIB. No Rockstar logo or artwork is used anywhere in this guide.</li>"
    + "</ul></section>";
}
