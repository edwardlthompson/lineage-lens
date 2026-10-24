# Feature: buying-signals-phase1

Derive-only photo/video buying columns (main rank, zoom/UW, slow-mo, pro flags, worth-buying, gaps).

## Acceptance criteria

- ✅ Main / Zoom / Slow-mo / Pro video / Worth / Gaps columns on device table
- ✅ Pure helpers in `buyingSignals.ts` with unit tests
- ✅ i18n en/es keys under `table.col.*`

## Tests

- Automated: yes — `examples/web/src/features/table/buyingSignals.test.ts`

## Fallback validation

- Command: `npm test` in `examples/web`
