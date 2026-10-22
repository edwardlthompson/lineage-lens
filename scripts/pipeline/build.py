#!/usr/bin/env python3
"""Build examples/web/public/data/devices.json from wiki + camera CSV."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.csv_cameras import parse_enrichment_csv  # noqa: E402
from scripts.pipeline.fetch_wiki import ensure_wiki_devices  # noqa: E402
from scripts.pipeline.scores import apply_scores  # noqa: E402
from scripts.pipeline.wiki import iter_wiki_devices  # noqa: E402


def _merge(wiki_device: dict, enrichment: dict | None, *, updated: str) -> dict:
    if enrichment is None:
        apply_scores(wiki_device)
        return wiki_device

    # Prefer deep cameras from CSV; keep wiki flash/info modules that CSV lacks (e.g. front)
    deep = list(enrichment.get("cameras") or [])
    wiki_cams = wiki_device.get("cameras") or []
    fronts = [c for c in wiki_cams if c.get("type") == "front"]
    cameras = deep + fronts

    wiki_device["cameras"] = cameras
    wiki_device["video"] = enrichment.get("video")
    wiki_device["waterproofing"] = enrichment.get("waterproofing") or wiki_device.get("waterproofing")

    if enrichment.get("release_year") and not wiki_device.get("release_year"):
        wiki_device["release_year"] = enrichment["release_year"]
        wiki_device["release_date"] = enrichment.get("release_date") or wiki_device.get("release_date")

    agg = dict(wiki_device.get("aggregates") or {})
    agg.update({k: v for k, v in (enrichment.get("aggregates") or {}).items() if v is not None})
    agg["camera_module_count"] = len(cameras)
    wiki_device["aggregates"] = agg

    sources = list(wiki_device["provenance"]["data_sources"])
    if "camera_enrichment_csv" not in sources:
        sources.append("camera_enrichment_csv")
    wiki_device["provenance"] = {
        "data_sources": sources,
        "quality": "enriched",
        "last_updated": updated,
    }
    apply_scores(wiki_device)
    return wiki_device


def build(
    *,
    csv_path: Path,
    out_path: Path,
    cache_dir: Path,
    schema_path: Path | None,
    force_fetch: bool,
) -> dict:
    updated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    devices_dir, wiki_ref = ensure_wiki_devices(cache_dir, force=force_fetch)
    enrichment = parse_enrichment_csv(csv_path)
    wiki_devices = iter_wiki_devices(devices_dir, updated=updated)

    merged: list[dict] = []
    matched = 0
    for device in wiki_devices:
        key = device["codename"].lower()
        enr = enrichment.get(key)
        if enr is not None:
            matched += 1
        merged.append(_merge(device, enr, updated=updated))

    # CSV-only devices not found in wiki (still include for completeness)
    wiki_codes = {d["codename"].lower() for d in wiki_devices}
    for code, enr in enrichment.items():
        if code in wiki_codes:
            continue
        stub = {
            "id": code,
            "codename": code,
            "variant": None,
            "vendor": enr.get("vendor") or "",
            "name": enr.get("device_name") or code,
            "models": [],
            "type": "phone",
            "release_date": enr.get("release_date"),
            "release_year": enr.get("release_year"),
            "image": None,
            "versions": [],
            "current_branch": None,
            "maintainers": [],
            "first_supported_date": None,
            "status": "unknown",
            "wiki_url": None,
            "download_url": None,
            "soc": None,
            "cpu": None,
            "cpu_cores": None,
            "cpu_freq": None,
            "gpu": None,
            "ram": None,
            "storage": None,
            "screen": None,
            "battery": None,
            "dimensions": None,
            "network": None,
            "wifi": None,
            "bluetooth": None,
            "peripherals": None,
            "architecture": None,
            "waterproofing": enr.get("waterproofing"),
            "cameras": enr.get("cameras") or [],
            "video": enr.get("video"),
            "aggregates": enr.get("aggregates") or {},
            "scores": {},
            "provenance": {
                "data_sources": ["camera_enrichment_csv"],
                "quality": "partial",
                "last_updated": updated,
            },
        }
        apply_scores(stub)
        merged.append(stub)

    merged.sort(key=lambda d: ((d.get("aggregates") or {}).get("main_sensor_size") or 0), reverse=True)

    enriched_count = sum(1 for d in merged if d["provenance"]["quality"] == "enriched")
    payload = {
        "generated_at": updated,
        "source_wiki_ref": wiki_ref,
        "device_count": len(merged),
        "enriched_count": enriched_count,
        "devices": merged,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    missing_main = sum(
        1 for d in merged if (d.get("aggregates") or {}).get("main_sensor_size") is None
    )
    print(f"Wrote {out_path}")
    print(f"  devices: {len(merged)}")
    print(f"  enriched (csv join): {enriched_count} (matched wiki codenames: {matched})")
    print(f"  missing main_sensor_size: {missing_main} ({100 * missing_main / max(1, len(merged)):.1f}%)")
    print(f"  csv rows: {len(enrichment)}")

    if schema_path and schema_path.is_file():
        try:
            import jsonschema

            schema = json.loads(schema_path.read_text(encoding="utf-8"))
            jsonschema.validate(payload, schema)
            print("  schema: OK")
        except Exception as exc:  # noqa: BLE001
            print(f"  schema: FAIL — {exc}")
            raise

    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv",
        type=Path,
        default=ROOT / "data" / "raw" / "camera_enrichment.csv",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "examples" / "web" / "public" / "data" / "devices.json",
    )
    parser.add_argument(
        "--cache",
        type=Path,
        default=ROOT / "data" / "cache",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=ROOT / "schemas" / "device.schema.json",
    )
    parser.add_argument("--force-fetch", action="store_true")
    parser.add_argument("--skip-schema", action="store_true")
    args = parser.parse_args()

    build(
        csv_path=args.csv,
        out_path=args.out,
        cache_dir=args.cache,
        schema_path=None if args.skip_schema else args.schema,
        force_fetch=args.force_fetch,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
