# Data pipeline

Lineage Lens builds a static `devices.json` from:

1. **LineageOS wiki** device YAMLs (`LineageOS/lineage_wiki` → `_data/devices/*.yml`)
2. **Deep camera CSV** at [`data/raw/camera_enrichment.csv`](../data/raw/camera_enrichment.csv) (join key: `codename`)

## Prerequisites

- Python 3.11+
- `pip install -r requirements-pipeline.txt`

## Refresh data

```bash
# From repo root
python -m scripts.pipeline.build

# Force re-download of wiki ZIP into data/cache/
python -m scripts.pipeline.build --force-fetch
```

Outputs:

- [`examples/web/public/data/devices.json`](../examples/web/public/data/devices.json)
- Validates against [`schemas/device.schema.json`](../schemas/device.schema.json)

`data/cache/` is gitignored (wiki extract). Commit updated `devices.json` when you intentionally refresh production data.

## Enrichment CSV

- Two header rows (group labels, then column names).
- Columns cover Wide / Telephoto 1 / Telephoto 2 / Ultrawide, combined MP, video flags, release year.
- Devices present only in the CSV (not yet on the wiki) are emitted with `provenance.quality: partial`.

## Scores (v1)

- **camera_score** — sensor diagonal, pixel pitch, OIS, optical zoom (partial when wiki-only)
- **longevity_score** — maintainers + version count + current status
- **worth_buying_score** — camera + longevity − age penalty
