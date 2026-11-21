[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker

An offline web app that guides you to the GTA VI platinum: all **55 trophies** with
cited step-by-step guides, a localStorage checklist with count trackers, a 7-stage
roadmap, a missables grid, glitch & farming panels, disagreement panels, a trophy ↔
100%-checklist mapping, and a full **Easter Eggs, Bugs & Hal Aneh** section (86 items).

## Honest numbers

- **54 of 55 unlock methods confirmed.** The one exception is **Ten Pin**, whose
  exact steps are still unverified — this guide shows its best lead and refuses to
  invent steps.
- **Only 1 trophy is missable: Positive Mental Attitude** (the Chapter 1 balcony
  meditation). Everything else can be finished in free roam after the story.
- **4 trophies solved on the night of 20 Nov** (Bad Luck, I Guess; The Truth Is Out
  There; In The Beginning…; Capital Offense) — shown here as solved, with sources.
- **Money glitch disputed:** Apollo Aggregates warehouse, 2 sources for vs 2 against.
  Shown with both sides, labelled REPORTED, plus the legit bank-vault route.
- **0 online trophies. 28 hidden** (12 story + 16 non-story; 1 non-story slot is
  still unidentified — Catch Me If You Can or Challenging Tank, marked unverified).
- Rarity: Exophase, 20 Nov 2026 (early player base, floor 0.01%). Xbox total 1,000G.

## What is inside

- `app/index.html` + `app/style.css` + `app/js/` (ES modules, no libraries, no network)
- `app/data/trophies.json` — 55 trophies: official name + description, grade, hidden
  flag, kind, missable flag, roadmap stage, verification status, 100% overlap,
  count target, steps in our own words, and a source link next to every guide.
- `app/data/panels.json` — 7-stage roadmap, 10 disagreement panels, glitch & farming,
  launch status, save strategy, warnings (Irredeemable is permanent; cheats disable
  trophies and saving; no mission replay).
- `app/data/easter-eggs.json` — 32 confirmed + 13 reported + 6 disputed easter eggs,
  7 confirmed + 13 reported + 4 disputed bugs, 3 confirmed + 8 reported weird items,
  each with a verification status and at least one source. Includes the Mandy mystery
  (clues confirmed, "psychopath" theory labelled as community theory, not fact).
- `screenshots/` — 4 screenshots rendered from the app itself (1280×800).

## Features

- Checklist with progress bar (X/55), filters (kind, grade, earned/unearned,
  missable-only, hidden-only, text search), and a spoiler guard that hides story
  trophy names + descriptions until earned (default ON).
- Count trackers with manual input for every numbered trophy (250 stunts, 42 shooting
  range golds, 100 WAiNK scans, 18 meditations, 500 profile actions, …).
- Next Up planner: the closest unearned trophies, by count progress and roadmap stage.
- Export/import progress as JSON; everything is stored in localStorage.
- Easter Eggs / Bugs / Hal Aneh section with category + status filters and search.

## Run it

Open `app/index.html` in a browser, or serve the folder locally. No build step, no
network requests — every file comes from `app/`.

## Sources

PowerPyx, Exophase, GameSpot, damnmodz, gamemapa, PushSquare, KeeNgamer,
allblogthings, afleurdenet, vanotherlevel, dlcompare, ofzenandcomputing,
insider-gaming, OutputLag, Game8, GTAVibes, GTA6-Life, GTA6VCity, BuzzFeed, Beebom,
Games.gg. Full list with links: `app/data/panels.json` (`sources_index`), and next
to every trophy guide in the app.

An unofficial fan guide. GTA VI, Grand Theft Auto and Rockstar are trademarks of
their owners. No Rockstar logo, artwork, box art or game screenshots are used.
