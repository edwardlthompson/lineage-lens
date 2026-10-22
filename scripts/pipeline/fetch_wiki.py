"""Fetch LineageOS wiki device YAMLs into data/cache (idempotent)."""

from __future__ import annotations

import io
import shutil
import zipfile
from pathlib import Path
from urllib.request import Request, urlopen

WIKI_ZIP = "https://github.com/LineageOS/lineage_wiki/archive/refs/heads/master.zip"


def ensure_wiki_devices(cache_dir: Path, *, force: bool = False) -> tuple[Path, str]:
    """Return (devices_dir, source_ref). Downloads zip if missing."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    extract_root = cache_dir / "lineage_wiki-master"
    devices_dir = extract_root / "_data" / "devices"
    stamp = cache_dir / "wiki_ref.txt"

    if devices_dir.is_dir() and any(devices_dir.glob("*.yml")) and not force:
        ref = stamp.read_text(encoding="utf-8").strip() if stamp.exists() else "lineage_wiki@cached"
        return devices_dir, ref

    if extract_root.exists():
        shutil.rmtree(extract_root)

    print(f"Fetching {WIKI_ZIP} …")
    req = Request(WIKI_ZIP, headers={"User-Agent": "LineageLensPipeline/0.1"})
    with urlopen(req, timeout=180) as resp:  # noqa: S310 — fixed GitHub URL
        payload = resp.read()

    with zipfile.ZipFile(io.BytesIO(payload)) as zf:
        # Extract only _data/devices to save time/disk
        members = [m for m in zf.namelist() if "/_data/devices/" in m and m.endswith(".yml")]
        for name in members:
            zf.extract(name, cache_dir)

    # Zip root is lineage_wiki-master/
    if not devices_dir.is_dir():
        # fallback: find devices dir
        found = list(cache_dir.glob("*/_data/devices"))
        if not found:
            raise FileNotFoundError("Could not locate _data/devices after extract")
        devices_dir = found[0]
        extract_root = devices_dir.parent.parent

    ref = "lineage_wiki@master"
    stamp.write_text(ref + "\n", encoding="utf-8")
    count = len(list(devices_dir.glob("*.yml")))
    print(f"Cached {count} device YAML files → {devices_dir}")
    return devices_dir, ref
