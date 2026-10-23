#!/usr/bin/env python3
"""Fill waterproofing via Wikipedia infobox IP ratings (resumable cache)."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.wikipedia_ip import fetch_device_ip  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--devices",
        type=Path,
        default=ROOT / "examples" / "web" / "public" / "data" / "devices.json",
    )
    parser.add_argument(
        "--cache",
        type=Path,
        default=ROOT / "data" / "cache" / "wikipedia_ip",
    )
    parser.add_argument("--limit", type=int, default=0, help="Max devices (0=all)")
    parser.add_argument("--delay", type=float, default=0.7, help="Seconds between requests")
    parser.add_argument("--only-missing", action="store_true", help="Skip devices that already have IP")
    parser.add_argument("--force", action="store_true", help="Refetch even when cached")
    args = parser.parse_args()

    payload = json.loads(args.devices.read_text(encoding="utf-8"))
    devices = payload.get("devices") or []
    seen: set[str] = set()
    work: list[dict] = []
    for d in devices:
        code = str(d.get("codename") or "").lower()
        if not code or code in seen:
            continue
        seen.add(code)
        if args.only_missing and d.get("waterproofing"):
            continue
        work.append(d)
    if args.limit:
        work = work[: args.limit]

    args.cache.mkdir(parents=True, exist_ok=True)
    ok = 0
    miss = 0
    skip = 0
    for i, d in enumerate(work, 1):
        code = str(d["codename"]).lower()
        cache_path = args.cache / f"{code}.json"
        if not args.force and cache_path.is_file():
            try:
                cached = json.loads(cache_path.read_text(encoding="utf-8"))
                if "ip" in cached or cached.get("error"):
                    if cached.get("ip"):
                        ok += 1
                    else:
                        miss += 1
                    skip += 1
                    continue
            except json.JSONDecodeError:
                pass

        vendor = str(d.get("vendor") or "")
        name = str(d.get("name") or code)
        print(f"[{i}/{len(work)}] {vendor} {name} ({code}) …", flush=True)
        ip = fetch_device_ip(vendor, name, cache_path, force=args.force)
        if ip:
            ok += 1
            print(f"  OK {ip}", flush=True)
        else:
            miss += 1
            print("  MISS", flush=True)
        time.sleep(args.delay)

    print(f"Done. ok={ok} miss={miss} skipped_cached={skip} cache={args.cache}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
