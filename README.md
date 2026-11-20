[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every official name, description and grade as PlayStation publishes them, a guide in our own words for each one with its sources named beside it, and a checklist that saves your progress in the browser.

## What it does

- **Checklist tracker** — tick trophies as they pop; progress, counts and notes save to localStorage and survive a reload. Count trophies (250 stunts, 42 gold shooting-range medals, 100 WAiNK scans…) get a number input with their target.
- **Filters** — search by name or description, and filter by kind (story, collectibles, activities, crime), grade, and status (earned, not earned, missable, hidden).
- **Spoiler guard** — while it is on, unearned story trophies hide their names and descriptions behind “Hidden — spoiler disembunyikan” until you earn them.
- **7-stage roadmap to the platinum** — story first, then stranger questlines, partner crimes, activities, collections, robberies, and the 100% cleanup last, with a time estimate and per-stage progress for each stage.
- **Missables** — only one trophy can ever be missed (Positive Mental Attitude, the Chapter 1 balcony meditation), shown on a per-chapter grid with the save strategy that protects it.
- **Glitch & farming, honestly labelled** — the Apollo Aggregates money glitch is shown as REPORTED with two sources for and two against, a phishing warning, and legitimate alternatives, plus honest farming (bank vaults, Focus farm, train tunnel escape).
- **Launch status** — day-one patches, the PSN outage, zero glitched trophies, and the warnings that can save a platinum run (Irredeemable is permanent, cheats disable trophies and saving, no mission replay).
- **Next Up planner** — your nearest unearned trophies first, ordered by roadmap stage and then by how little is left to do.
- **Export / import / reset** — download your progress as JSON, restore it later, or start over. Nothing leaves your browser.
- **Honesty panels** — 12 disagreement panels show both sides wherever sources contradict each other. 54 of 55 unlock methods are confirmed by at least one trusted source; Ten Pin is still unverified and is shown as Unknown rather than guessed.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. The app is plain static files under `app/` — any static server works, and it runs with the network off: it fetches only its own `data/trophies.json` and `data/panels.json` by relative path.

## Screenshots

`screenshots/` holds 4 renders of the app itself (see `shots.json` for what each one shows and how it was set up): the checklist with a cited guide open, the roadmap and missable grid, the glitch panel with both sides of the dispute, and the spoiler guard plus Next Up planner.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Notes

- No Rockstar Games logo, official artwork, box art or game screenshots are used anywhere — the look is our own.
- Every guide step names its source beside it (PowerPyx, Exophase, GameSpot, damnmodz, gamemapa, PushSquare, KeeNgamer, and others); no guide text is copied from another guide. Official trophy names and descriptions are shown as PlayStation publishes them.
- Research as of 21 Nov 2026, 00:30 WIB — one day after launch, so some claims are still labelled reported or unknown rather than confirmed.

<sub>Entered on [make.fun](https://make.fun/?ref=cvw0cfes&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
