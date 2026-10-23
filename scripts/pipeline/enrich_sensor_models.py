#!/usr/bin/env python3
"""Fetch camera sensor part numbers from Lineage proprietary-files (resumable)."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.sensor_models import (  # noqa: E402
    fetch_sensors_for_codename,
    load_device_deps,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--devices",
        type=Path,
        default=ROOT / "examples" / "web" / "public" / "data" / "devices.json",
    )
    parser.add_argument("--cache", type=Path, default=ROOT / "data" / "cache")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    payload = json.loads(args.devices.read_text(encoding="utf-8"))
    devices = payload.get("devices") or []
    deps = load_device_deps(args.cache / "hudson_device_deps.json")
    sensor_dir = args.cache / "sensor_models"
    sensor_dir.mkdir(parents=True, exist_ok=True)

    seen: set[str] = set()
    work: list[dict] = []
    for d in devices:
        code = str(d.get("codename") or "").lower()
        if not code or code in seen:
            continue
        seen.add(code)
        if args.only_missing:
            if any(c.get("sensor_model") for c in (d.get("cameras") or [])):
                continue
            cache_path = sensor_dir / f"{code}.json"
            if cache_path.is_file() and not args.force:
                try:
                    cached = json.loads(cache_path.read_text(encoding="utf-8"))
                    if "sensors" in cached or cached.get("error"):
                        continue
                except json.JSONDecodeError:
                    pass
        work.append(d)
    if args.limit:
        work = work[: args.limit]

    ok = miss = 0
    for i, d in enumerate(work, 1):
        code = str(d["codename"]).lower()
        print(f"[{i}/{len(work)}] {d.get('vendor')} {d.get('name')} ({code}) …", flush=True)
        data = fetch_sensors_for_codename(
            code, deps, sensor_dir / f"{code}.json", force=args.force
        )
        n = len(data.get("sensors") or [])
        if n:
            ok += 1
            models = ", ".join(s["sensor_model"] for s in data["sensors"][:6])
            print(f"  OK {n}: {models}", flush=True)
        else:
            miss += 1
            print(f"  MISS {data.get('error')}", flush=True)
        time.sleep(args.delay)

    print(f"Done. ok={ok} miss={miss} cache={sensor_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
