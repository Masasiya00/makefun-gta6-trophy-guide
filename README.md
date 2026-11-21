[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker: 703/703 claims cited (100%), 650 on 2+ sites, 59 sources, audit strip, spoiler shield, export/import

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden. Every trophy shows its official name, description and grade as PlayStation publishes them, plus a step-by-step guide in our own words that cites its sources on every step.

## What it does

- **Tracker** — a checklist of all 55 trophies, progress saved in the browser (localStorage), with **export to JSON and import back**. Progress bar, grade breakdown (platinum/gold/silver/bronze), and a **Next Up** list in roadmap order.
- **Filters** — by kind (Story, Missable, Collectibles, Activities, Crime, Hidden), by grade, and free-text search.
- **Spoiler shield** — masks the names and descriptions of story and hidden trophies until they are earned.
- **Roadmap to Platinum** — 7 stages from the first story chapter to the platinum, built from the official trophy descriptions, with the missable trophy flagged per chapter and a save strategy.
- **Cited guidance** — 703 of 703 claims cite a source (100%), 650 cite two or more sites, across 59 sources. Every guide step shows its source names (for example "Source: PowerPyx"), and the header carries a live **audit strip** computed from the data: "703/703 claims cited (100%), 650 on 2+ sites, 59 sources".
- **Glitch & Farming** — the Apollo Aggregates money glitch is marked **REPORTED / disputed**, with the evidence for and against, plus legal farming routes and anti-phishing warnings.
- **Easter Eggs** — 86 eggs, bugs and oddities across Leonida, each cited, with confirmed / reported / disputed status.
- **Offline** — static files under `app/`, no build step, no network request at run time. Serve `app/` with any static server and open `index.html`.

## Numbers (computed live from the data files)

| | |
|---|---|
| Trophies | 55 (1 platinum, 2 gold, 6 silver, 46 bronze) |
| Guide steps | 494, all cited, 493 on 2+ sites |
| Total claims (steps + roadmap + panels + eggs) | 703 |
| Claims cited | 703 (100%) |
| Claims on 2+ sites | 650 |
| Sources | 59 |
| Easter eggs | 86 (51 eggs, 24 bugs, 11 oddities) |
| Online trophies | 0 |

All 703 claims are cited, including the 13 missable-grid rows, each now pinned to its source pages.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or open `app/index.html` from any static file server. Screenshots are deterministic: `?shot=01-cover`, `?shot=02-roadmap`, `?shot=03-glitch`, `?shot=04-spoiler` seed the same demo state (in memory only, never in localStorage).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged).

## License

MIT — see `LICENSE`. Not affiliated with Rockstar Games; no Rockstar logo or official artwork is used.
