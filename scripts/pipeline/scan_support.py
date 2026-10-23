#!/usr/bin/env python3
"""Honest scan of LineageOS wiki device support status."""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
_CACHE = ROOT / "data" / "cache"
DEVICES_DIR = next(
    (
        p
        for p in (
            _CACHE / "lineage_wiki-main" / "_data" / "devices",
            _CACHE / "lineage_wiki-master" / "_data" / "devices",
        )
        if p.is_dir()
    ),
    _CACHE / "lineage_wiki-main" / "_data" / "devices",
)
OUT = ROOT / "data" / "raw" / "lineage_support_snapshot.json"


def as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def branch_sort_key(b: str | None) -> tuple:
    if not b:
        return (0.0, "")
    nums = re.findall(r"\d+(?:\.\d+)?", b)
    return (float(nums[0]) if nums else 0.0, b)


def main() -> int:
    if not DEVICES_DIR.is_dir():
        print("NO_CACHE: run python -m scripts.pipeline.build --force-fetch first")
        return 1

    paths = sorted(DEVICES_DIR.glob("*.yml"))
    rows = []
    errs = 0
    for p in paths:
        try:
            data = yaml.safe_load(p.open(encoding="utf-8")) or {}
        except Exception:
            errs += 1
            continue
        if not isinstance(data, dict):
            continue
        maintainers = [str(m).strip() for m in as_list(data.get("maintainers")) if str(m).strip()]
        versions = [str(v).strip() for v in as_list(data.get("versions"))]
        branch = data.get("current_branch")
        branch_s = None if branch is None else str(branch).strip()
        if branch_s in {"", "None", "null"}:
            branch_s = None
        current = bool(maintainers) and branch_s is not None
        rows.append(
            {
                "file": p.name,
                "codename": str(data.get("codename") or "").strip(),
                "name": str(data.get("name") or ""),
                "vendor": str(data.get("vendor") or ""),
                "type": str(data.get("type") or ""),
                "maintainers": maintainers,
                "versions": versions,
                "current_branch": branch_s,
                "current": current,
                "variant": data.get("variant"),
            }
        )

    current_rows = [r for r in rows if r["current"]]
    disc_rows = [r for r in rows if not r["current"]]
    cur_codes = {r["codename"] for r in current_rows}
    all_codes = {r["codename"] for r in rows}

    branch_counts = Counter(r["current_branch"] for r in current_rows)
    type_counts = Counter(r["type"] for r in current_rows)
    vendor_counts = Counter(r["vendor"] for r in current_rows)

    ver_on_current = Counter()
    for r in current_rows:
        for v in r["versions"]:
            ver_on_current[v] += 1

    no_maint_but_branch = [
        r for r in rows if not r["maintainers"] and r["current_branch"] is not None
    ]
    maint_no_branch = [r for r in rows if r["maintainers"] and r["current_branch"] is None]

    print(f"yaml_files={len(paths)} parsed={len(rows)} yaml_errors={errs}")
    print(f"rows_current={len(current_rows)} rows_not_current={len(disc_rows)}")
    print(f"unique_codenames_current={len(cur_codes)} unique_codenames_all={len(all_codes)}")
    print("current_by_branch:")
    for b, n in sorted(branch_counts.items(), key=lambda x: (-branch_sort_key(x[0])[0], x[0] or "")):
        print(f"  {b}: {n}")
    print("versions_listed_on_current_devices:")
    for v, n in sorted(ver_on_current.items(), key=lambda x: (-branch_sort_key(x[0])[0], x[0])):
        print(f"  {v}: {n}")
    print("current_by_type:")
    for t, n in type_counts.most_common():
        print(f"  {t}: {n}")
    print("current_top_vendors:")
    for v, n in vendor_counts.most_common(12):
        print(f"  {v}: {n}")
    print("samples_per_branch:")
    for b, _ in sorted(branch_counts.items(), key=lambda x: (-branch_sort_key(x[0])[0], x[0] or "")):
        for r in [x for x in current_rows if x["current_branch"] == b][:4]:
            print(
                f"  [{b}] {r['vendor']} {r['name']} ({r['codename']}) "
                f"maintainers={len(r['maintainers'])} versions={r['versions']}"
            )
    print(f"edge_no_maintainer_but_branch={len(no_maint_but_branch)}")
    print(f"edge_maintainer_but_no_branch={len(maint_no_branch)}")

    out = {
        "scanned_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "LineageOS/lineage_wiki _data/devices/*.yml",
        "method": {
            "currently_supported": "non-empty maintainers AND current_branch set",
            "current_branch": "active LineageOS version line for official builds",
            "versions": "historical official version list on that device YAML (not only current)",
            "row_vs_codename": "YAML rows may include variants of the same codename",
        },
        "totals": {
            "yaml_files": len(paths),
            "parsed_rows": len(rows),
            "rows_currently_supported": len(current_rows),
            "rows_not_currently_supported": len(disc_rows),
            "unique_codenames_all": len(all_codes),
            "unique_codenames_currently_supported": len(cur_codes),
            "yaml_parse_errors": errs,
            "edge_no_maintainer_but_branch": len(no_maint_but_branch),
            "edge_maintainer_but_no_branch": len(maint_no_branch),
        },
        "currently_supported_by_branch": {
            str(b): n
            for b, n in sorted(
                branch_counts.items(), key=lambda x: (-branch_sort_key(x[0])[0], x[0] or "")
            )
        },
        "versions_listed_on_currently_supported_devices": {
            str(v): n
            for v, n in sorted(
                ver_on_current.items(), key=lambda x: (-branch_sort_key(x[0])[0], x[0])
            )
        },
        "currently_supported_by_type": dict(type_counts.most_common()),
        "currently_supported_top_vendors": dict(vendor_counts.most_common(20)),
        "currently_supported_devices": [
            {
                "vendor": r["vendor"],
                "name": r["name"],
                "codename": r["codename"],
                "variant": r["variant"],
                "type": r["type"],
                "current_branch": r["current_branch"],
                "versions": r["versions"],
                "maintainers": r["maintainers"],
            }
            for r in sorted(
                current_rows,
                key=lambda x: (-branch_sort_key(x["current_branch"])[0], x["vendor"], x["name"]),
            )
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
