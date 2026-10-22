# AGENT.md — original product brief (Sacred)

Copy this file to `AGENT.md` after clone and **before** `init-project`. Paste the
human’s original prompt **verbatim**. Bootstrap stamps `AGENTS.md` only and will
not overwrite this file. Later sessions: read this before any BUILD_PLAN sprint row.

<!-- agent-brief:one-liner -->
Camera-first LineageOS device specs and purchasing decision tool (static GitHub Pages).
<!-- /agent-brief:one-liner -->

<!-- agent-brief:keywords -->
lineageos, camera, sensor, OIS, comparison, static-site, github-pages
<!-- /agent-brief:keywords -->

## Product vision

Create a beautiful, fast, fully client-side static site that helps users make purchasing
decisions based primarily on camera hardware, while also showing LineageOS support
status, longevity, and other key specs.

### Key differentiators

- Deep camera data (sensor size / optical format, pixel pitch, OIS, focal lengths,
  multi-camera breakdown) far beyond the official LineageOS wiki.
- Superb multi-column sorting + faceted filtering.
- Interactive, responsive, decision-oriented charts.
- Side-by-side comparison and “find similar camera systems”.
- Clear signals for “still worth buying” based on camera quality + ongoing LineageOS
  maintenance.

### Inspiration / data sources

- Official data: https://github.com/LineageOS/lineage_wiki (`_data/devices/*.yml`)
- Timeline reference: https://dbeley.github.io/lineageos-devices-timeline/
- User deep camera spreadsheet (CSV in `data/raw/camera_enrichment.csv`)

## Tech stack (locked)

- Scaffold: `edwardlthompson/agent-project-bootstrap` → Web stack
- App: Vite + React + TypeScript under `examples/web/`
- Table: TanStack Table (+ virtualization)
- Charts: Recharts
- Styling: bootstrap design tokens (`var(--gp-*)`), not Tailwind
- Data pipeline: Python 3.11+ in `scripts/pipeline/`
- Deploy: GitHub Pages via GitHub Actions
- Data: `examples/web/public/data/devices.json` + JSON Schema

## Data model (high level)

Each device: identity (codename PK + variant), LineageOS support, core hardware,
deep `cameras[]`, aggregates for sort/filter, derived scores (camera / longevity /
worth_buying), provenance flags. Join key between wiki YAML and CSV: **codename**.

## Sprint priorities

1. Sprint 0 — Bootstrap + React foundation + schema
2. Sprint 1 — Data pipeline (wiki YAML + camera CSV → devices.json)
3. Sprint 2 — Core table UX (multi-sort, facets, search, shareable URLs)
4. Sprint 3 — Charts linked to table filters
5. Sprint 4 — Comparison, scoring, similar devices
6. Sprint 5 — Detail pages, About/methodology, polish, automated data refresh

## Rules for agents

- Prefer static generation and client-side interactivity. No backend.
- Camera data quality is uneven — UI must handle missing fields and show provenance.
- Keep the data pipeline idempotent and easy to re-run.
- Codename is the stable join key; variants use `(codename, variant)`.
- Do not commit `data/cache/` (wiki clone). Do commit `data/raw/camera_enrichment.csv`.
- Mobile-first: the site must feel usable on a phone in a store.

## First milestone

Sprint 0 + Sprint 1: scaffolded React app, Device schema/types, pipeline emitting
`devices.json`, minimal table proving the wiki↔CSV join.
