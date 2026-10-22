"""Parse the two-row deep-camera enrichment CSV."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Optional

from .optical import optical_format_to_diagonal_mm, parse_zoom

# Column indices after the detail header row (row 1).
# Layout verified against data/raw/camera_enrichment.csv
IDX = {
    "vendor": 0,
    "device_name": 1,
    "codename": 2,
    "waterproofing": 3,
    # Wide / main
    "wide_mp": 4,
    "wide_mm": 5,
    "wide_angle": 6,
    "wide_size": 7,
    "wide_size_mm": 8,
    "wide_space": 9,
    "wide_ois": 10,
    # Telephoto 1
    "tele1_mp": 11,
    "tele1_mm": 12,
    "tele1_angle": 13,
    "tele1_mm_alt": 14,
    "tele1_angle_alt": 15,
    "tele1_size": 16,
    "tele1_size_mm": 17,
    "tele1_space": 18,
    "tele1_ois": 19,
    "tele1_zoom": 20,
    # Telephoto 2
    "tele2_mp": 21,
    "tele2_mm": 22,
    "tele2_angle": 23,
    "tele2_size": 24,
    "tele2_space": 25,
    "tele2_ois": 26,
    "tele2_zoom": 27,
    # Ultrawide
    "uw_mp": 28,
    "uw_mm": 29,
    "uw_angle": 30,
    "uw_size": 31,
    "uw_size_mm": 32,
    "uw_space": 33,
    "uw_ois": 34,
    "combined_mp": 35,
    "combined_sensors": 36,
    # 1080p flags 37-45
    "v1080_start": 37,
    # 4K flags 46-53
    "v4k_start": 46,
    "release_year": 54,
}

_V1080_KEYS = ["24", "30", "60", "120", "240", "320", "480", "960", "1920"]
_V4K_KEYS = ["24", "30", "60", "120", "HDR", "HDR10+", "Dolby", "10 Bit"]


def _cell(row: list[str], idx: int) -> str:
    if idx >= len(row):
        return ""
    return (row[idx] or "").strip()


def _num(raw: str) -> Optional[float]:
    if not raw:
        return None
    try:
        return float(raw.replace(",", ""))
    except ValueError:
        return None


def _bool(raw: str) -> Optional[bool]:
    if not raw:
        return None
    s = raw.strip().upper()
    if s in {"TRUE", "YES", "1", "Y"}:
        return True
    if s in {"FALSE", "NO", "0", "N"}:
        return False
    return None


def _module(
    *,
    type_: str,
    mp: str,
    mm: str,
    angle: str,
    size: str,
    size_mm: str,
    space: str,
    ois: str,
    zoom: str = "",
) -> Optional[dict[str, Any]]:
    if not any([mp, mm, angle, size, size_mm, space, ois, zoom]):
        return None
    optical = size or None
    size_mm_n = _num(size_mm)
    diag = size_mm_n if size_mm_n is not None else optical_format_to_diagonal_mm(optical)
    return {
        "type": type_,
        "mp": _num(mp),
        "optical_format": optical,
        "sensor_size_mm": diag,
        "pixel_pitch_um": _num(space),
        "focal_length_mm": _num(mm),
        "fov_deg": _num(angle),
        "ois": _bool(ois),
        "zoom": parse_zoom(zoom),
        "flash": None,
        "info": None,
        "sensor_model": None,
        "aperture": None,
    }


def parse_release_year(raw: str) -> tuple[Optional[str], Optional[int]]:
    if not raw:
        return None, None
    # e.g. "2022, July 09"
    import re

    m = re.search(r"(20\d{2})", raw)
    year = int(m.group(1)) if m else None
    return raw, year


def parse_enrichment_csv(path: Path) -> dict[str, dict[str, Any]]:
    """Return map codename → enrichment payload."""
    with path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    if len(rows) < 3:
        raise ValueError(f"CSV too short: {path}")

    # Skip group header (0) and column header (1)
    by_codename: dict[str, dict[str, Any]] = {}
    for row in rows[2:]:
        if not row or not any(c.strip() for c in row):
            continue
        codename = _cell(row, IDX["codename"]).lower()
        if not codename:
            continue

        cameras: list[dict[str, Any]] = []
        for mod in (
            _module(
                type_="main",
                mp=_cell(row, IDX["wide_mp"]),
                mm=_cell(row, IDX["wide_mm"]),
                angle=_cell(row, IDX["wide_angle"]),
                size=_cell(row, IDX["wide_size"]),
                size_mm=_cell(row, IDX["wide_size_mm"]),
                space=_cell(row, IDX["wide_space"]),
                ois=_cell(row, IDX["wide_ois"]),
            ),
            _module(
                type_="telephoto",
                mp=_cell(row, IDX["tele1_mp"]),
                mm=_cell(row, IDX["tele1_mm"]) or _cell(row, IDX["tele1_mm_alt"]),
                angle=_cell(row, IDX["tele1_angle"]) or _cell(row, IDX["tele1_angle_alt"]),
                size=_cell(row, IDX["tele1_size"]),
                size_mm=_cell(row, IDX["tele1_size_mm"]),
                space=_cell(row, IDX["tele1_space"]),
                ois=_cell(row, IDX["tele1_ois"]),
                zoom=_cell(row, IDX["tele1_zoom"]),
            ),
            _module(
                type_="telephoto",
                mp=_cell(row, IDX["tele2_mp"]),
                mm=_cell(row, IDX["tele2_mm"]),
                angle=_cell(row, IDX["tele2_angle"]),
                size=_cell(row, IDX["tele2_size"]),
                size_mm="",
                space=_cell(row, IDX["tele2_space"]),
                ois=_cell(row, IDX["tele2_ois"]),
                zoom=_cell(row, IDX["tele2_zoom"]),
            ),
            _module(
                type_="ultrawide",
                mp=_cell(row, IDX["uw_mp"]),
                mm=_cell(row, IDX["uw_mm"]),
                angle=_cell(row, IDX["uw_angle"]),
                size=_cell(row, IDX["uw_size"]),
                size_mm=_cell(row, IDX["uw_size_mm"]),
                space=_cell(row, IDX["uw_space"]),
                ois=_cell(row, IDX["uw_ois"]),
            ),
        ):
            if mod is not None:
                cameras.append(mod)

        v1080: dict[str, Optional[bool]] = {}
        for i, key in enumerate(_V1080_KEYS):
            v1080[key] = _bool(_cell(row, IDX["v1080_start"] + i))
        v4k: dict[str, Optional[bool]] = {}
        for i, key in enumerate(_V4K_KEYS):
            v4k[key] = _bool(_cell(row, IDX["v4k_start"] + i))

        release_raw, release_year = parse_release_year(_cell(row, IDX["release_year"]))
        main = next((c for c in cameras if c["type"] == "main"), None)
        teles = [c for c in cameras if c["type"] == "telephoto"]
        zooms = [c["zoom"] for c in teles if c.get("zoom") is not None]

        by_codename[codename] = {
            "vendor": _cell(row, IDX["vendor"]),
            "device_name": _cell(row, IDX["device_name"]),
            "waterproofing": _cell(row, IDX["waterproofing"]) or None,
            "cameras": cameras,
            "video": {"1080p": v1080, "4k": v4k},
            "release_date": release_raw,
            "release_year": release_year,
            "aggregates": {
                "main_sensor_size": None if main is None else main.get("sensor_size_mm"),
                "main_optical_format": None if main is None else main.get("optical_format"),
                "main_pixel_pitch": None if main is None else main.get("pixel_pitch_um"),
                "has_ois_main": None if main is None else main.get("ois"),
                "has_telephoto": bool(teles),
                "max_optical_zoom": max(zooms) if zooms else None,
                "camera_module_count": len(cameras),
                "combined_mp": _num(_cell(row, IDX["combined_mp"])),
            },
        }
    return by_codename
