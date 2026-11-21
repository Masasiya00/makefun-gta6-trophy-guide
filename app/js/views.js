/* views.js — render every view of the guide from the loaded data. */

import { sourceLabel } from "./data.js";
import { isSpoilerMasked } from "./filters.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Small source chips under a claim: "Source: PowerPyx · Exophase",
   each name a link to the source's page when the source has a URL. */
export function renderSourceChips(claim, data) {
  const codes = claim.src || [];
  if (codes.length === 0) return `<span class="src-code">uncited</span>`;
  const nameByCode = new Map(data.sources.map((s) => [s.code, s]));
  return codes
    .map((code) => {
      const source = nameByCode.get(code);
      const label = source ? source.name : code;
      if (source && source.url) {
        return `<a class="src-code" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
      }
      return `<span class="src-code">${escapeHtml(label)}</span>`;
    })
    .join("");
}

export function renderClaimList(claims, data) {
  if (!claims || claims.length === 0) return "";
  const items = claims
    .map(
      (claim) =>
        `<li>${escapeHtml(claim.text)}<div class="step-src">Source: ${renderSourceChips(claim, data)}</div></li>`
    )
    .join("");
  return `<ul class="claim-list">${items}</ul>`;
}

/* ---------- tracker: trophy list ---------- */

export function renderTrophyList(container, trophies, state) {
  const { earned, spoiler, selectedName } = state;
  if (trophies.length === 0) {
    container.innerHTML = `<li class="list-empty">Tidak ada trophy yang cocok dengan filter ini.</li>`;
    return;
  }
  container.innerHTML = trophies
    .map((trophy) => {
      const masked = isSpoilerMasked(trophy, { spoiler, earned });
      const isEarned = earned.has(trophy.name);
      const isSelected = trophy.name === selectedName;
      const nameHtml = masked
        ? `<span class="spoiler-bar" role="img" aria-label="Story trophy tersembunyi oleh spoiler shield"></span>`
        : escapeHtml(trophy.name);
      const descHtml = masked ? "" : `<div class="row-desc">${escapeHtml(trophy.description || "")}</div>`;
      const tags = [
        `<span class="tag grade-${escapeHtml(trophy.grade)}"><span class="grade-dot"></span>${escapeHtml(trophy.grade)}</span>`,
        `<span class="tag kind-${escapeHtml(trophy.kind)}">${escapeHtml(trophy.kind)}</span>`,
      ];
      if (trophy.missable) tags.push(`<span class="tag missable">Missable</span>`);
      if (trophy.hidden) tags.push(`<span class="tag">Hidden</span>`);
      if (isEarned) tags.push(`<span class="tag earned-tag">Earned</span>`);
      return `<li class="trophy-row grade-${escapeHtml(trophy.grade)}${isEarned ? " earned" : ""}${isSelected ? " selected" : ""}" data-trophy="${escapeHtml(trophy.name)}" role="button" tabindex="0" aria-label="${escapeHtml(trophy.name)}">
        <input type="checkbox" data-earn="${escapeHtml(trophy.name)}" ${isEarned ? "checked" : ""} aria-label="Tandai ${escapeHtml(trophy.name)} sudah didapat">
        <div class="row-main">
          <div class="row-name">${nameHtml}${trophy.hidden && !masked ? ` <span class="hidden-tag">(hidden)</span>` : ""}</div>
          ${descHtml}
          <div class="row-meta">${tags.join("")}</div>
        </div>
      </li>`;
    })
    .join("");
}

/* ---------- tracker: trophy detail ---------- */

function renderMissableBox(trophy) {
  const box = trophy.missable_box;
  if (!box) return "";
  const text = typeof box === "string" ? box : box.text || "";
  const src = typeof box === "object" && box.src ? box.src : null;
  const srcHtml = src ? `<div class="step-src">Source: ${src.map((c) => `<span class="src-code">${escapeHtml(c)}</span>`).join("")}</div>` : "";
  return `<div class="missable-box"><h3>⚠ Missable — jangan lewatkan</h3><p>${escapeHtml(text)}</p>${srcHtml}</div>`;
}

function renderPointsOfNoReturn(trophy) {
  const points = trophy.points_of_no_return;
  if (!points || points.length === 0) return "";
  const items = points.map((point) => `<li>${escapeHtml(typeof point === "string" ? point : point.text || "")}</li>`).join("");
  return `<div class="pnr-box"><h3>Points of no return</h3><ul>${items}</ul></div>`;
}

export function renderTrophyDetail(container, trophy, data, state) {
  if (!trophy) {
    container.innerHTML = `<p class="empty-note">Pilih satu trophy di kiri untuk melihat panduan langkah demi langkah beserta sumbernya.</p>`;
    return;
  }
  const { earned, spoiler } = state;
  const masked = isSpoilerMasked(trophy, { spoiler, earned });
  const isEarned = earned.has(trophy.name);
  const nameHtml = masked ? `<span class="spoiler-bar" role="img" aria-label="Nama story trophy tersembunyi"></span>` : escapeHtml(trophy.name);
  const descHtml = masked
    ? `<p class="detail-desc">Nama &amp; deskripsi disembunyikan spoiler shield sampai trophy ini didapat.</p>`
    : `<p class="detail-desc">“${escapeHtml(trophy.description || "")}”</p>`;
  const flags = [
    `<span class="flag grade-${escapeHtml(trophy.grade)}">${escapeHtml(trophy.grade)}</span>`,
    `<span class="flag">${escapeHtml(trophy.kind)}</span>`,
    `<span class="flag stage">Roadmap stage ${trophy.roadmap_stage || "—"}</span>`,
  ];
  if (trophy.missable) flags.push(`<span class="flag missable">MISSABLE</span>`);
  if (trophy.hidden) flags.push(`<span class="flag hidden">HIDDEN</span>`);
  if (trophy.counts) flags.push(`<span class="flag count">Count: ${escapeHtml(String(trophy.counts))}</span>`);
  if (isEarned) flags.push(`<span class="flag">✓ Earned</span>`);
  const steps = (trophy.steps || [])
    .map(
      (step) =>
        `<li>${escapeHtml(step.text)}<div class="step-src">Source: ${renderSourceChips(step, data)}</div></li>`
    )
    .join("");
  const sourceNames = [...new Set((trophy.steps || []).flatMap((s) => s.src || []))]
    .map((code) => sourceLabel(code, new Map(data.sources.map((s) => [s.code, s]))))
    .join(", ");
  container.innerHTML = `
    <div class="detail-head"><h2>${nameHtml}</h2></div>
    ${descHtml}
    <div class="detail-flags">${flags.join("")}</div>
    <div class="detail-guide"><p>${escapeHtml(trophy.guide || "")}</p></div>
    ${renderMissableBox(trophy)}
    ${renderPointsOfNoReturn(trophy)}
    <ol class="steps">${steps}</ol>
    <p class="detail-foot">Sources for this trophy: ${escapeHtml(sourceNames || "official trophy list")}. Panduan ditulis dengan kata-kata sendiri; tiap langkah mengutip sumbernya.</p>`;
}

/* ---------- tracker: right rail ---------- */

export function renderProgressPane(state, data) {
  const { earned } = state;
  const total = data.trophies.length;
  const pct = total === 0 ? 0 : Math.round((earned.size / total) * 100);
  const bigEarned = document.getElementById("big-earned");
  if (bigEarned) bigEarned.textContent = String(earned.size);
  const progressText = document.getElementById("progress-text");
  if (progressText) progressText.textContent = `${earned.size} / ${total} earned`;
  const progressPct = document.getElementById("progress-pct");
  if (progressPct) progressPct.textContent = `${pct}%`;
  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = `${pct}%`;
  const bar = document.getElementById("progress-bar");
  if (bar) {
    bar.setAttribute("aria-valuenow", String(earned.size));
    bar.setAttribute("aria-valuemax", String(total));
  }
  const breakdown = document.getElementById("grade-breakdown");
  if (breakdown) {
    const grades = ["platinum", "gold", "silver", "bronze"];
    breakdown.innerHTML = grades
      .map((grade) => {
        const all = data.trophies.filter((t) => t.grade === grade);
        const done = all.filter((t) => earned.has(t.name)).length;
        return `<div class="grade-line"><span class="grade-name"><span class="grade-dot grade-${grade}"></span>${grade}</span><span>${done} / ${all.length}</span></div>`;
      })
      .join("");
  }
  const miniRoadmap = document.getElementById("mini-roadmap-list");
  if (miniRoadmap) {
    miniRoadmap.innerHTML = (data.panels.roadmap || [])
      .map((stage) => {
        const stageTrophies = data.trophies.filter((t) => t.roadmap_stage === stage.stage);
        const done = stageTrophies.filter((t) => earned.has(t.name)).length;
        const complete = stageTrophies.length > 0 && done === stageTrophies.length;
        return `<li><span>Stage ${stage.stage} — ${escapeHtml(stage.title)}</span><span class="${complete ? "stage-done" : ""}">${done}/${stageTrophies.length}</span></li>`;
      })
      .join("");
  }
}

/* ---------- roadmap view ---------- */

export function renderRoadmapView(container, data, state, onSelectTrophy) {
  const { earned } = state;
  const stages = (data.panels.roadmap || [])
    .map((stage) => {
      const stageTrophies = data.trophies.filter((t) => t.roadmap_stage === stage.stage);
      const chips = stageTrophies
        .map(
          (t) =>
            `<button type="button" data-trophy-jump="${escapeHtml(t.name)}" class="${earned.has(t.name) ? "earned" : ""}">${escapeHtml(t.name)}${earned.has(t.name) ? " ✓" : ""}</button>`
        )
        .join("");
      return `<div class="stage-card">
        <h3>Stage ${stage.stage} — ${escapeHtml(stage.title)}</h3>
        <p class="stage-meta">${escapeHtml(stage.time || "")} &middot; ${stageTrophies.length} trophies</p>
        ${renderClaimList(stage.claims, data)}
        <div class="stage-trophies">${chips}</div>
      </div>`;
    })
    .join("");
  const grid = (data.panels.missables.grid || [])
    .map((row) => {
      const items = (row.items || [])
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.trophy)}</strong> — ${escapeHtml(item.text)} <span class="tag ${item.risk === "missable" ? "missable" : ""}">${escapeHtml(item.risk || "")}</span><div class="step-src">Source: ${renderSourceChips(item, data)}</div></li>`
        )
        .join("");
      return `<div class="panel-card"><h3>${escapeHtml(row.chapter)}</h3><ul class="claim-list">${items}</ul></div>`;
    })
    .join("");
  container.innerHTML = `<div class="page">
    <h2>Roadmap to Platinum</h2>
    <p class="page-intro">Tujuh tahap dari awal cerita sampai platinum "Vice Got a Price!". Dibangun dari deskripsi resmi trophy: chapter &amp; misi story, collectible dan jumlahnya, dalam urutan yang benar. Klik nama trophy untuk membuka panduannya.</p>
    ${stages}
    <h2>Missables by Chapter</h2>
    <p class="page-intro">Satu trophy missable dan momen yang tidak bisa diulang — plus strategi save di bawahnya.</p>
    ${grid}
    <div class="panel-card"><h3>Save strategy</h3>${renderClaimList(data.panels.missables.save_strategy, data)}</div>
    <div class="panel-card"><h3>Launch status</h3>${renderClaimList(data.panels.launch_status, data)}</div>
  </div>`;
  container.querySelectorAll("[data-trophy-jump]").forEach((button) => {
    button.addEventListener("click", () => onSelectTrophy(button.getAttribute("data-trophy-jump")));
  });
}

/* ---------- glitch & farming view ---------- */

export function renderGlitchView(container, data) {
  const glitch = data.panels.glitch;
  const disputes = (data.panels.disputes || [])
    .map((dispute) => {
      const pro = renderClaimList(dispute.pro, data);
      const con = renderClaimList(dispute.con, data);
      return `<div class="panel-card dispute-card">
        <h3>${escapeHtml(dispute.topic)}</h3>
        <p class="verdict">Status: ${escapeHtml(dispute.status)}</p>
        <h4>Yang mendukung</h4>${pro}
        <h4>Yang meragukan</h4>${con}
      </div>`;
    })
    .join("");
  const warnings = (data.panels.warnings || [])
    .map(
      (warning) =>
        `<div class="panel-card warning-card"><h3>⚠ Peringatan</h3><p>${escapeHtml(warning.text)}</p><div class="step-src">Source: ${renderSourceChips(warning, data)}</div></div>`
    )
    .join("");
  container.innerHTML = `<div class="page">
    <h2>Glitch &amp; Farming</h2>
    <p class="page-intro">Glitch uang Apollo Aggregates masih berstatus <strong>${escapeHtml(glitch.status)}</strong> — diperdebatkan, belum terkonfirmasi. Halaman ini menunjukkan kedua sisi bukti, plus cara farming yang legal dan peringatan anti-phishing.</p>
    <div class="panel-card dispute-card">
      <h3>Apollo Aggregates money glitch — ${escapeHtml(glitch.status)}</h3>
      ${renderClaimList(glitch.claims, data)}
      <h4>Yang mendukung</h4>${renderClaimList(glitch.pro, data)}
      <h4>Yang meragukan</h4>${renderClaimList(glitch.con, data)}
      <p><strong>${escapeHtml(glitch.warning || "")}</strong></p>
    </div>
    <h2>Disputed Claims</h2>
    ${disputes}
    <h2>Farming — cara legal</h2>
    <div class="panel-card">${renderClaimList(data.panels.farming, data)}</div>
    <h2>Warnings</h2>
    ${warnings}
  </div>`;
}

/* ---------- easter eggs view ---------- */

export function renderEggsView(container, data, state) {
  const filter = state.eggFilter || "all";
  const counts = {
    all: data.eggs.length,
    egg: data.eggs.filter((e) => e.category === "egg").length,
    bug: data.eggs.filter((e) => e.category === "bug").length,
    oddity: data.eggs.filter((e) => e.category === "oddity").length,
  };
  const shown = filter === "all" ? data.eggs : data.eggs.filter((e) => e.category === filter);
  const cards = shown
    .map(
      (egg) => `<div class="egg-card">
        <div class="egg-badges">
          <span class="tag kind-${egg.category === "egg" ? "collectibles" : egg.category === "bug" ? "crime" : "activities"}">${escapeHtml(egg.category)}</span>
          <span class="tag ${egg.status === "disputed" ? "missable" : ""}">${escapeHtml(egg.status)}</span>
        </div>
        <h3>${escapeHtml(egg.title)}</h3>
        <p>${escapeHtml(egg.text)}</p>
        <div class="step-src">Source: ${renderSourceChips(egg, data)}</div>
      </div>`
    )
    .join("");
  container.innerHTML = `<div class="page">
    <h2>Easter Eggs, Bugs &amp; Oddities</h2>
    <p class="page-intro">${data.eggs.length} item di Leonida — telur paskah, bug, dan keanehan. Tiap item mengutip sumbernya; status "disputed" berarti klaimnya masih diperdebatkan.</p>
    <div class="egg-filter-row" role="group" aria-label="Filter easter eggs">
      ${["all", "egg", "bug", "oddity"].map((kind) => `<button type="button" class="chip ${filter === kind ? "active" : ""}" data-egg-filter="${kind}">${kind === "all" ? "All" : kind} (${counts[kind]})</button>`).join("")}
    </div>
    <div class="egg-grid">${cards}</div>
  </div>`;
  container.querySelectorAll("[data-egg-filter]").forEach((button) => {
    button.addEventListener("click", () => state.onEggFilter(button.getAttribute("data-egg-filter")));
  });
}
