# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand
Theft Auto VI: official names, descriptions and grades as PlayStation
publishes them, a guide in our own words for each trophy with its sources
cited beside every step (93 cited steps, 16 backed by 2+ sources), a
7-stage roadmap to the platinum, the game's one missable trophy flagged,
a saved checklist with export/import, kind filters, text search, and a
spoiler-safe mode that hides story trophies until they are earned. Plus a
glitch & farming panel (the Apollo Aggregates money glitch, shown as
DISPUTED with both sides) and 86 easter eggs, bugs and oddities with
verification statuses.

Research: 20–21 Nov 2026. 54 of 55 trophies confirmed; only Ten Pin is
still unverified. There are no online trophies. The app is static files
under `app/` — no build step, no network at runtime, works with the
network off.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot modes: add `?shot=cover`, `?shot=roadmap`, `?shot=glitch`
or `?shot=spoiler` to the URL.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/dossier.json from app/ + screenshots/
```

Unofficial fan guide. Not affiliated with Rockstar Games. No Rockstar
logo, artwork, or game screenshots are used.
