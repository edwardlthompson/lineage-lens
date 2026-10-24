# Phone spec audit

Re-check every phone, foldable, and slider (645) from newest release date to oldest. The same ranking is shown in Settings.

## Rank

1. Maker spec page. Can fill a field alone. Wins a conflict.
2. Regulatory filing (FCC, EU energy label). Can fill the measurement that document states.
3. Teardown photo of a chip marking. Can fill that part number alone.
4. GSMArena spec page. Can fill a field the maker page does not state. Loses a conflict with the maker.
5. Reviews and other spec sites. Need a second source from ranks 1–4.
6. Wiki, forum, and the sensor catalog. Never a hardware fact. Catalog pitch and bitrate stay marked with `*`.

A stored value that contradicts rank 1 is corrected. A stored value that only a rank 5–6 page states is removed. Patents are not a spec source.

When battery capacity or charge watts differ by region, keep the global, North America, or EU figure as the default. Note India-only or China-only variants in the audit log. Do not average them.

## Restart

Collection restarted under this ranking. Newest year first. Sprints stay on the BUILD_PLAN.

## Where corrections go

- `examples/web/public/data/devices.json`
- `data/raw/flagship_camera_overrides.json`
- `examples/web/src/features/table/chargeCatalog.ts` for published watts

## Progress

Sprint 6 complete under the ranked-source rules.

- 2026–2025, 2024, 2023: full per-phone passes (charge, IP, sensors, screens). Maker wins conflicts. Global/NA/EU batteries preferred.
- 2022–2017: GSMArena (and maker where opened) charge rates written for published flagship and midrange models; placeholder `N MP` sensor labels cleared; Pixel part numbers without a maker name cleared. Codename variants that disagree on watts stay blank.
- 2016–2011: placeholder sensor purge across the year batches; charge left blank unless already cataloged. Many of these pages never published a watt number.

Unknown watts stay `--`. Do not invent them.
