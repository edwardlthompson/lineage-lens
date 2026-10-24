# Phone spec gap fill — Sprint 8

Fresh inventory after Sprint 7. Protocol: [phone-spec-audit.md](phone-spec-audit.md) ranks 1–4 (maker wins; global/NA/EU battery; **never invent watts**). Machine inventory: `data/raw/sprint8_gap_inventory.json`.

## Why another pass

Sprint 7 closed most 2020+ charge/refresh cells, but:

1. **Motorola wired/wireless** — many catalog rows claim `hasWireless: false` without a maker statement that wireless is absent. Re-verify every Moto: published wired W **and** wireless yes/no (+ watts / Qi when stated).
2. **IP still blank** on many 2020–2021 Motos and budget phones — often unpublished; confirm or leave blank (do not keep wiki `None`).
3. **2015–2019** — almost untouched: **~213** missing charge catalog entries, **~228** missing refresh, **~175** missing IP, **~236** sensor gaps.

## Priority order

1. **Motorola charge + wireless** (all years on board, start 2020+) — maker support pages + GSMArena
2. **2020+ IP** where a real rating exists
3. **2020+ sensors** still missing part numbers (Pixels stay blank unless teardown/dual-source)
4. **2015–2019 charge** year batches (newest first), then refresh/IP best-effort
5. Sensors for 2015–2019 only when maker/GSMArena/teardown names them

## Where corrections go

- `examples/web/src/features/table/chargeCatalog.ts`
- `examples/web/public/data/devices.json`
- `data/raw/flagship_camera_overrides.json`
- Re-run quality via `scripts/pipeline/apply_sprint7_fills.py` or `assign_provenance_quality`

## Snapshot counts

### 2020 and newer (189 unique phones)

| Flag | Count |
|------|------:|

| `any` | 38 |
| `charge_missing` | 4 |
| `charge_wired_null` | 1 |
| `wireless_unverified_none` | 0 |
| `wireless_watts_missing` | 0 |
| `refresh` | 1 |
| `ip` | 32 |
| `battery` | 0 |
| `sensor` | 4 |
| `quality` | 36 |
| `motorola` | 15 |

### 2015–2019 (243 unique phones)

| Flag | Count |
|------|------:|

| `any` | 240 |
| `charge_missing` | 45 |
| `charge_wired_null` | 0 |
| `wireless_unverified_none` | 0 |
| `refresh` | 151 |
| `ip` | 161 |
| `battery` | 0 |
| `sensor` | 236 |
| `quality` | 240 |
| `motorola` | 30 |

## List A — 2020+ phones still missing data


| codename | vendor | name | year | gaps | quality |
|---|---|---|---|---|---|
| stallion | Google | Pixel 10a | 2026 | sensor, quality | partial |
| Q25 | Zinwa | Q25 Pro | 2025 | charge_missing, refresh, ip, quality | partial |
| giulia | OnePlus | 13R | 2025 | sensor, quality | partial |
| akita | Google | Pixel 8a | 2024 | sensor, quality | partial |
| rtwo | Motorola | edge 40 pro | 2023 | charge_wired_null | complete |
| nuwa | Xiaomi | 13 Pro | 2022 | sensor, quality | partial |
| oscarc | Realme | Q5 | 2022 | ip, quality | partial |
| oscarru | Realme | 9 5G | 2022 | ip, quality | partial |
| pro1x | F(x)tec | Pro¹ X | 2022 | charge_missing, ip, quality | partial |
| pyrite | OSOM | OV1 | 2022 | charge_missing | complete |
| borneo | Motorola | moto g power 2021 | 2021 | ip, quality | partial |
| capri | Motorola | moto g10 | 2021 | ip, quality | partial |
| caprip | Motorola | moto g30 | 2021 | charge_missing, ip, quality | partial |
| denver | Motorola | moto g stylus 5G | 2021 | ip, quality | partial |
| dre | OnePlus | Nord N200 | 2021 | ip, quality | partial |
| ellis | Motorola | moto g pure | 2021 | ip, quality | partial |
| f62 | Samsung | Galaxy F62 | 2021 | ip, quality | partial |
| guamna | Motorola | moto g play (2021) | 2021 | ip, quality | partial |
| ibiza | Motorola | moto g50 | 2021 | ip, quality | partial |
| nio | Motorola | edge s | 2021 | ip, quality | partial |
| a21s | Samsung | Galaxy A21s | 2020 | ip, quality | partial |
| avicii | OnePlus | Nord | 2020 | ip, quality | partial |
| axolotl | SHIFT | SHIFT6mq | 2020 | ip, quality | partial |
| billie | OnePlus | Nord N10 | 2020 | ip, quality | partial |
| bramble | Google | Pixel 4a 5G | 2020 | ip, quality | partial |
| casuarina | Vsmart | Joy 3 | 2020 | ip, quality | partial |
| cebu | Motorola | moto g9 power | 2020 | ip, quality | partial |
| guam | Motorola | moto e7 plus | 2020 | ip, quality | partial |
| guamp | Motorola | moto g9 play | 2020 | ip, quality | partial |
| kiev | Motorola | moto g 5G | 2020 | ip, quality | partial |
| lancelot | Xiaomi | Redmi 9 | 2020 | ip, quality | partial |
| merlinx | Xiaomi | Redmi Note 9 | 2020 | ip, quality | partial |
| monet | Xiaomi | Mi 10 Lite 5G | 2020 | ip, quality | partial |
| nairo | Motorola | moto g 5G plus | 2020 | ip, quality | partial |
| nx651j | Nubia | Play 5G | 2020 | ip, quality | partial |
| racer | Motorola | edge | 2020 | ip, quality | partial |
| style3lm | LG | Style3 | 2020 | ip, quality | partial |
| sunfish | Google | Pixel 4a | 2020 | ip, quality | partial |


### Motorola 2020+ (charge/wireless/IP focus)


| codename | name | year | gaps |
|---|---|---|---|
| rtwo | edge 40 pro | 2023 | charge_wired_null |
| borneo | moto g power 2021 | 2021 | ip, quality |
| capri | moto g10 | 2021 | ip, quality |
| caprip | moto g30 | 2021 | charge_missing, ip, quality |
| denver | moto g stylus 5G | 2021 | ip, quality |
| ellis | moto g pure | 2021 | ip, quality |
| guamna | moto g play (2021) | 2021 | ip, quality |
| ibiza | moto g50 | 2021 | ip, quality |
| nio | edge s | 2021 | ip, quality |
| cebu | moto g9 power | 2020 | ip, quality |
| guam | moto e7 plus | 2020 | ip, quality |
| guamp | moto g9 play | 2020 | ip, quality |
| kiev | moto g 5G | 2020 | ip, quality |
| nairo | moto g 5G plus | 2020 | ip, quality |
| racer | edge | 2020 | ip, quality |


## List B — 2015–2019 phones missing data


> Full list is long; charge-missing Motos called out first, then combined gap table.


### Motorola 2015–2019 missing charge


| codename | name | year | gaps |
|---|---|---|---|
| ocean | moto g7 power | 2019 | charge_missing, ip, sensor, quality |
| harpia | moto g4 play | 2016 | charge_missing, refresh, ip, sensor, quality |
| osprey | moto g (2015) | 2015 | charge_missing, refresh, sensor, quality |
| otus | moto e (2015) | 2015 | charge_missing, refresh, ip, sensor, quality |
| surnia | moto e LTE (2015) | 2015 | charge_missing, refresh, ip, sensor, quality |
| thea | moto g LTE (2014) | 2015 | charge_missing, refresh, ip, sensor, quality |


### All 2015–2019 with any gap


| codename | vendor | name | year | gaps | quality |
|---|---|---|---|---|---|
| FP3 | Fairphone | 3 | 2019 | ip, sensor, quality | partial |
| I001D | ASUS | ROG Phone 2 (ZS660KL) | 2019 | ip, sensor, quality | partial |
| I01WD | ASUS | Zenfone 6 (ZS630KL) | 2019 | sensor, quality | partial |
| Mi439 | Xiaomi | Redmi 7A | 2019 | ip, sensor, quality | partial |
| RMX1851 | Realme | 3 Pro | 2019 | ip, sensor, quality | partial |
| TP1803 | Nubia | Mini 5G | 2019 | refresh, ip, sensor, quality | partial |
| alphaplus | LG | G8 ThinQ (Korea) | 2019 | sensor, quality | partial |
| betalm | LG | G8s ThinQ | 2019 | wireless_watts_missing, sensor, quality | partial |
| beyond0lte | Samsung | Galaxy S10e | 2019 | refresh, sensor, quality | partial |
| beyond1lte | Samsung | Galaxy S10 | 2019 | refresh, sensor, quality | partial |
| beyond2lte | Samsung | Galaxy S10+ | 2019 | refresh, sensor, quality | partial |
| beyondx | Samsung | Galaxy S10 5G | 2019 | refresh, sensor, quality | partial |
| bonito | Google | Pixel 3a XL | 2019 | ip, sensor, quality | partial |
| channel | Motorola | moto g7 play | 2019 | ip, sensor, quality | partial |
| d1 | Samsung | Galaxy Note10 | 2019 | refresh, sensor, quality | partial |
| d1x | Samsung | Galaxy Note10 5G | 2019 | refresh, ip, sensor, quality | partial |
| d2s | Samsung | Galaxy Note10+ | 2019 | refresh, sensor, quality | partial |
| d2x | Samsung | Galaxy Note10+ 5G | 2019 | refresh, sensor, quality | partial |
| davinci | Xiaomi | Mi 9T | 2019 | sensor, quality | partial |
| flashlmdd | LG | V50 ThinQ | 2019 | refresh, sensor, quality | partial |
| ginkgo | Xiaomi | Redmi Note 8 | 2019 | ip, sensor, quality | partial |
| grus | Xiaomi | Mi 9 SE | 2019 | refresh, sensor, quality | partial |
| guacamole | OnePlus | 7 Pro | 2019 | ip, sensor, quality | partial |
| guacamoleb | OnePlus | 7 | 2019 | refresh, ip, quality | partial |
| heart | Lenovo | Z5 Pro GT | 2019 | refresh, ip, sensor, quality | partial |
| hotdog | OnePlus | 7T Pro | 2019 | sensor, quality | partial |
| hotdogb | OnePlus | 7T | 2019 | ip, sensor, quality | partial |
| kane | Motorola | one vision | 2019 | sensor, quality | partial |
| kirin | Sony | Xperia 10 | 2019 | ip, sensor, quality | partial |
| lake | Motorola | moto g7 plus | 2019 | ip, sensor, quality | partial |
| laurel_sprout | Xiaomi | Mi A3 | 2019 | ip, sensor, quality | partial |
| lavender | Xiaomi | Redmi Note 7 | 2019 | ip, sensor, quality | partial |
| m20lte | Samsung | Galaxy M20 | 2019 | ip, sensor, quality | partial |
| mermaid | Sony | Xperia 10 Plus | 2019 | ip, sensor, quality | partial |
| mh2lm | LG | G8X ThinQ (G850EM/EMW) | 2019 | refresh, sensor, quality | partial |
| ocean | Motorola | moto g7 power | 2019 | charge_missing, ip, sensor, quality | partial |
| onclite | Xiaomi | Redmi 7 | 2019 | ip, sensor, quality | partial |
| parker | Motorola | one zoom | 2019 | sensor, quality | partial |
| pro1 | F(x)tec | Pro¹ | 2019 | ip, sensor, quality | partial |
| pyxis | Xiaomi | Mi CC9 | 2019 | refresh, ip, sensor, quality | partial |
| river | Motorola | moto g7 | 2019 | ip, sensor, quality | partial |
| sargo | Google | Pixel 3a | 2019 | ip, sensor, quality | partial |
| troika | Motorola | one action | 2019 | sensor, quality | partial |
| tucana | Xiaomi | Mi Note 10 | 2019 | refresh, ip, sensor, quality | partial |
| vela | Xiaomi | Mi CC9 Meitu Edition | 2019 | refresh, ip, sensor, quality | partial |
| violet | Xiaomi | Redmi Note 7 Pro | 2019 | ip, sensor, quality | partial |
| zippo | Lenovo | Z6 Pro | 2019 | refresh, sensor, quality | partial |
| Amber | Yandex | Phone | 2018 | refresh, ip, sensor, quality | partial |
| B2N | Nokia | 7 plus | 2018 | ip, sensor, quality | partial |
| DRG | Nokia | 6.1 Plus | 2018 | refresh, ip, sensor, quality | partial |
| PL2 | Nokia | 6.1 (2018) | 2018 | refresh, ip, sensor, quality | partial |
| RMX1801 | Realme | 2 Pro | 2018 | refresh, ip, sensor, quality | partial |
| X00P | ASUS | Zenfone Max M1 | 2018 | refresh, sensor, quality | partial |
| X00TD | ASUS | Zenfone Max Pro M1 | 2018 | refresh, sensor, quality | partial |
| X01AD | ASUS | Zenfone Max M2 | 2018 | refresh, sensor, quality | partial |
| X01BD | ASUS | Zenfone Max Pro M2 | 2018 | refresh, sensor, quality | partial |
| Z01R | ASUS | Zenfone 5Z (ZS620KL) | 2018 | refresh, sensor, quality | partial |
| ahannah | Motorola | moto e5 plus (XT1924-3/9) | 2018 | ip, sensor, quality | partial |
| akari | Sony | Xperia XZ2 | 2018 | wireless_watts_missing, sensor, quality | partial |
| akatsuki | Sony | Xperia XZ3 | 2018 | wireless_watts_missing, sensor, quality | partial |
| akershus | ZTE | Axon 9 Pro | 2018 | ip, sensor, quality | partial |
| anne | Huawei | P20 Lite | 2018 | refresh, sensor, quality | partial |
| aura | Razer | Phone 2 | 2018 | ip, sensor, quality | partial |
| aurora | Sony | Xperia XZ2 Premium | 2018 | sensor, quality | partial |
| beckham | Motorola | moto z3 play | 2018 | ip, sensor, quality | partial |
| berkeley | Huawei | Honor View 10 | 2018 | refresh, ip, sensor, quality | partial |
| beryllium | Xiaomi | POCO F1 | 2018 | refresh, ip, sensor, quality | partial |
| blueline | Google | Pixel 3 | 2018 | sensor, quality | partial |
| charlotte | Huawei | P20 Pro | 2018 | refresh, sensor, quality | partial |
| chef | Motorola | one power | 2018 | sensor, quality | partial |
| crosshatch | Google | Pixel 3 XL | 2018 | sensor, quality | partial |
| crownlte | Samsung | Galaxy Note 9 | 2018 | sensor, quality | partial |
| dipper | Xiaomi | Mi 8 | 2018 | ip, sensor, quality | partial |
| discovery | Sony | Xperia XA2 Ultra | 2018 | refresh, ip, sensor, quality | partial |
| enchilada | OnePlus | 6 | 2018 | ip, sensor, quality | partial |
| evert | Motorola | moto g6 plus | 2018 | ip, sensor, quality | partial |
| fajita | OnePlus | 6T | 2018 | sensor, quality | partial |
| g710n | LG | G7 ThinQ (G710N) | 2018 | sensor, quality | partial |
| g710ulm | LG | G7 ThinQ (G710ULM/VMX) | 2018 | wireless_watts_missing, sensor, quality | partial |
| hannah | Motorola | moto e5 plus (XT1924-6/7/8) | 2018 | ip, sensor, quality | partial |
| jasmine_sprout | Xiaomi | Mi A2 | 2018 | ip, sensor, quality | partial |
| judyln | LG | G7 ThinQ (G710AWM/EM/EMW) | 2018 | refresh, sensor, quality | partial |
| judyp | LG | V35 ThinQ | 2018 | refresh, sensor, quality | partial |
| judypn | LG | V40 ThinQ | 2018 | refresh, sensor, quality | partial |
| messi | Motorola | moto z3 | 2018 | ip, sensor, quality | partial |
| nx606j | Nubia | Z18 | 2018 | refresh, ip, sensor, quality | partial |
| nx609j | Nubia | Red Magic | 2018 | refresh, ip, sensor, quality | partial |
| nx611j | Nubia | Z18 Mini | 2018 | refresh, ip, sensor, quality | partial |
| nx616j | Nubia | X | 2018 | ip, sensor, quality | partial |
| nx619j | Nubia | Red Magic Mars | 2018 | refresh, ip, sensor, quality | partial |
| perseus | Xiaomi | Mi MIX 3 | 2018 | ip, sensor, quality | partial |
| pioneer | Sony | Xperia XA2 | 2018 | refresh, ip, sensor, quality | partial |
| platina | Xiaomi | Mi 8 Lite | 2018 | refresh, sensor, quality | partial |
| polaris | Xiaomi | Mi MIX 2S | 2018 | ip, sensor, quality | partial |
| rhannah | Motorola | moto e5 plus (XT1924-1/2/4/5) | 2018 | ip, sensor, quality | partial |
| shark | Xiaomi | Black Shark | 2018 | refresh, ip, sensor, quality | partial |
| star2lte | Samsung | Galaxy S9+ | 2018 | sensor, quality | partial |
| starlte | Samsung | Galaxy S9 | 2018 | sensor, quality | partial |
| trident | Smartisan | R1 | 2018 | ip, sensor, quality | partial |
| twolip | Xiaomi | Redmi Note 6 Pro | 2018 | refresh, ip, sensor, quality | partial |
| ursa | Xiaomi | Mi 8 Explorer Edition | 2018 | ip, sensor, quality | partial |
| voyager | Sony | Xperia XA2 Plus | 2018 | refresh, ip, sensor, quality | partial |
| wayne | Xiaomi | Mi 6X | 2018 | sensor, quality | partial |
| whyred | Xiaomi | Redmi Note 5 Pro | 2018 | ip, sensor, quality | partial |
| xmsirius | Xiaomi | Mi 8 SE | 2018 | refresh, ip, sensor, quality | partial |
| xz2c | Sony | Xperia XZ2 Compact | 2018 | wireless_watts_missing, sensor, quality | partial |
| zangya | BQ | Aquaris X2 | 2018 | refresh, ip, sensor, quality | partial |
| zangyapro | BQ | Aquaris X2 Pro | 2018 | refresh, ip, sensor, quality | partial |
| G | 10.or | G | 2017 | charge_missing, refresh, ip, sensor, quality | partial |
| Mi8917 | Xiaomi | Redmi 5A | 2017 | ip, sensor, quality | partial |
| Mi8937 | Xiaomi | Redmi 4 (India) | 2017 | ip, sensor, quality | partial |
| NB1 | Nokia | 8 | 2017 | refresh, ip, sensor, quality | partial |
| a5y17lte | Samsung | Galaxy A5 (2017) | 2017 | sensor, quality | partial |
| a7y17lte | Samsung | Galaxy A7 (2017) | 2017 | sensor, quality | partial |
| albus | Motorola | moto z2 play | 2017 | ip, sensor, quality | partial |
| bardock | BQ | Aquaris X | 2017 | refresh, ip, sensor, quality | partial |
| bardockpro | BQ | Aquaris X Pro | 2017 | refresh, ip, sensor, quality | partial |
| cedric | Motorola | moto g5 | 2017 | ip, sensor, quality | partial |
| cheeseburger | OnePlus | 5 | 2017 | ip, sensor, quality | partial |
| cheryl | Razer | Phone | 2017 | ip, sensor, quality | partial |
| chiron | Xiaomi | Mi MIX 2 | 2017 | ip, sensor, quality | partial |
| dumpling | OnePlus | 5T | 2017 | ip, sensor, quality | partial |
| figo | Huawei | P Smart | 2017 | refresh, ip, sensor, quality | partial |
| h870 | LG | G6 (EU Unlocked) | 2017 | refresh, sensor, quality | partial |
| h870d | LG | G6 (EU Unlocked - ENG BL) | 2017 | refresh, sensor, quality | partial |
| h872 | LG | G6 (T-Mobile) | 2017 | wireless_watts_missing, refresh, sensor, quality | partial |
| h873 | LG | G6 (Canada - ENG BL) | 2017 | refresh, sensor, quality | partial |
| h932 | LG | V30 (T-Mobile) | 2017 | refresh, sensor, quality | partial |
| jason | Xiaomi | Mi Note 3 | 2017 | refresh, ip, sensor, quality | partial |
| joan | LG | V30 (Unlocked) | 2017 | refresh, sensor, quality | partial |
| l01k | LG | V30 (Japan) | 2017 | refresh, sensor, quality | partial |
| mata | Essential | PH-1 | 2017 | refresh, ip, sensor, quality | partial |
| mido | Xiaomi | Redmi Note 4 | 2017 | refresh, ip, sensor, quality | partial |
| montana | Motorola | moto g5s | 2017 | ip, sensor, quality | partial |
| nash | Motorola | moto z2 force | 2017 | ip, sensor, quality | partial |
| nx563j | Nubia | Z17 | 2017 | refresh, ip, sensor, quality | partial |
| payton | Motorola | moto x4 | 2017 | sensor, quality | partial |
| sagit | Xiaomi | Mi 6 | 2017 | ip, sensor, quality | partial |
| santoni | Xiaomi | Redmi 4(X) | 2017 | refresh, ip, sensor, quality | partial |
| taimen | Google | Pixel 2 XL | 2017 | sensor, quality | partial |
| tissot | Xiaomi | Mi A1 | 2017 | ip, sensor, quality | partial |
| us997 | LG | G6 (US Unlocked) | 2017 | wireless_watts_missing, refresh, sensor, quality | partial |
| walleye | Google | Pixel 2 | 2017 | sensor, quality | partial |
| zl1 | LeEco | Le Pro3 Elite | 2017 | refresh, ip, sensor, quality | partial |
| A6020 | Lenovo | Vibe K5 | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| addison | Motorola | moto z play | 2016 | ip, sensor, quality | partial |
| athene | Motorola | moto g4 | 2016 | refresh, ip, sensor, quality | partial |
| axon7 | ZTE | Axon 7 | 2016 | refresh, ip, sensor, quality | partial |
| capricorn | Xiaomi | Mi 5s | 2016 | sensor, quality | partial |
| chaozu | BQ | Aquaris U | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| ether | Nextbit | Robin | 2016 | refresh, ip, sensor, quality | partial |
| f1f | OPPO | F1 (International) | 2016 | charge_missing, refresh, ip, quality | partial |
| gemini | Xiaomi | Mi 5 | 2016 | refresh, ip, sensor, quality | partial |
| gohan | BQ | Aquaris X5 Plus | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| griffin | Motorola | moto z | 2016 | ip, sensor, quality | partial |
| h830 | LG | G5 (T-Mobile) | 2016 | refresh, ip, sensor, quality | partial |
| h850 | LG | G5 (International) | 2016 | refresh, ip, sensor, quality | partial |
| h910 | LG | V20 (AT&T) | 2016 | refresh, ip, sensor, quality | partial |
| h918 | LG | V20 (T-Mobile) | 2016 | refresh, ip, sensor, quality | partial |
| h990 | LG | V20 (Global) | 2016 | refresh, ip, sensor, quality | partial |
| harpia | Motorola | moto g4 play | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| hero2lte | Samsung | Galaxy S7 Edge | 2016 | refresh, sensor, quality | partial |
| herolte | Samsung | Galaxy S7 | 2016 | refresh, sensor, quality | partial |
| hydrogen | Xiaomi | Mi Max | 2016 | refresh, ip, sensor, quality | partial |
| ido | Xiaomi | Redmi 3 | 2016 | refresh, ip, sensor, quality | partial |
| kenzo | Xiaomi | Redmi Note 3 | 2016 | refresh, ip, sensor, quality | partial |
| kugo | Sony | Xperia X Compact | 2016 | refresh, ip, sensor, quality | partial |
| kuntao | Lenovo | P2 | 2016 | refresh, ip, sensor, quality | partial |
| land | Xiaomi | Redmi 3S / 3X | 2016 | refresh, ip, sensor, quality | partial |
| lithium | Xiaomi | Mi MIX | 2016 | refresh, ip, sensor, quality | partial |
| ls997 | LG | V20 (Sprint) | 2016 | refresh, ip, sensor, quality | partial |
| m216 | LG | K10 | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| marlin | Google | Pixel XL | 2016 | sensor, quality | partial |
| natrium | Xiaomi | Mi 5s Plus | 2016 | ip, sensor, quality | partial |
| oneplus3 | OnePlus | 3 | 2016 | ip, sensor, quality | partial |
| pme | HTC | 10 | 2016 | refresh, ip, sensor, quality | partial |
| rs988 | LG | G5 (US Unlocked) | 2016 | refresh, ip, sensor, quality | partial |
| s2 | LeEco | Le 2 | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| sailfish | Google | Pixel | 2016 | sensor, quality | partial |
| scorpio | Xiaomi | Mi Note 2 | 2016 | refresh, ip, sensor, quality | partial |
| suzu | Sony | Xperia X | 2016 | refresh, ip, sensor, quality | partial |
| tenshi | BQ | Aquaris U Plus | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| tulip | ZTE | Axon 7 Mini | 2016 | ip, sensor, quality | partial |
| us996 | LG | V20 (GSM Unlocked) | 2016 | refresh, ip, sensor, quality | partial |
| us996d | LG | V20 (GSM Unlocked - DirtySanta) | 2016 | refresh, ip, sensor, quality | partial |
| vs995 | LG | V20 (Verizon) | 2016 | refresh, ip, sensor, quality | partial |
| x2 | LeEco | Le Max2 | 2016 | charge_missing, refresh, ip, sensor, quality | partial |
| z2_plus | ZUK | Z2 Plus | 2016 | refresh, ip, sensor, quality | partial |
| zenfone3 | ASUS | Zenfone 3 | 2016 | refresh, sensor, quality | partial |
| FP2 | Fairphone | 2 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| Z008 | ASUS | Zenfone 2 (720p) | 2015 | charge_missing, refresh, sensor, quality | partial |
| Z00A | ASUS | Zenfone 2 (1080p) | 2015 | charge_missing, refresh, sensor, quality | partial |
| Z00D | ASUS | Zenfone 2 (ZE500CL) | 2015 | charge_missing, refresh, sensor, quality | partial |
| Z00L | ASUS | Zenfone 2 Laser (720p) | 2015 | charge_missing, refresh, sensor, quality | partial |
| Z00T | ASUS | Zenfone 2 Laser (1080p) | 2015 | charge_missing, refresh, sensor, quality | partial |
| a3xelte | Samsung | Galaxy A3 (2016) | 2015 | sensor, quality | partial |
| a5xelte | Samsung | Galaxy A5 (2016) | 2015 | ip, sensor, quality | partial |
| a7xelte | Samsung | Galaxy A7 (2016) | 2015 | ip, sensor, quality | partial |
| angler | Google | Nexus 6P | 2015 | refresh, ip, sensor, quality | partial |
| bullhead | Google | Nexus 5X | 2015 | refresh, ip, sensor, quality | partial |
| clark | Motorola | moto x pure edition (2015) | 2015 | refresh, ip, sensor, quality | partial |
| crackling | Wileyfox | Swift | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| h811 | LG | G4 (T-Mobile) | 2015 | refresh, ip, sensor, quality | partial |
| h815 | LG | G4 (International) | 2015 | refresh, ip, sensor, quality | partial |
| ham | ZUK | Z1 | 2015 | refresh, ip, sensor, quality | partial |
| hiae | HTC | One A9 | 2015 | refresh, ip, sensor, quality | partial |
| himaul | HTC | One M9 (GSM) | 2015 | charge_missing, refresh, sensor, quality | partial |
| himawl | HTC | One M9 (Verizon) | 2015 | charge_missing, refresh, sensor, quality | partial |
| ivy | Sony | Xperia Z3+ | 2015 | refresh, sensor, quality | partial |
| j7elte | Samsung | Galaxy J7 (2015) | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| jalebi | YU | Yunique | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| kipper | Wileyfox | Storm | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| kiwi | Huawei | Honor 5X | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| lettuce | YU | Yuphoria | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| libra | Xiaomi | Mi 4c | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| lux | Motorola | moto x play | 2015 | refresh, ip, sensor, quality | partial |
| merlin | Motorola | moto g3 turbo | 2015 | refresh, sensor, quality | partial |
| n3 | OPPO | N3 | 2015 | charge_missing, refresh, sensor, quality | partial |
| nx512j | Nubia | Z9 Max | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| oneplus2 | OnePlus | 2 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| onyx | OnePlus | X | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| osprey | Motorola | moto g (2015) | 2015 | charge_missing, refresh, sensor, quality | partial |
| otus | Motorola | moto e (2015) | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| paella | BQ | Aquaris X5 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| peach | ARK | Benefit A3 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| piccolo | BQ | Aquaris M5 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| r5 | OPPO | R5s (International) | 2015 | charge_missing, refresh, ip, quality | partial |
| r7plus | OPPO | R7 Plus (International) | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| r7sf | OPPO | R7s (International) | 2015 | charge_missing, refresh, ip, quality | partial |
| s5neolte | Samsung | Galaxy S5 Neo | 2015 | charge_missing, refresh, sensor, quality | partial |
| seed | Google | Android One 2nd Gen | 2015 | charge_missing, refresh, sensor, quality | partial |
| sumire | Sony | Xperia Z5 | 2015 | refresh, sensor, quality | partial |
| surnia | Motorola | moto e LTE (2015) | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| suzuran | Sony | Xperia Z5 Compact | 2015 | refresh, sensor, quality | partial |
| thea | Motorola | moto g LTE (2014) | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| tomato | YU | Yureka Plus | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| vegetalte | BQ | Aquaris E5s | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| wt88047 | Wingtech | Redmi 2 | 2015 | charge_missing, refresh, ip, sensor, quality | partial |
| zerofltexx | Samsung | Galaxy S6 | 2015 | refresh, ip, sensor, quality | partial |
| zeroltexx | Samsung | Galaxy S6 Edge | 2015 | refresh, ip, sensor, quality | partial |


## Progress

- Inventory generated for Sprint 8 board.
