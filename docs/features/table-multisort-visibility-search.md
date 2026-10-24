# Feature: table-multisort-visibility-search

Sprint 2 — multi-sort, column visibility, faceted filters, fuzzy search.

## Acceptance criteria

- ✅ Shift+click column headers accumulates multi-sort (index badges)
- ✅ Columns panel toggles secondary buying/market columns (many hidden by default)
- ✅ Faceted column filters remain on vendor/status/quality/year/RAM/IP
- ✅ Global fuzzy search over vendor, name, codename, models, SoC
- ✅ i18n en/es for search / columns / multi-sort hint

## Tests

- Automated: yes — `fuzzySearch.test.ts`, `columnVisibility.test.ts`

## Fallback validation

- Command: `npm test` in `examples/web`
