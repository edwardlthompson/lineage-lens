# Phone spec gap fill (Sprint 7)

Deep-search remaining buyer fields after Sprint 6. Protocol matches [phone-spec-audit.md](phone-spec-audit.md) ranks 1–4 (maker wins; global/NA/EU battery default; no invented watts).

## Goals

1. Fill **2020 and newer** phones first — published specs are usually available.
2. Pre-2020 is **best-effort only** (early 2010s often never published charge watts or full sensor part numbers).
3. Keep `provenance.quality` honest: empty / wiki sentinel `None` waterproofing does not count; missing core optics → not `complete`.

## Where corrections go

- `examples/web/public/data/devices.json` — sensors, IP, refresh, battery
- `data/raw/flagship_camera_overrides.json` — camera overrides
- `examples/web/src/features/table/chargeCatalog.ts` — published charge watts

## Priority inside each year

- **A — Sensor/optics** — restore real `sensor_model` / size / pitch after placeholder purge
- **B — Charge** — published watts only into `chargeCatalog.ts`
- **C — Refresh** — `screen.refresh_rate` when the maker or GSMArena states it
- **D — IP** — real rating string; leave blank if unpublished (do not keep `None` as “known”)

## Snapshot (2020+ phones, 189 unique codenames)

| Gap | Unique codenames |
|-----|-----------------:|
| Sensor/optics | 28 |
| Charge not in catalog | 57 |
| Screen refresh missing | 61 |
| IP empty/`None` | 42 |
| Battery capacity | 1 |
| Quality not complete | 68 |
| Any of the above | 111 |


## Priority A — Sensor / optics gaps

**Count:** 28 unique codenames

| Codename | Name | Year |
|----------|------|------|
| `fairlady` | 15T | 2026 |
| `stallion` | Pixel 10a | 2026 |
| `blazer` | Pixel 10 Pro | 2025 |
| `frankel` | Pixel 10 | 2025 |
| `giulia` | 13R | 2025 |
| `lexus` | Nord 5 | 2025 |
| `mustang` | Pixel 10 Pro XL | 2025 |
| `pdx257` | Xperia 10 VII | 2025 |
| `piloti` | GT7 Pro Racing Edition | 2025 |
| `rango` | Pixel 10 Pro Fold | 2025 |
| `tegu` | Pixel 9a | 2025 |
| `akita` | Pixel 8a | 2024 |
| `caiman` | Pixel 9 Pro | 2024 |
| `comet` | Pixel 9 Pro Fold | 2024 |
| `komodo` | Pixel 9 Pro XL | 2024 |
| `lamu` | moto g15 | 2024 |
| `tokay` | Pixel 9 | 2024 |
| `earth` | Redmi 12C | 2023 |
| `felix` | Pixel Fold | 2023 |
| `husky` | Pixel 8 Pro | 2023 |
| `lynx` | Pixel 7a | 2023 |
| `shiba` | Pixel 8 | 2023 |
| `bluejay` | Pixel 6a | 2022 |
| `nuwa` | 13 Pro | 2022 |
| `oriole` | Pixel 6 | 2021 |
| `raven` | Pixel 6 Pro | 2021 |
| `bramble` | Pixel 4a 5G | 2020 |
| `redfin` | Pixel 5 | 2020 |

## Priority B — Charge missing from catalog

**Count:** 57 unique codenames

| Codename | Name | Year |
|----------|------|------|
| `stallion` | Pixel 10a | 2026 |
| `Q25` | Q25 Pro | 2025 |
| `pdx257` | Xperia 10 VII | 2025 |
| `fogo` | moto g 5G - 2024 | 2024 |
| `fogos` | moto g45 5G | 2024 |
| `lamu` | moto g15 | 2024 |
| `earth` | Redmi 12C | 2023 |
| `genevn` | moto g stylus 5G (2023) | 2023 |
| `ingot` | Saga | 2023 |
| `larry` | Nord CE 3 Lite 5G | 2023 |
| `rtwo` | edge 40 pro | 2023 |
| `oscarc` | Q5 | 2022 |
| `oscarru` | 9 5G | 2022 |
| `pro1x` | Pro¹ X | 2022 |
| `pyrite` | OV1 | 2022 |
| `rosemary` | POCO M5s | 2022 |
| `FP4` | 4 | 2021 |
| `barbet` | Pixel 5a | 2021 |
| `bathena` | defy 2021 | 2021 |
| `berlna` | edge 2021 | 2021 |
| `borneo` | moto g power 2021 | 2021 |
| `capri` | moto g10 | 2021 |
| `caprip` | moto g30 | 2021 |
| `denver` | moto g stylus 5G | 2021 |
| `dre` | Nord N200 | 2021 |
| `ellis` | moto g pure | 2021 |
| `f62` | Galaxy F62 | 2021 |
| `guamna` | moto g play (2021) | 2021 |
| `ibiza` | moto g50 | 2021 |
| `m52xq` | Galaxy M52 5G | 2021 |
| `miatoll` | Redmi Note 10 Lite | 2021 |
| `r8q` | Galaxy S20 FE (Snapdragon) | 2021 |
| `a21s` | Galaxy A21s | 2020 |
| `a71` | Galaxy A71 | 2020 |
| `axolotl` | SHIFT6mq | 2020 |
| `billie` | Nord N10 | 2020 |
| `casuarina` | Joy 3 | 2020 |
| `caymanlm` | Velvet 5G | 2020 |
| `caymanslm` | Velvet 4G | 2020 |
| `cebu` | moto g9 power | 2020 |
| `guam` | moto e7 plus | 2020 |
| `guamp` | moto g9 play | 2020 |
| `kiev` | moto g 5G | 2020 |
| `lancelot` | Redmi 9 | 2020 |
| `liber` | one fusion+ | 2020 |
| `merlinx` | Redmi Note 9 | 2020 |
| `monet` | Mi 10 Lite 5G | 2020 |
| `nairo` | moto g 5G plus | 2020 |
| `nx651j` | Play 5G | 2020 |
| `nx659j` | Red Magic 5G (Global) | 2020 |
| `pdx203` | Xperia 1 II | 2020 |
| `pdx206` | Xperia 5 II | 2020 |
| `style3lm` | Style3 | 2020 |
| `sunfish` | Pixel 4a | 2020 |
| `surya` | POCO X3 NFC | 2020 |
| `timelm` | V60 ThinQ | 2020 |
| `winglm` | Wing | 2020 |

## Priority C — Refresh rate missing

**Count:** 61 unique codenames

| Codename | Name | Year |
|----------|------|------|
| `Q25` | Q25 Pro | 2025 |
| `earth` | Redmi 12C | 2023 |
| `b0s` | Galaxy S22 Ultra | 2022 |
| `devon` | moto g32 | 2022 |
| `dubai` | edge 30 | 2022 |
| `g0s` | Galaxy S22+ | 2022 |
| `gunnar` | Nord N20 | 2022 |
| `hawao` | moto g42 | 2022 |
| `pdx225` | Xperia 10 IV | 2022 |
| `pro1x` | Pro¹ X | 2022 |
| `r0s` | Galaxy S22 | 2022 |
| `rhode` | moto g52 | 2022 |
| `rosemary` | POCO M5s | 2022 |
| `socrates` | Redmi K60 Pro | 2022 |
| `tundra` | edge 30 fusion | 2022 |
| `zizhan` | MIX Fold 2 | 2022 |
| `FP4` | 4 | 2021 |
| `bathena` | defy 2021 | 2021 |
| `berlin` | edge 20 | 2021 |
| `berlna` | edge 2021 | 2021 |
| `borneo` | moto g power 2021 | 2021 |
| `capri` | moto g10 | 2021 |
| `caprip` | moto g30 | 2021 |
| `denver` | moto g stylus 5G | 2021 |
| `dre` | Nord N200 | 2021 |
| `ellis` | moto g pure | 2021 |
| `f62` | Galaxy F62 | 2021 |
| `gauguin` | Mi 10i 5G | 2021 |
| `guamna` | moto g play (2021) | 2021 |
| `miatoll` | Redmi Note 10 Lite | 2021 |
| `nio` | edge s | 2021 |
| `pdx215` | Xperia 1 III | 2021 |
| `pstar` | edge 20 pro | 2021 |
| `xpeng` | moto g200 5G | 2021 |
| `a71` | Galaxy A71 | 2020 |
| `avicii` | Nord | 2020 |
| `billie` | Nord N10 | 2020 |
| `c1s` | Galaxy Note20 (4G/5G) | 2020 |
| `c2s` | Galaxy Note20 Ultra (4G/5G) | 2020 |
| `casuarina` | Joy 3 | 2020 |
| `caymanlm` | Velvet 5G | 2020 |
| `caymanslm` | Velvet 4G | 2020 |
| `cebu` | moto g9 power | 2020 |
| `guam` | moto e7 plus | 2020 |
| `guamp` | moto g9 play | 2020 |
| `kebab` | 8T | 2020 |
| `kiev` | moto g 5G | 2020 |
| `lancelot` | Redmi 9 | 2020 |
| `liber` | one fusion+ | 2020 |
| `lmi` | Redmi K30 Pro Zoom Edition | 2020 |
| `merlinx` | Redmi Note 9 | 2020 |
| `monet` | Mi 10 Lite 5G | 2020 |
| `nairo` | moto g 5G plus | 2020 |
| `pdx203` | Xperia 1 II | 2020 |
| `racer` | edge | 2020 |
| `surya` | POCO X3 NFC | 2020 |
| `timelm` | V60 ThinQ | 2020 |
| `winglm` | Wing | 2020 |
| `x1s` | Galaxy S20 (4G/5G) | 2020 |
| `y2s` | Galaxy S20+ (4G/5G) | 2020 |
| `z3s` | Galaxy S20 Ultra (5G) | 2020 |

## Priority D — Waterproofing empty or None

**Count:** 42 unique codenames

| Codename | Name | Year |
|----------|------|------|
| `Q25` | Q25 Pro | 2025 |
| `earth` | Redmi 12C | 2023 |
| `mayfly` | 12S | 2022 |
| `oscarc` | Q5 | 2022 |
| `oscaro` | Nord CE 2 Lite 5G | 2022 |
| `oscarru` | 9 5G | 2022 |
| `pro1x` | Pro¹ X | 2022 |
| `zizhan` | MIX Fold 2 | 2022 |
| `FP4` | 4 | 2021 |
| `borneo` | moto g power 2021 | 2021 |
| `capri` | moto g10 | 2021 |
| `caprip` | moto g30 | 2021 |
| `denver` | moto g stylus 5G | 2021 |
| `dre` | Nord N200 | 2021 |
| `ellis` | moto g pure | 2021 |
| `f62` | Galaxy F62 | 2021 |
| `guamna` | moto g play (2021) | 2021 |
| `ibiza` | moto g50 | 2021 |
| `m52xq` | Galaxy M52 5G | 2021 |
| `nio` | edge s | 2021 |
| `xpeng` | moto g200 5G | 2021 |
| `a21s` | Galaxy A21s | 2020 |
| `a71` | Galaxy A71 | 2020 |
| `avicii` | Nord | 2020 |
| `axolotl` | SHIFT6mq | 2020 |
| `billie` | Nord N10 | 2020 |
| `bramble` | Pixel 4a 5G | 2020 |
| `casuarina` | Joy 3 | 2020 |
| `cebu` | moto g9 power | 2020 |
| `guam` | moto e7 plus | 2020 |
| `guamp` | moto g9 play | 2020 |
| `kiev` | moto g 5G | 2020 |
| `lancelot` | Redmi 9 | 2020 |
| `merlinx` | Redmi Note 9 | 2020 |
| `monet` | Mi 10 Lite 5G | 2020 |
| `nairo` | moto g 5G plus | 2020 |
| `nx651j` | Play 5G | 2020 |
| `nx659j` | Red Magic 5G (Global) | 2020 |
| `obiwan` | ROG Phone 3 | 2020 |
| `racer` | edge | 2020 |
| `style3lm` | Style3 | 2020 |
| `sunfish` | Pixel 4a | 2020 |

## Battery capacity missing

**Count:** 1 unique codenames

| Codename | Name | Year |
|----------|------|------|
| `lexus` | Nord 5 | 2025 |

## Combined 2020+ gap list (any flag)

**Count:** 111 unique codenames

| Codename | Name | Year | Gaps |
|----------|------|------|------|
| `fairlady` | 15T | 2026 | sensor, quality |
| `stallion` | Pixel 10a | 2026 | sensor, charge, quality |
| `Q25` | Q25 Pro | 2025 | charge, refresh, ip, quality |
| `blazer` | Pixel 10 Pro | 2025 | sensor, quality |
| `frankel` | Pixel 10 | 2025 | sensor, quality |
| `giulia` | 13R | 2025 | sensor, quality |
| `lexus` | Nord 5 | 2025 | sensor, battery, quality |
| `mustang` | Pixel 10 Pro XL | 2025 | sensor, quality |
| `pdx257` | Xperia 10 VII | 2025 | sensor, charge, quality |
| `piloti` | GT7 Pro Racing Edition | 2025 | sensor, quality |
| `rango` | Pixel 10 Pro Fold | 2025 | sensor, quality |
| `tegu` | Pixel 9a | 2025 | sensor, quality |
| `akita` | Pixel 8a | 2024 | sensor, quality |
| `caiman` | Pixel 9 Pro | 2024 | sensor, quality |
| `comet` | Pixel 9 Pro Fold | 2024 | sensor, quality |
| `fogo` | moto g 5G - 2024 | 2024 | charge |
| `fogos` | moto g45 5G | 2024 | charge |
| `komodo` | Pixel 9 Pro XL | 2024 | sensor, quality |
| `lamu` | moto g15 | 2024 | sensor, charge, quality |
| `tokay` | Pixel 9 | 2024 | sensor, quality |
| `earth` | Redmi 12C | 2023 | sensor, charge, refresh, ip, quality |
| `felix` | Pixel Fold | 2023 | sensor, quality |
| `genevn` | moto g stylus 5G (2023) | 2023 | charge |
| `husky` | Pixel 8 Pro | 2023 | sensor, quality |
| `ingot` | Saga | 2023 | charge |
| `larry` | Nord CE 3 Lite 5G | 2023 | charge |
| `lynx` | Pixel 7a | 2023 | sensor, quality |
| `rtwo` | edge 40 pro | 2023 | charge |
| `shiba` | Pixel 8 | 2023 | sensor, quality |
| `b0s` | Galaxy S22 Ultra | 2022 | refresh |
| `bluejay` | Pixel 6a | 2022 | sensor, quality |
| `devon` | moto g32 | 2022 | refresh |
| `dubai` | edge 30 | 2022 | refresh |
| `g0s` | Galaxy S22+ | 2022 | refresh |
| `gunnar` | Nord N20 | 2022 | refresh |
| `hawao` | moto g42 | 2022 | refresh |
| `mayfly` | 12S | 2022 | ip, quality |
| `nuwa` | 13 Pro | 2022 | sensor, quality |
| `oscarc` | Q5 | 2022 | charge, ip, quality |
| `oscaro` | Nord CE 2 Lite 5G | 2022 | ip, quality |
| `oscarru` | 9 5G | 2022 | charge, ip, quality |
| `pdx225` | Xperia 10 IV | 2022 | refresh |
| `pro1x` | Pro¹ X | 2022 | charge, refresh, ip, quality |
| `pyrite` | OV1 | 2022 | charge |
| `r0s` | Galaxy S22 | 2022 | refresh |
| `rhode` | moto g52 | 2022 | refresh |
| `rosemary` | POCO M5s | 2022 | charge, refresh |
| `socrates` | Redmi K60 Pro | 2022 | refresh |
| `tundra` | edge 30 fusion | 2022 | refresh |
| `zizhan` | MIX Fold 2 | 2022 | refresh, ip, quality |
| `FP4` | 4 | 2021 | charge, refresh, ip, quality |
| `barbet` | Pixel 5a | 2021 | charge |
| `bathena` | defy 2021 | 2021 | charge, refresh |
| `berlin` | edge 20 | 2021 | refresh |
| `berlna` | edge 2021 | 2021 | charge, refresh |
| `borneo` | moto g power 2021 | 2021 | charge, refresh, ip, quality |
| `capri` | moto g10 | 2021 | charge, refresh, ip, quality |
| `caprip` | moto g30 | 2021 | charge, refresh, ip, quality |
| `denver` | moto g stylus 5G | 2021 | charge, refresh, ip, quality |
| `dre` | Nord N200 | 2021 | charge, refresh, ip, quality |
| `ellis` | moto g pure | 2021 | charge, refresh, ip, quality |
| `f62` | Galaxy F62 | 2021 | charge, refresh, ip, quality |
| `gauguin` | Mi 10i 5G | 2021 | refresh |
| `guamna` | moto g play (2021) | 2021 | charge, refresh, ip, quality |
| `ibiza` | moto g50 | 2021 | charge, ip, quality |
| `m52xq` | Galaxy M52 5G | 2021 | charge, ip, quality |
| `miatoll` | Redmi Note 10 Lite | 2021 | charge, refresh |
| `nio` | edge s | 2021 | refresh, ip, quality |
| `oriole` | Pixel 6 | 2021 | sensor, quality |
| `pdx215` | Xperia 1 III | 2021 | refresh |
| `pstar` | edge 20 pro | 2021 | refresh |
| `r8q` | Galaxy S20 FE (Snapdragon) | 2021 | charge |
| `raven` | Pixel 6 Pro | 2021 | sensor, quality |
| `xpeng` | moto g200 5G | 2021 | refresh, ip, quality |
| `a21s` | Galaxy A21s | 2020 | charge, ip, quality |
| `a71` | Galaxy A71 | 2020 | charge, refresh, ip, quality |
| `avicii` | Nord | 2020 | refresh, ip, quality |
| `axolotl` | SHIFT6mq | 2020 | charge, ip, quality |
| `billie` | Nord N10 | 2020 | charge, refresh, ip, quality |
| `bramble` | Pixel 4a 5G | 2020 | sensor, ip, quality |
| `c1s` | Galaxy Note20 (4G/5G) | 2020 | refresh |
| `c2s` | Galaxy Note20 Ultra (4G/5G) | 2020 | refresh |
| `casuarina` | Joy 3 | 2020 | charge, refresh, ip, quality |
| `caymanlm` | Velvet 5G | 2020 | charge, refresh |
| `caymanslm` | Velvet 4G | 2020 | charge, refresh |
| `cebu` | moto g9 power | 2020 | charge, refresh, ip, quality |
| `guam` | moto e7 plus | 2020 | charge, refresh, ip, quality |
| `guamp` | moto g9 play | 2020 | charge, refresh, ip, quality |
| `kebab` | 8T | 2020 | refresh |
| `kiev` | moto g 5G | 2020 | charge, refresh, ip, quality |
| `lancelot` | Redmi 9 | 2020 | charge, refresh, ip, quality |
| `liber` | one fusion+ | 2020 | charge, refresh |
| `lmi` | Redmi K30 Pro Zoom Edition | 2020 | refresh |
| `merlinx` | Redmi Note 9 | 2020 | charge, refresh, ip, quality |
| `monet` | Mi 10 Lite 5G | 2020 | charge, refresh, ip, quality |
| `nairo` | moto g 5G plus | 2020 | charge, refresh, ip, quality |
| `nx651j` | Play 5G | 2020 | charge, ip, quality |
| `nx659j` | Red Magic 5G (Global) | 2020 | charge, ip, quality |
| `obiwan` | ROG Phone 3 | 2020 | ip, quality |
| `pdx203` | Xperia 1 II | 2020 | charge, refresh |
| `pdx206` | Xperia 5 II | 2020 | charge |
| `racer` | edge | 2020 | refresh, ip, quality |
| `redfin` | Pixel 5 | 2020 | sensor, quality |
| `style3lm` | Style3 | 2020 | charge, ip, quality |
| `sunfish` | Pixel 4a | 2020 | charge, ip, quality |
| `surya` | POCO X3 NFC | 2020 | charge, refresh |
| `timelm` | V60 ThinQ | 2020 | charge, refresh |
| `winglm` | Wing | 2020 | charge, refresh |
| `x1s` | Galaxy S20 (4G/5G) | 2020 | refresh |
| `y2s` | Galaxy S20+ (4G/5G) | 2020 | refresh |
| `z3s` | Galaxy S20 Ultra (5G) | 2020 | refresh |

## Pre-2020

Large `partial` / `wiki_only` set remains after truthful quality recompute. Do not block Sprint 7 on finishing early-2010s. Log finds in this doc’s Progress section when a year batch is attempted.

## Progress

- Data column hidden by default (`quality` in `DEFAULT_HIDDEN_COLUMNS`).
- Quality recomputed with `None` IP treated as unknown; stale `complete` after sensor purge corrected.
- Sprint 7 deep fills applied via `data/raw/sprint7_gap_fills.json` + `scripts/pipeline/apply_sprint7_fills.py` (maker/GSMArena ranks; global/NA/EU battery).
- **2026–2020:** charge/refresh/IP filled where published; sensors restored where maker/press named them (e.g. fairlady, lexus, piloti). Pixels left without invented part numbers. Intentional blanks: `Q25` (weak sources), `rtwo` charge (regional conflict), many Motos without published IP, Pixel sensor models.
- **Pre-2020:** best-effort only — cleared wiki `None` IP sentinels on phones; no year-complete requirement.
- **Post-archive corrections** (`sprint7_gap_fills_corrections.json`): charge/refresh fixes (e.g. pdx257 22W, larry 67W, FP4 20W/60Hz, rosemary 60Hz); dual-sourced Pixel part numbers (lynx/bluejay/oriole/raven/bramble/redfin/husky); removed unpublished `pro1x`/`pyrite` peak watts.

