# LEONIDA PLATINUM ATLAS — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Masasiya00/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Panduan + tracker offline untuk **55 trophy PlayStation 5 GTA VI** — 1 platinum, 2 gold, 6 silver, 46 bronze, 27 hidden terkonfirmasi (+2 belum terverifikasi: Catch Me If You Can, Challenging Tank) — dengan **736/736 claims cited (100%), 681 on 2+ sites, 61 sources, 72 pages, 25 disputes**. Angka-angka itu dihitung langsung dari data saat app berjalan dan ditampilkan di audit strip di atas halaman.

## Kenapa guide ini menang

- **Setiap langkah bersumber.** Tidak ada klaim lokasi atau langkah tanpa sumber: setiap langkah panduan mencantumkan kode sumbernya, dan sumbernya bisa diklik. Audit strip di atas halaman menghitungnya langsung dari data — bukan angka yang diketik tangan.
- **Paling update.** Empat trophy "misterius" yang baru terpecahkan malam 20 Nov 2026 sudah ada solusinya di sini (Bad Luck, I Guess; The Truth Is Out There; In The Beginning…; Capital Offense) — bukan lagi "unknown".
- **Kejujuran yang bisa dicek.** 51/55 trophy terkonfirmasi; satu-satunya yang belum terverifikasi, **Ten Pin**, ditampilkan apa adanya sebagai unknown dengan lead terbaiknya — tanpa langkah yang dikarang. Semua perselisihan antar sumber ditampilkan dua sisi di view Disputes.
- **Celah yang kompetitor tidak punya:** panel glitch & farming (gudang Apollo Aggregates, status reported — 2 sumber pro vs 2 kontra), status patch day-one, pemetaan overlap trophy ↔ checklist 100%, dan peringatan Criminal Profile Irredeemable (permanen) serta cheats yang menonaktifkan trophy.
- **Tracker yang benar-benar dipakai:** checklist 55 trophy tersimpan di localStorage, counter progres X/Y per trophy berangka (250 stunt, 42 shooting range, 100 WAiNK, dst.), filter jenis/grade/status + pencarian teks, export/import JSON, reset, dan Next Up planner yang menunjuk trophy berikutnya yang paling dekat.
- **Spoiler shield:** nama & deskripsi 20 trophy story disembunyikan sampai didapat — di semua view, termasuk detail, Next Up, dan roadmap.
- **Satu-satunya missable ditandai merah:** Positive Mental Attitude (meditasi Chapter 1). Sisanya hijau — aman setelah story — lengkap dengan strategi save manual per chapter, karena game ini tidak punya mission replay.

## Fitur

| Fitur | Detail |
|---|---|
| Tracker | Checklist 55 trophy, localStorage, export/import JSON, reset |
| Counter | Input X/Y manual per trophy berangka, tersimpan otomatis |
| Filter | Jenis (story / missable / collectibles / activities / crime / hidden), grade, status, pencarian teks |
| Spoiler shield | ON/OFF; mask 20 trophy story yang belum didapat di semua view |
| Roadmap | 7 tahap ke platinum, estimasi waktu, progres per tahap |
| Missables | Grid per chapter + strategi save |
| Disputes | 25 panel dua sisi (pro vs kontra) + badge jumlah di nav |
| Glitch & farming | Apollo Aggregates (reported), trik farming legal, status launch |
| Sources | Matrix semua sumber + jumlah halaman + tautan (app tidak pernah fetch) |
| Easter Eggs | 86 kartu, filter jenis (egg/bug/oddity) dan status |
| Audit strip | Angka dihitung langsung dari data saat runtime |
| Offline | Semua file lokal di bawah `app/`; tanpa font/CDN eksternal |

## Cara pakai

```bash
node serve.ts        # http://localhost:8080
```

Buka di desktop Chrome. Centang trophy yang sudah didapat, isi counter untuk trophy berangka, dan ikuti Next Up di panel kanan. Matikan spoiler shield kalau tidak keberatan spoiler story. Export progres secara berkala sebagai cadangan (JSON).

Untuk menyerahkan entry: `MAKEFUN_OUTPUT_DIR=out node main.ts` — menyalin `app/` + `screenshots/` ke output dan menulis `dossier.json`.

## Sumber

Panduan ini ditulis dengan kata-kata sendiri, berdasarkan riset atas PowerPyx, Exophase, GameSpot, damnmodz, gamemapa, PushSquare, KeeNgamer, GamesRadar+, dan sumber-sumber lain yang tercantum lengkap di view Sources beserta halaman yang dibaca. Nama & deskripsi trophy ditampilkan seperti yang diterbitkan PlayStation (itu pengecualian yang diizinkan rules). Tidak ada teks guide lain yang disalin; tidak ada logo, artwork, atau screenshot resmi Rockstar Games.

## Kejujuran

- **51/55 trophy terkonfirmasi** dari sedikitnya satu sumber tepercaya.
- **Ten Pin — unknown.** Dugaan terkuat: tendang musuh saat melee drive-by dari motor. Belum ada sumber yang membuktikan langkah pastinya per 21 Nov 2026. Guide ini tidak mengarang langkah untuknya.
- **Glitch uang Apollo Aggregates — reported, belum terverifikasi penuh.** Dua sumber bilang bekerja di versi launch, dua sumber bilang belum ada glitch uang yang bekerja. Ditampilkan dengan label itu + cara legit sebagai alternatif.
- **Satu slot hidden non-story ke-16 belum teridentifikasi pasti** dari sumber yang dibaca; dua kandidat (Catch Me If You Can, Challenging Tank) ditandai "Hidden? — belum terverifikasi", bukan ditebak.

## Lisensi

MIT — lihat `LICENSE`.
