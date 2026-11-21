// All rendering. No network calls here — only DOM built from the local JSON data.
import { GRADE_LABEL, KIND_LABEL, VERIFIED_LABEL, OVERLAP_LABEL } from './data.js';
import { isEarned, getCount } from './store.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

function badge(text, cls) {
  return el('span', 'badge ' + (cls || ''), text);
}

export function spoilerMasked(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && trophy.id !== 1 && !isEarned(state, trophy.id);
}

export function renderHeader(trophies, state, meta) {
  const earned = trophies.filter((t) => isEarned(state, t.id)).length;
  document.getElementById('progressBig').textContent = `${earned} / ${trophies.length} earned`;
  document.getElementById('progressFill').style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  document.getElementById('progressSub').textContent =
    `Platinum progress: ${Math.round((earned / trophies.length) * 100)}% — ${meta.verified_count}. 0 online trophies.`;
  document.getElementById('headerFacts').textContent =
    '55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze · 28 hidden · Xbox 1,000G · ' + meta.rarity_note;
}

export function renderList(container, trophies, state, onSelect, onToggle, selectedId) {
  container.replaceChildren();
  for (const t of trophies) {
    const earned = isEarned(state, t.id);
    const masked = spoilerMasked(t, state);
    const row = el('div', 'trophy' + (earned ? ' earned' : '') + (t.id === selectedId ? ' selected' : ''));
    row.setAttribute('role', 'listitem');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('click', (ev) => ev.stopPropagation());
    box.addEventListener('change', (ev) => { ev.stopPropagation(); onToggle(t.id); });
    row.append(box);
    const body = el('div');
    body.append(el('div', 'tname', masked ? 'Hidden story trophy' : t.name));
    body.append(el('div', 'tdesc', masked ? 'Spoiler guard is on — tick this trophy earned to reveal its name and guide.' : t.description));
    const meta = el('div', 'meta');
    meta.append(badge(GRADE_LABEL[t.grade], t.grade));
    meta.append(badge(KIND_LABEL[t.kind] || t.kind));
    if (t.hidden === true) meta.append(badge('Hidden'));
    if (t.hidden === 'unverified') meta.append(badge('Hidden? — unverified'));
    if (t.missable) meta.append(badge('MISSABLE', 'miss'));
    meta.append(badge(VERIFIED_LABEL[t.verified], 'verified-' + t.verified));
    meta.append(badge(OVERLAP_LABEL[t.overlap], 'overlap-' + t.overlap));
    if (t.counts) meta.append(badge(`${getCount(state, t.id)}/${t.counts.target} ${t.counts.label}`));
    body.append(meta);
    if (t.counts) {
      const bar = el('div', 'count-bar');
      const fill = el('div');
      fill.style.width = `${Math.min(100, Math.round((getCount(state, t.id) / t.counts.target) * 100))}%`;
      bar.append(fill);
      body.append(bar);
    }
    row.append(body);
    row.addEventListener('click', () => onSelect(t.id));
    container.append(row);
  }
}

export function renderDetail(container, trophy, state, panels, onCount, onToggle) {
  container.replaceChildren();
  if (!trophy) {
    container.append(el('p', 'muted', 'Click a trophy to see its full guide, sources, and count tracker.'));
    return;
  }
  const earned = isEarned(state, trophy.id);
  const masked = spoilerMasked(trophy, state);
  container.append(el('h2', null, masked ? 'Hidden story trophy' : trophy.name));
  const meta = el('div', 'meta');
  meta.append(badge(GRADE_LABEL[trophy.grade], trophy.grade));
  meta.append(badge(KIND_LABEL[trophy.kind] || trophy.kind));
  meta.append(badge(VERIFIED_LABEL[trophy.verified], 'verified-' + trophy.verified));
  meta.append(badge(OVERLAP_LABEL[trophy.overlap], 'overlap-' + trophy.overlap));
  if (trophy.hidden === true) meta.append(badge('Hidden'));
  if (trophy.hidden === 'unverified') meta.append(badge('Hidden? — unverified'));
  if (trophy.missable) meta.append(badge('MISSABLE — do it in Chapter 1', 'miss'));
  container.append(meta);
  container.append(el('p', null, masked ? 'Spoiler guard is on. This is a story trophy you have not earned yet.' : trophy.description));
  if (masked) {
    container.append(el('p', 'muted', 'Its guide steps stay hidden until you tick this trophy earned — that is the point of the guard.'));
    const toggle0 = document.createElement('button');
    toggle0.type = 'button';
    toggle0.textContent = 'Mark as earned (reveals the guide)';
    toggle0.addEventListener('click', () => onToggle(trophy.id));
    container.append(toggle0);
    return;
  }
  if (trophy.counts) {
    const wrap = el('div', 'count-input');
    wrap.append(el('span', null, `${trophy.counts.label}: `));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.counts.total);
    input.value = String(getCount(state, trophy.id));
    input.setAttribute('aria-label', trophy.counts.label);
    input.addEventListener('change', () => onCount(trophy.id, input.value));
    wrap.append(input);
    wrap.append(el('span', 'muted', `of ${trophy.counts.target} needed (world total ${trophy.counts.total})`));
    container.append(wrap);
  }
  const ol = document.createElement('ol');
  for (const step of trophy.steps) {
    ol.append(el('li', null, step));
  }
  container.append(ol);
  const src = el('div', 'src');
  src.append(el('strong', null, 'Sources: '));
  for (const s of trophy.sources) {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    src.append(a);
  }
  container.append(src);
  const rel = panels.disagreements.filter((d) => d.title.toLowerCase().includes(trophy.name.toLowerCase().split(' ')[0]));
  void rel;
  if (trophy.id === 47 || trophy.id === 49 || trophy.id === 41 || trophy.id === 26 || trophy.id === 50 || trophy.id === 51) {
    const hit = panels.disagreements.find((d) =>
      (trophy.id === 47 && d.title.startsWith('Personal Best')) ||
      (trophy.id === 49 && d.title.startsWith('Bad Luck')) ||
      (trophy.id === 41 && d.title.startsWith('A Classic')) ||
      (trophy.id === 26 && d.title.startsWith('Chapter 1 balcony')) ||
      (trophy.id === 50 && d.title.startsWith('The Truth')) ||
      (trophy.id === 51 && d.title.startsWith('Ten Pin')));
    if (hit) {
      const box = el('div', 'disagree');
      box.append(el('h4', null, 'Disagreement: ' + hit.title));
      box.append(el('p', null, 'Side A — ' + hit.side_a));
      box.append(el('p', null, 'Side B — ' + hit.side_b));
      box.append(el('p', 'verdict', 'Verdict: ' + hit.verdict));
      container.append(box);
    }
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => onToggle(trophy.id));
  container.append(toggle);
}

export function renderRoadmap(panels, trophies, state) {
  const list = document.getElementById('roadmapList');
  list.replaceChildren();
  for (const stage of panels.roadmap) {
    const done = stage.trophies.every((id) => isEarned(state, id));
    const li = el('li', done ? 'done' : '');
    const h = el('h3');
    h.append(el('span', 'stageno', `Stage ${stage.stage} — `));
    h.append(document.createTextNode(stage.title));
    li.append(h);
    li.append(el('div', 'stage-meta', `About ${stage.time} · ${stage.trophies.length} trophies · ${done ? 'DONE' : 'not done yet'}`));
    li.append(el('p', null, stage.body));
    list.append(li);
  }
  const doneStages = panels.roadmap.filter((s) => s.trophies.every((id) => isEarned(state, id))).length;
  document.getElementById('roadmapProgress').textContent =
    `Roadmap: ${doneStages} of ${panels.roadmap.length} stages fully done.`;
  const box = document.getElementById('overlapBox');
  box.replaceChildren();
  box.append(el('p', null, 'Auto with 100% — ' + panels.overlap100.auto));
  box.append(el('p', null, 'Partly — ' + panels.overlap100.partial));
  box.append(el('p', null, 'Separate from 100% — ' + panels.overlap100.separate));
}

export function renderMissables(panels) {
  const grid = document.getElementById('missGrid');
  grid.replaceChildren();
  for (const cell of panels.missable_grid) {
    const high = cell.risk === 'HIGH';
    const d = el('div', 'miss-cell ' + (high ? 'high' : 'safe'));
    d.append(el('div', 'risk', high ? 'HIGH RISK' : 'SAFE'));
    d.append(el('h3', null, cell.chapter));
    d.append(el('p', null, cell.note));
    grid.append(d);
  }
  const save = document.getElementById('saveStrategy');
  save.replaceChildren();
  save.append(el('strong', null, panels.save_strategy.title + ' — '));
  save.append(document.createTextNode(panels.save_strategy.body));
  const warn = document.getElementById('warningsBox');
  warn.replaceChildren();
  for (const w of panels.warnings) {
    const box = el('div', 'disagree');
    box.append(el('h4', null, w.title));
    box.append(el('p', null, w.body));
    warn.append(box);
  }
}

export function renderGlitch(panels) {
  document.getElementById('glitchStatus').textContent =
    'Apollo Aggregates money glitch: ' + panels.glitch_farming.status +
    ' Use the legit bank-vault route for guaranteed money.';
  const list = document.getElementById('glitchList');
  list.replaceChildren();
  for (const item of panels.glitch_farming.items) {
    const box = el('div', 'glitch-item');
    box.append(el('h4', null, item.title));
    box.append(el('p', null, item.body));
    if (item.pro) box.append(el('p', null, 'For — ' + item.pro));
    if (item.contra) box.append(el('p', null, 'Against — ' + item.contra));
    list.append(box);
  }
  const dis = document.getElementById('disagreeList');
  dis.replaceChildren();
  for (const d of panels.disagreements) {
    const box = el('div', 'disagree');
    box.append(el('h4', null, d.title));
    box.append(el('p', null, 'Side A — ' + d.side_a));
    box.append(el('p', null, 'Side B — ' + d.side_b));
    box.append(el('p', 'verdict', 'Verdict: ' + d.verdict));
    dis.append(box);
  }
  const launch = document.getElementById('launchList');
  launch.replaceChildren();
  for (const item of panels.launch_status.items) launch.append(el('li', null, item));
}

const EGG_LABEL = { 'easter-egg': 'Easter Egg', bug: 'Bug', weird: 'Hal Aneh' };
const STATUS_LABEL = { confirmed: 'Confirmed', reported: 'Reported', disputed: 'Disputed' };

export function renderEggs(items) {
  const list = document.getElementById('eggList');
  list.replaceChildren();
  document.getElementById('eggCount').textContent = `${items.length} items shown.`;
  for (const it of items) {
    const card = el('div', 'egg');
    const h = el('h4');
    h.append(document.createTextNode(`${it.id} — ${it.name} `));
    h.append(badge(STATUS_LABEL[it.status], 'verified-' + it.status));
    card.append(h);
    card.append(el('div', null, EGG_LABEL[it.category] || it.category));
    card.append(el('div', 'loc', it.location));
    card.append(el('p', null, it.description));
    if (it.reference) card.append(el('p', 'muted', 'Reference: ' + it.reference));
    if (it.theory) card.append(el('div', 'theory', it.theory));
    const src = el('div', 'src', 'Sources: ');
    it.sources.forEach((s, i) => {
      if (i > 0) src.append(document.createTextNode(' · '));
      if (s.url) {
        const a = document.createElement('a');
        a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.name;
        src.append(a);
      } else {
        src.append(document.createTextNode(s.name));
      }
    });
    card.append(src);
    list.append(card);
  }
}

export function renderSources(panels) {
  const ul = document.getElementById('sourcesList');
  ul.replaceChildren();
  for (const s of panels.sources_index) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
}
