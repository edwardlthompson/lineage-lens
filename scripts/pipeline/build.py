#!/usr/bin/env python3
"""Build examples/web/public/data/devices.json from wiki + CSV + GSMArena cache."""

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
from scripts.pipeline.gsmarena import extract_ip_rating  # noqa: E402
from scripts.pipeline.lineage_status import (  # noqa: E402
    codename_branch_map,
    fetch_download_builds,
    resolve_status,
)
from scripts.pipeline.scores import apply_scores  # noqa: E402
from scripts.pipeline.enrichment_quality import (  # noqa: E402
    assign_provenance_quality,
    fill_structured_video_from_caps,
)
from scripts.pipeline.flagship_overrides import (  # noqa: E402
    apply_flagship_overrides,
    load_flagship_overrides,
)
from scripts.pipeline.optical import fill_camera_derived_fields  # noqa: E402
from scripts.pipeline.sensor_catalog import (  # noqa: E402
    ensure_front_from_sensors,
    fill_sensor_sizes,
    promote_unlabeled_fronts,
)
from scripts.pipeline.sensor_models import (  # noqa: E402
    apply_sensors_to_cameras,
    load_sensor_cache,
)
from scripts.pipeline.wiki import iter_wiki_devices  # noqa: E402
from scripts.pipeline.wikipedia_ip import load_ip_cache  # noqa: E402


def _load_gsmarena_cache(cache_dir: Path) -> dict[str, dict]:
    root = cache_dir / "gsmarena"
    out: dict[str, dict] = {}
    if not root.is_dir():
        return out
    for path in root.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if data.get("error") or not data.get("cameras"):
            continue
        out[path.stem.lower()] = data
    return out


def _fill_waterproofing(device: dict, wiki_ip: dict[str, str]) -> None:
    """Prefer existing / CSV / GSMArena; else Wikipedia cache; else peripherals text."""
    if device.get("waterproofing"):
        return
    code = str(device.get("codename") or "").lower()
    if code and code in wiki_ip:
        device["waterproofing"] = wiki_ip[code]
        return
    peri = device.get("peripherals") or []
    blob = " ".join(str(p) for p in peri)
    found = extract_ip_rating(blob)
    if found:
        device["waterproofing"] = found


def _apply_lineage_status(device: dict, branch_by_code: dict[str, str]) -> None:
    """Overwrite status from download.lineageos.org using codename (never leave unknown)."""
    resolved = resolve_status(
        str(device.get("codename") or ""),
        branch_by_code=branch_by_code,
        wiki_maintainers=list(device.get("maintainers") or []),
        wiki_branch=device.get("current_branch"),
    )
    device["status"] = resolved["status"]
    device["current_branch"] = resolved["current_branch"]
    device["lineage_label"] = resolved["lineage_label"]


def _refresh_camera_aggregates(device: dict) -> None:
    cams = list(device.get("cameras") or [])
    fill_sensor_sizes(cams)
    device["cameras"] = cams
    agg = dict(device.get("aggregates") or {})
    main = next((c for c in cams if c.get("type") in {"main", "wide"}), None)
    if main:
        if main.get("sensor_size_mm") is not None:
            agg["main_sensor_size"] = main["sensor_size_mm"]
        if main.get("optical_format") is not None:
            agg["main_optical_format"] = main["optical_format"]
        if main.get("pixel_pitch_um") is not None:
            agg["main_pixel_pitch"] = main["pixel_pitch_um"]
    agg["camera_module_count"] = len(cams)
    agg["rear_module_count"] = sum(1 for c in cams if c.get("type") != "front")
    agg["has_front"] = any(c.get("type") == "front" for c in cams)
    device["aggregates"] = agg


def _finalize_cameras(device: dict, sensors_by_code: dict[str, list]) -> None:
    """Promote selfie rows, attach sensor names/sizes, ensure front is in the stack."""
    cams = list(device.get("cameras") or [])
    promote_unlabeled_fronts(cams)
    code = str(device.get("codename") or "").lower()
    sensors = list(sensors_by_code.get(code) or [])
    if sensors:
        apply_sensors_to_cameras(cams, sensors)
        ensure_front_from_sensors(cams, sensors)
        sources = list((device.get("provenance") or {}).get("data_sources") or [])
        if "lineage_proprietary_files" not in sources:
            sources.append("lineage_proprietary_files")
            prov = dict(device.get("provenance") or {})
            prov["data_sources"] = sources
            device["provenance"] = prov
    device["cameras"] = cams
    _refresh_camera_aggregates(device)


def _apply_layer(device: dict, layer: dict, *, source: str, updated: str) -> None:
    """Merge enrichment layer onto device (non-destructive fill + override when richer)."""
    if not layer:
        return

    layer_cams = list(layer.get("cameras") or [])
    if layer_cams:
        # Prefer layer modules when they carry sensor geometry; else keep existing
        existing = list(device.get("cameras") or [])
        promote_unlabeled_fronts(existing)
        promote_unlabeled_fronts(layer_cams)
        layer_has_geo = any(c.get("sensor_size_mm") or c.get("optical_format") for c in layer_cams)
        existing_has_geo = any(c.get("sensor_size_mm") or c.get("optical_format") for c in existing)
        if layer_has_geo or not existing:
            # Always keep selfie module(s) from wiki when enrichment CSV omits them
            fronts = [c for c in existing if c.get("type") == "front"]
            layer_fronts = [c for c in layer_cams if c.get("type") == "front"]
            device["cameras"] = layer_cams + ([] if layer_fronts else fronts)
        elif not existing_has_geo:
            device["cameras"] = layer_cams

    if layer.get("video"):
        device["video"] = layer["video"]
    if layer.get("camera_features"):
        device["camera_features"] = {
            **(device.get("camera_features") or {}),
            **layer["camera_features"],
        }
    if layer.get("waterproofing"):
        device["waterproofing"] = layer["waterproofing"]
    if layer.get("release_year") and not device.get("release_year"):
        device["release_year"] = layer["release_year"]
        device["release_date"] = layer.get("release_date") or device.get("release_date")

    agg = dict(device.get("aggregates") or {})
    for k, v in (layer.get("aggregates") or {}).items():
        if v is not None:
            agg[k] = v
    agg["camera_module_count"] = len(device.get("cameras") or [])
    device["aggregates"] = agg

    sources = list((device.get("provenance") or {}).get("data_sources") or [])
    if source not in sources:
        sources.append(source)

    # quality is assigned later via enrichment_quality (completeness gate)
    quality = (device.get("provenance") or {}).get("quality") or "wiki_only"
    if source in {"camera_enrichment_csv", "gsmarena"} and quality == "wiki_only":
        quality = "partial"

    device["provenance"] = {
        "data_sources": sources,
        "quality": quality,
        "last_updated": updated,
    }
    if layer.get("gsmarena_url"):
        device["gsmarena_url"] = layer["gsmarena_url"]


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
    gsm = _load_gsmarena_cache(cache_dir)
    wiki_ip = load_ip_cache(cache_dir)
    sensors_by_code = load_sensor_cache(
        cache_dir, seed_path=ROOT / "data" / "raw" / "sensor_models_seed.json"
    )
    flagship_ov = load_flagship_overrides()
    branches = fetch_download_builds(cache_dir / "lineage_download_devices.json")
    branch_by_code = codename_branch_map(branches)
    wiki_devices = iter_wiki_devices(devices_dir, updated=updated)

    merged: list[dict] = []
    csv_hits = 0
    gsm_hits = 0
    for device in wiki_devices:
        key = device["codename"].lower()
        if key in gsm:
            _apply_layer(device, gsm[key], source="gsmarena", updated=updated)
            gsm_hits += 1
        if key in enrichment:
            _apply_layer(device, enrichment[key], source="camera_enrichment_csv", updated=updated)
            csv_hits += 1
        _fill_waterproofing(device, wiki_ip)
        _finalize_cameras(device, sensors_by_code)
        apply_flagship_overrides(device, flagship_ov)
        fill_camera_derived_fields(device.get("cameras") or [])
        _refresh_camera_aggregates(device)
        fill_structured_video_from_caps(device)
        assign_provenance_quality(device)
        _apply_lineage_status(device, branch_by_code)
        apply_scores(device)
        merged.append(device)

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
            "status": "discontinued",
            "wiki_url": f"https://wiki.lineageos.org/devices/{code}/",
            "download_url": f"https://download.lineageos.org/devices/{code}",
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
            "cameras": [],
            "video": None,
            "aggregates": {},
            "scores": {},
            "camera_features": {},
            "provenance": {
                "data_sources": [],
                "quality": "partial",
                "last_updated": updated,
            },
        }
        if code in gsm:
            _apply_layer(stub, gsm[code], source="gsmarena", updated=updated)
        _apply_layer(stub, enr, source="camera_enrichment_csv", updated=updated)
        _fill_waterproofing(stub, wiki_ip)
        _finalize_cameras(stub, sensors_by_code)
        apply_flagship_overrides(stub, flagship_ov)
        fill_camera_derived_fields(stub.get("cameras") or [])
        _refresh_camera_aggregates(stub)
        fill_structured_video_from_caps(stub)
        assign_provenance_quality(stub)
        _apply_lineage_status(stub, branch_by_code)
        apply_scores(stub)
        merged.append(stub)

    merged.sort(
        key=lambda d: (
            (d.get("scores") or {}).get("camera_score")
            or (d.get("aggregates") or {}).get("main_sensor_size")
            or 0
        ),
        reverse=True,
    )

    complete_count = sum(1 for d in merged if d["provenance"]["quality"] == "complete")
    enriched_count = sum(1 for d in merged if d["provenance"]["quality"] == "enriched")
    partial_count = sum(1 for d in merged if d["provenance"]["quality"] == "partial")
    payload = {
        "generated_at": updated,
        "source_wiki_ref": wiki_ref,
        "device_count": len(merged),
        "complete_count": complete_count,
        "enriched_count": enriched_count,
        "partial_count": partial_count,
        "devices": merged,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    missing_main = sum(
        1 for d in merged if (d.get("aggregates") or {}).get("main_sensor_size") is None
    )
    print(f"Wrote {out_path}")
    print(f"  devices: {len(merged)}")
    print(f"  complete quality: {complete_count}")
    print(f"  enriched quality: {enriched_count}")
    print(f"  partial quality: {partial_count}")
    print(f"  csv joins: {csv_hits}  gsmarena joins: {gsm_hits}")
    print(f"  download API codenames: {len(branch_by_code)}")
    with_sensors = sum(
        1
        for d in merged
        if any(c.get("sensor_model") for c in (d.get("cameras") or []))
    )
    print(f"  devices with sensor names: {with_sensors}")
    print(f"  missing main_sensor_size: {missing_main} ({100 * missing_main / max(1, len(merged)):.1f}%)")

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
