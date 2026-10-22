# Build Plan

<!-- remaining-tally -->
**Remaining:** AGENT 11 · LOCAL 11 · CLOUD 0 · AUTO 1 · HUMAN 8 · ADB 1 · **21 open**
<!-- /remaining-tally -->

Live board for a product repo. Finished work: [`COMPLETED_TASKS.md`](COMPLETED_TASKS.md).

**Who:** `AGENT` code · `HUMAN` person · `ADB` device · `AUTO` CI/scripts
**Venue (AGENT only):** `[LOCAL]` This Computer · `[CLOUD]` Cursor Cloud — [`docs/adr/0008-agent-venue.md`](docs/adr/0008-agent-venue.md)
**State:** 🔲 open · ✅ done · ❌ blocked — reason

Format: `🔲 [AGENT][LOCAL] Short task — scope: path/prefix` (or `[CLOUD]`). Sequential `[AGENT]` first. Parallel scopes: [`docs/PARALLEL_AGENT_SCOPES.md`](docs/PARALLEL_AGENT_SCOPES.md). `/build` on This Computer picks LOCAL only; Cloud picks CLOUD only. HUMAN/ADB after automation → `HUMAN_BACKLOG.md`.

This file is the **child model**. After `init-project`, it becomes your `BUILD_PLAN.md`. On the bootstrap template, the live maintainer board is [`BUILD_PLAN.md`](BUILD_PLAN.md).

## Smoke gate (hard stop)

After every `[AGENT]` row: `python3 scripts/agent-run.py watch-agent-gates --once --autofix --scope auto`

After the **last** `[AGENT]`/`[AUTO]` row in a sprint is ✅, do **not** start the next sprint until this exits 0:

```bash
python3 scripts/agent-run.py smoke-sprint --require

```

That command re-smokes **every** ✅ row: no errors or crashes, plus startup time and load order. Details: [`docs/SPRINT_SMOKE.md`](docs/SPRINT_SMOKE.md). Fail → leave the last row open or ❌; fix; re-run. `/gates` wrap-up includes the same check.

---

## Product

Copy this shape when you add sprints: `### Sprint N — title`, then numbered rows. Keep it this short.

### Product (do not drift)

> Auto-managed from `AGENT.md` after init. Do not hand-edit inside markers. Read `AGENT.md` before any sprint row.

<!-- product-brief-sync:begin -->
> Read `AGENT.md` before any sprint row.

**One-liner:** Camera-first LineageOS device specs and purchasing decision tool (static GitHub Pages).
**Do not drift:** lineageos, camera, sensor, ois, comparison, static-site, github-pages

**Rules:**
- Prefer static generation and client-side interactivity. No backend.
- Camera data quality is uneven — UI must handle missing fields and show provenance.
- Keep the data pipeline idempotent and easy to re-run.
- Codename is the stable join key; variants use `(codename, variant)`.
- Do not commit `data/cache/` (wiki clone). Do commit `data/raw/camera_enrichment.csv`.
- Mobile-first: the site must feel usable on a phone in a store.

**First milestone:** Sprint 0 + Sprint 1: scaffolded React app, Device schema/types, pipeline emitting
<!-- product-brief-sync:end -->

### Sprint 0 — Bootstrap & React foundation

1. ✅ [AGENT][LOCAL] Write `AGENT.md` product brief; run `init-project.ps1` (web, prune) — scope: AGENT.md, scripts/
2. ✅ [AGENT][LOCAL] Add React + TanStack Table + Recharts to `examples/web/` — scope: examples/web/
3. ✅ [AGENT][LOCAL] Define Device TypeScript types + `schemas/device.schema.json` — scope: examples/web/src/types/, schemas/
4. 🔲 [HUMAN] Create GitHub repo + Pages (Actions); `setup-github-repo` when ready — scope: scripts/
5. 🔲 [HUMAN] Optional: `/brand` product branding pass — scope: branding/

### Sprint 1 — Data pipeline

1. ✅ [AGENT][LOCAL] Python pipeline: fetch/parse lineage_wiki YAMLs — scope: scripts/pipeline/
2. ✅ [AGENT][LOCAL] Ingest `data/raw/camera_enrichment.csv`; merge on codename; emit `devices.json` — scope: scripts/pipeline/, examples/web/public/data/
3. ✅ [AGENT][LOCAL] Minimal React table proving wiki↔CSV join — scope: examples/web/src/features/table/
4. ✅ [AUTO] Validate devices.json against JSON Schema in CI/local — scope: schemas/, scripts/pipeline/

### Sprint 2 — Core table UX

1. 🔲 [AGENT][LOCAL] Multi-sort, column visibility, faceted filters, fuzzy search — scope: examples/web/src/features/table/
2. 🔲 [AGENT][LOCAL] Shareable filter URLs + mobile responsive table — scope: examples/web/

### Sprint 3 — Charts

1. 🔲 [AGENT][LOCAL] Sensor size distribution + year scatter; chart click → table filter — scope: examples/web/src/features/charts/

### Sprint 4 — Comparison & scoring

1. 🔲 [AGENT][LOCAL] Multi-select comparison + worth-buying signals + similar devices — scope: examples/web/

### Sprint 5 — Polish & deploy

1. 🔲 [AGENT][LOCAL] Device detail + About/methodology; GitHub Action data refresh — scope: examples/web/, .github/
2. 🔲 [HUMAN] Enable GitHub Pages (Actions source); smoke on phone — scope: repo settings

### Waiting on a person

1. 🔲 [HUMAN] Push first remote + enable Pages when ready

### Open PRs (synced)

> Auto-managed on product repos too. Do not hand-edit rows inside the markers.

<!-- open-prs-sync:begin -->
_No open Dependabot or Release Please PRs._
<!-- open-prs-sync:end -->

### Template gaps (synced)

> Auto-managed Monday cron + `sync-template-gaps-build-plan`. Do not hand-edit inside markers. Plan-only — run `/upgrade` then name item numbers.

<!-- template-gaps-sync:begin -->
_No template gaps; .template-version matches upstream (or template maintainer N/A)._
<!-- template-gaps-sync:end -->

### UX & UI inventory

Complete list from construction gaps and `/ux-review`. Status is only planned / in_progress / done. `/build` does not execute these until `/ux-apply UX-NNN` (or a Sequential row). Follow [`docs/ux-ui-guidelines.md`](docs/ux-ui-guidelines.md) when shipping UI.

<!-- ux-inventory:begin -->
_No UX inventory items._
<!-- ux-inventory:end -->

### Local agent (This Computer)

Standing queue for This Computer. Rows: `🔲 [AGENT][LOCAL] … — scope: path`. `/build` claims these only. See [`docs/adr/0008-agent-venue.md`](docs/adr/0008-agent-venue.md).

<!-- local-agent-lane:begin -->
_No local agent items._
<!-- local-agent-lane:end -->

### Cloud agent (Cursor Cloud)

Standing queue for Cursor Cloud. Rows: `🔲 [AGENT][CLOUD] … — scope: path`. Cloud claims these only (`cursor/*`). Never edit Local lane or `[LOCAL]` rows.

<!-- cloud-agent-lane:begin -->
_No cloud agent items._
<!-- cloud-agent-lane:end -->

---

## Ongoing Maintenance

Not a checklist. GitHub Monday cron (`.github/workflows/weekly-health-check.yml`) already runs CI wait, security triage, parent template-gap BUILD_PLAN sync (this child board), radar, `update-deps` dry-run, Dependabot leftover list, open-PR BUILD_PLAN sync, and latest-release SBOM. Upgrade-sim stays on the template maintainer repo. `/ship` owns pre-release and the release tag.

If Monday cron is red: Cursor Automation `weekly-maintain`, then Grok Bot 4–5. Do not put those chores back on this board. [`docs/GROK_BOTS.md`](docs/GROK_BOTS.md) · [`docs/CURSOR_AUTOMATIONS.commercial.md`](docs/CURSOR_AUTOMATIONS.commercial.md)

---

## Archive

Older sprints: [`COMPLETED_TASKS.md`](COMPLETED_TASKS.md).
