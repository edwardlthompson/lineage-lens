"""Parse LineageOS wiki device YAML files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Optional

import yaml

_MP_INFO = re.compile(
    r"(?P<mp>\d+(?:\.\d+)?)\s*MP(?:\s*\((?P<label>[^)]+)\))?",
    re.IGNORECASE,
)


def _as_list(val: Any) -> list[Any]:
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [val]


def _nullish(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, str) and val.strip().lower() in {"", "none", "null", "nil"}:
        return None
    return val


def _flatten_polymorphic(val: Any) -> Any:
    """battery/screen/release may be object or list of {Model: value}."""
    val = _nullish(val)
    if val is None:
        return None
    if isinstance(val, list):
        merged: dict[str, Any] = {}
        for item in val:
            if isinstance(item, dict):
                for k, v in item.items():
                    merged[str(k)] = v
            else:
                return val
        return merged or None
    if isinstance(val, (str, int, float, bool)):
        # Schema expects object|null for screen/battery/dimensions
        return {"value": val}
    return val


def _parse_release_year(release: Any) -> tuple[Optional[str], Optional[int]]:
    """Extract a display string + year from polymorphic release fields."""
    release = _nullish(release)
    if release is None:
        return None, None

    candidates: list[str] = []

    def walk(node: Any, depth: int = 0) -> None:
        if depth > 4 or node is None:
            return
        if isinstance(node, dict):
            for v in node.values():
                walk(v, depth + 1)
            return
        if isinstance(node, list):
            for item in node:
                walk(item, depth + 1)
            return
        s = str(node).strip()
        if s and s.lower() not in {"none", "null"}:
            candidates.append(s)

    walk(release)
    if not candidates:
        return None, None
    s = candidates[0]
    m = re.search(r"(20\d{2})", " ".join(candidates))
    year = int(m.group(1)) if m else None
    return s, year


def _camera_type_from_label(label: Optional[str], flash: Any, index: int) -> str:
    lab = (label or "").lower()
    if any(x in lab for x in ("front", "selfie")):
        return "front"
    if "ultra" in lab or "uw" in lab:
        return "ultrawide"
    if "tele" in lab or "periscope" in lab:
        return "telephoto"
    if "macro" in lab:
        return "macro"
    if "depth" in lab or "tof" in lab:
        return "depth"
    if "wide" in lab or "main" in lab or "primary" in lab:
        return "main"
    if flash is None and index > 0:
        return "front"
    if index == 0:
        return "main"
    return "other"


def parse_wiki_cameras(raw: Any) -> list[dict[str, Any]]:
    cameras: list[dict[str, Any]] = []
    for i, cam in enumerate(_as_list(raw)):
        if not isinstance(cam, dict):
            continue
        info = cam.get("info")
        flash = cam.get("flash")
        flash_s = None if flash is None else str(flash)
        if info is None:
            cameras.append(
                {
                    "type": _camera_type_from_label(None, flash, i),
                    "flash": flash_s,
                    "info": None,
                    "mp": None,
                }
            )
            continue
        info_s = str(info)
        matches = list(_MP_INFO.finditer(info_s))
        if not matches:
            cameras.append(
                {
                    "type": _camera_type_from_label(None, flash, i),
                    "flash": flash_s,
                    "info": info_s,
                    "mp": None,
                }
            )
            continue
        for j, m in enumerate(matches):
            cameras.append(
                {
                    "type": _camera_type_from_label(m.group("label"), flash, i if j == 0 else i + j),
                    "mp": float(m.group("mp")),
                    "flash": flash_s if j == 0 else None,
                    "info": info_s if j == 0 else None,
                }
            )
    return cameras


def support_status(maintainers: list[str], current_branch: Any, versions: list[Any]) -> str:
    has_maintainer = any(str(m).strip() for m in maintainers)
    branch = str(current_branch).strip() if current_branch is not None else ""
    if not has_maintainer:
        return "discontinued"
    if branch.lower() in {"", "none", "null"}:
        return "discontinued"
    # experimental heuristic: only very old or single experimental tag
    ver_s = " ".join(str(v) for v in versions).lower()
    if "experimental" in ver_s and len(versions) <= 1:
        return "experimental"
    return "current"


def load_device_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def wiki_device_to_record(data: dict[str, Any], *, updated: str) -> dict[str, Any]:
    codename = str(data.get("codename") or "").strip()
    if not codename:
        raise ValueError("missing codename")
    variant = data.get("variant")
    if variant is not None:
        try:
            variant = int(variant)
        except (TypeError, ValueError):
            variant = None
    device_id = f"{codename}_v{variant}" if variant else codename

    maintainers = [str(m) for m in _as_list(data.get("maintainers")) if m is not None]
    versions = [str(v) for v in _as_list(data.get("versions"))]
    models = [str(m) for m in _as_list(data.get("models")) if m is not None]
    release_date, release_year = _parse_release_year(data.get("release"))
    cameras = parse_wiki_cameras(data.get("cameras"))
    current_branch = data.get("current_branch")
    status = support_status(maintainers, current_branch, versions)

    vendor = str(data.get("vendor") or data.get("vendor_short") or "").strip()
    name = str(data.get("name") or codename).strip()
    dtype = str(data.get("type") or "other").strip().lower()

    wiki_slug = codename
    record: dict[str, Any] = {
        "id": device_id,
        "codename": codename,
        "variant": variant,
        "vendor": vendor,
        "name": name,
        "models": models,
        "type": dtype,
        "release_date": release_date,
        "release_year": release_year,
        "image": data.get("image"),
        "versions": versions,
        "current_branch": None if current_branch is None else str(current_branch),
        "maintainers": maintainers,
        "first_supported_date": None,
        "status": status,
        "wiki_url": f"https://wiki.lineageos.org/devices/{wiki_slug}/",
        "download_url": f"https://download.lineageos.org/devices/{wiki_slug}",
        "soc": None if data.get("soc") is None else str(data.get("soc")),
        "cpu": None if data.get("cpu") is None else str(data.get("cpu")),
        "cpu_cores": None if data.get("cpu_cores") is None else str(data.get("cpu_cores")),
        "cpu_freq": None if data.get("cpu_freq") is None else str(data.get("cpu_freq")),
        "gpu": None if data.get("gpu") is None else str(data.get("gpu")),
        "ram": None if data.get("ram") is None else str(data.get("ram")),
        "storage": None if data.get("storage") is None else str(data.get("storage")),
        "screen": _flatten_polymorphic(data.get("screen")),
        "battery": _flatten_polymorphic(data.get("battery")),
        "dimensions": _flatten_polymorphic(data.get("dimensions")),
        "network": [str(n) for n in _as_list(data.get("network"))] or None,
        "wifi": None if data.get("wifi") is None else str(data.get("wifi")),
        "bluetooth": None if data.get("bluetooth") is None else str(data.get("bluetooth")),
        "peripherals": [str(p) for p in _as_list(data.get("peripherals"))] or None,
        "architecture": None if data.get("architecture") is None else str(data.get("architecture")),
        "waterproofing": None,
        "cameras": cameras,
        "video": None,
        "aggregates": _wiki_aggregates(cameras),
        "scores": {},
        "provenance": {
            "data_sources": ["lineage_wiki"],
            "quality": "wiki_only",
            "last_updated": updated,
        },
    }
    return record


def _wiki_aggregates(cameras: list[dict[str, Any]]) -> dict[str, Any]:
    main = next((c for c in cameras if c.get("type") in {"main", "wide"}), None)
    teles = [c for c in cameras if c.get("type") == "telephoto"]
    return {
        "main_sensor_size": None,
        "main_optical_format": None,
        "main_pixel_pitch": None,
        "has_ois_main": None,
        "has_telephoto": bool(teles) or any("tele" in str(c.get("info") or "").lower() for c in cameras),
        "max_optical_zoom": None,
        "camera_module_count": len(cameras),
        "combined_mp": None,
        "main_mp": None if main is None else main.get("mp"),
    }


def iter_wiki_devices(devices_dir: Path, *, updated: str) -> list[dict[str, Any]]:
    paths = sorted(devices_dir.glob("*.yml"))
    out: list[dict[str, Any]] = []
    for path in paths:
        try:
            data = load_device_yaml(path)
            out.append(wiki_device_to_record(data, updated=updated))
        except Exception as exc:  # noqa: BLE001 — collect and continue
            print(f"WARN: skip {path.name}: {exc}")
    return out
