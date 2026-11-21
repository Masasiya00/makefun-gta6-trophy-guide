[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

# LEONIDA PLATINUM ATLAS

An offline GTA VI trophy guide and tracker for PlayStation 5: all **55 official trophies** (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; **0 online trophies**), each with a guide written in our own words and its sources cited beside it, plus a full **Easter Eggs, Bugs & Hal Aneh** section (86 items, each with a verification status).

## What it does

- **Checklist tracker** — tick trophies off, progress saves in `localStorage`, export/import as JSON. Count inputs for every counted trophy (250 stunts, 42 shooting-range golds, 100 WAiNK scans, 18 meditations, and more).
- **Filters** — by kind (story, missable, collectibles, activities, crime, strangers), grade, hidden, earned/remaining, and free-text search.
- **Spoiler setting** — hides the names and descriptions of story trophies you have not earned yet (default ON). Steps and sources stay hidden with them.
- **Roadmap** — 7 stages from the first mission to the platinum, with a per-chapter missable grid.
- **Missables** — only one trophy can be missed: *Positive Mental Attitude* (the Chapter 1 balcony meditation). Everything else can be finished after the story in free-roam.
- **Next Up planner** — the closest unearned trophy, based on your progress.
- **Honest verification** — 52 trophies confirmed by 2+ sources, 2 reported, 1 honestly unknown (*Ten Pin* — best lead: a melee drive-by kick from a motorcycle; no source has proven the exact steps yet).
- **Solved "unknown" trophies** — *Bad Luck, I Guess*, *The Truth Is Out There*, *In The Beginning…* and *Capital Offense* were only solved on the night of 20 Nov 2026; this guide has all four with steps and sources.
- **Disagreement panels** — where sources contradict each other (Personal Best, Bad Luck Chapter 2 vs 3, the Apollo Aggregates money glitch, the alien-lab keypad code), both sides are shown.
- **Glitch & Farming** — the Apollo Aggregates warehouse money glitch is labelled **REPORTED, 2 sources for vs 2 against, may be patched any time**, with legit money routes (bank vaults up to $205,000) as the alternative.
- **Warnings that save a platinum run** — cheats disable trophies and saving; Criminal Profile *Irredeemable* is permanent; there is no mission replay, so keep chapter saves (15 manual slots).

## Honesty notes

- Research date: 21 Nov 2026. GTA VI is two days old; rarity figures and glitch status change fast.
- No Rockstar logo, official artwork, box art, or game screenshots are used anywhere. The look is our own.
- The app works fully offline: it fetches nothing at runtime. Source links open only when the reader follows them.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Hand it in (Node 22, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

PowerPyx (trophy guide + 100% checklist), Exophase (official list + rarity), GameSpot (UFO), damnmodz (Confirmed/Reported/Unknown labels), gamemapa (cross-check + Gamerscore), PushSquare, KeeNgamer, allblogthings, afleurdenet, vanotherlevel, dlcompare, cryptogames, gtavibes, boostingfactory, Game8, OutputLag, Kotaku, IGN, BuzzFeed, Insider Gaming, GamesHorizon, GameRant, GamingBible, Gamebrott, FandomWire, Tech2Geek, Undercode News, Joking Joystick, Beebom, Notebookcheck, GameWatcher, Sportskeeda, WikiGames, Games.gg, GamesFuze, DualShockers, Briefly, Dundee Culture, Men's Journal, ComingSoon, and the Facebook reels cited as disputed in the Easter Eggs section. Every guide step names its source in the app.

## License

MIT — see `LICENSE`.
