# Feature: device-detail-about-refresh

Sprint 5 — device detail sheet, About methodology, automated data refresh.

## Acceptance criteria

- ✅ Device name opens a detail dialog; `?device=` is shareable and survives table URL sync
- ✅ About includes methodology (sources, scores, comparison) echoing AGENT.md keywords
- ✅ `.github/workflows/data-refresh.yml` rebuilds `devices.json` on schedule / dispatch and opens a PR

## Tests

- Automated: yes — `deviceDetailUrl.test.ts`, `deviceDetailSummary.test.ts`, `methodologySection.test.ts`
