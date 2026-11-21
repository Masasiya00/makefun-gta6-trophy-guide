[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker: 703/703 claims cited (100%), 696 on 2+ sites, 59 sources, 12 disputes, audit strip, spoiler shield, export/import

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver, 46 bronze. Every trophy shows its official name, description and grade exactly as PlayStation publishes them, plus a step-by-step guide written in our own words that cites its sources on every step. 54 of 55 unlock methods are confirmed; one (Ten Pin) is honestly marked unknown, with its best lead shown instead of a made-up answer.

## What it does

- **Tracker** — a checklist of all 55 trophies with progress saved in the browser (localStorage), plus **export to JSON and import back**. Progress bar, grade breakdown, and a **Next Up** list in roadmap order.
- **Filters** — by kind (Story, Missable, Collectibles, Activities, Crime, Hidden), by grade, and free-text search.
- **Spoiler shield** — masks the names and descriptions of story trophies until they are earned (on by default).
- **Roadmap to Platinum** — 7 stages from the first story chapter to the platinum, built from the official trophy descriptions, with the one missable trophy flagged per chapter and a save strategy (no mission replay exists, so chapter saves are the only safety net).
- **Cited guidance** — 703 of 703 claims cite a source (100%), 696 cite two or more sites, across 59 sources and 70 pages. Every guide step shows its source names, and the header carries a live **audit strip** computed from the data files.
- **Disputes** — 12 panels showing both sides where sources disagree (for example the Apollo Aggregates money glitch, Personal Best, and Bad Luck, I Guess), each side cited.
- **Glitch & Farming** — the Apollo Aggregates money glitch is marked **REPORTED / disputed**, with the evidence for and against, plus legal farming routes and anti-phishing warnings.
- **Easter Eggs** — 86 eggs, bugs and oddities across Leonida, each cited on 2+ sources, with confirmed / reported / disputed status.
- **Offline** — static files under `app/`, no build step, no network request at run time. Serve `app/` with any static server and open `index.html`.

## Numbers (computed live from the data files)

- Claims: **703 total, 703 cited (100%), 696 on 2+ sources**
  (494 trophy steps + 123 panel claims + 86 easter eggs)
- Sources: **59 sources, 70 pages**
- Trophies: **55** (1 platinum, 2 gold, 6 silver, 46 bronze)
- Verification: **52 confirmed, 2 reported, 1 unknown** (Ten Pin — best lead shown, no guessing)
- Missable: **1** (Positive Mental Attitude — the Chapter 1 balcony meditation)
- Disputes: **12 panels**, each showing both sides with sources
- Hidden: 28 per the official list. Our data flags 29 trophies as hidden — one flag (Catch Me If You Can or Challenging Tank) is unverified, and the guide says so rather than guessing which one.

## How to run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or open `app/index.html` directly from any static file server. No build step, no install, no network. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` via the kit's `vendor/makefun-frontend.ts`.

## Sources

All guide steps, panel claims and easter eggs cite their sources by name, with links in the app's Sources page: PowerPyx, Exophase, GameSpot, damnmodz, gamemapa, PushSquare, KeeNgamer, and 52 more. Trophy names and descriptions are the official ones; all guide text is our own writing. No Rockstar logo, artwork, box art, or game screenshots are used anywhere.
