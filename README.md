[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker: 703/703 claims cited (100%), 696 on 2+ sites, 59 sources, 12 disputes, audit strip, spoiler shield, export/import

A fully offline companion for hunting every **55 PlayStation 5 trophy** in Grand Theft Auto VI:
1 platinum, 2 gold, 6 silver, 46 bronze. Each trophy keeps its official PlayStation name,
description and grade word for word, and adds a step-by-step walkthrough written from
scratch that puts a citation next to every single step. 54 of 55 unlock routes are
confirmed; one (Ten Pin) is openly labelled unknown, showing its strongest lead rather
than inventing an answer.

## What you get

- **Tracker** — tick off all 55 trophies; progress persists in the browser
  (localStorage), and you can **export it to JSON and import it back**. A progress bar,
  a grade breakdown, and a **Next Up** queue ordered by the roadmap.
- **Filters** — narrow by kind (Story, Missable, Collectibles, Activities, Crime, Hidden),
  by grade, by earned/unearned, plus free-text search.
- **Spoiler shield** — story trophy names and descriptions stay masked until earned
  (switched on out of the box).
- **Roadmap to Platinum** — 7 stages from the opening story chapter to the platinum,
  assembled from the official trophy blurbs, flagging the one missable trophy in each
  chapter and a save plan (there is no mission replay, so chapter saves are the only
  safety net).
- **Cited guidance** — 703 of 703 claims carry a citation (100%), 696 point at two or
  more sites, spread across 59 sources and 70 pages. Every guide step displays its
  source names, and the header shows a live **audit strip** tallied from the data files.
- **Disputes** — 12 panels laying out both sides wherever sources clash (for instance the
  Apollo Aggregates money glitch, Personal Best, and Bad Luck, I Guess), each side cited.
- **Glitch & Farming** — the Apollo Aggregates money glitch is flagged **REPORTED / disputed**,
  with the case for and against, alongside legitimate farming routes and anti-phishing warnings.
- **Easter Eggs** — 86 eggs, bugs and oddities scattered across Leonida, each cited on 2+
  sources, labelled confirmed / reported / disputed.
- **Offline** — plain static files under `app/`, no build step, no network call while
  running. Serve `app/` from any static server and open `index.html`.

## The numbers (tallied live from the data files)

- Claims: **703 total, 703 cited (100%), 696 on 2+ sources**
  (494 trophy steps + 123 panel claims + 86 easter eggs)
- Sources: **59 sources, 70 pages**
- Trophies: **55** (1 platinum, 2 gold, 6 silver, 46 bronze)
- Verification: **52 confirmed, 2 reported, 1 unknown** (Ten Pin — best lead shown, no guessing)
- Missable: **1** (Positive Mental Attitude — the Chapter 1 balcony meditation)
- Disputes: **12 panels**, each showing both sides with sources
- Hidden: 28 on the official list. Our data marks 29 trophies as hidden — one flag
  (Catch Me If You Can or Challenging Tank) is unverified, and the guide admits that
  instead of guessing which one.

## Running it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or open `app/index.html` straight from any static file server. No build step, no install,
no network. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output folder and writes `dossier.json` using the kit's `vendor/makefun-frontend.ts`.

## Where the facts come from

Every guide step, panel claim and easter egg names its sources, with links on the
app's Sources page: PowerPyx, Exophase, GameSpot, damnmodz, gamemapa, PushSquare, KeeNgamer,
and 52 more. Trophy names and descriptions are the official ones; all guide prose is
written fresh for this guide. No Rockstar logo, artwork, box art, or game screenshots
appear anywhere.
