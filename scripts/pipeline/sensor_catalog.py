"""Load datasheet-backed sensor catalog and fill camera geometry gaps from part numbers."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "data" / "raw" / "sensor_catalog.json"
TYPE1_MM = 16.0

FRONT_MODELS = {
    "IMX471",
    "IMX616",
    "OV32C",
    "OV16A1Q",
    "S5K3T2",
    "S5K3P9",
    "IMX583",
    "S5KGH1",
    "GH1",
    "S5KJD1",
    "JD1",
    "S5KGD1",
    "GD1",
    "S5KGD2",
    "GD2",
}


def _norm(model: str) -> str:
    return model.strip().upper().replace(" ", "").replace("-", "")


@lru_cache(maxsize=1)
def load_catalog(path: str | None = None) -> dict[str, Any]:
    p = Path(path) if path else CATALOG_PATH
    if not p.is_file():
        return {"type1_mm": TYPE1_MM, "sensors": {}, "aliases": {}}
    return json.loads(p.read_text(encoding="utf-8"))


def lookup_sensor(model: Optional[str]) -> Optional[dict[str, Any]]:
    if not model:
        return None
    data = load_catalog()
    sensors: dict[str, Any] = data.get("sensors") or {}
    aliases: dict[str, str] = data.get("aliases") or {}
    key = _norm(model)
    if key in sensors:
        return sensors[key]
    if key in aliases and aliases[key] in sensors:
        return sensors[aliases[key]]
    for prefix in ("SONY", "SAMSUNG", "OMNIVISION", "ISOCELL", "S5K"):
        if key.startswith(prefix):
            bare = key[len(prefix) :]
            if bare in sensors:
                return sensors[bare]
            if f"S5K{bare}" in sensors:
                return sensors[f"S5K{bare}"]
    # S5KHM2 → HM2
    if key.startswith("S5K") and key[3:] in sensors:
        return sensors[key[3:]]
    return None


def diag_from_sensor_model(model: Optional[str]) -> Optional[float]:
    entry = lookup_sensor(model)
    if not entry:
        return None
    if entry.get("diag_mm"):
        return float(entry["diag_mm"])
    fmt = entry.get("optical_format")
    if fmt:
        m = str(fmt).replace('"', "")
        if m.startswith("1/"):
            try:
                return round(TYPE1_MM / float(m.split("/")[1]), 4)
            except (ValueError, ZeroDivisionError):
                return None
    return None


def estimate_front_diag_from_mp(mp: Optional[float]) -> Optional[float]:
    if mp is None or mp <= 0:
        return None
    if mp >= 40:
        return round(TYPE1_MM / 2.5, 4)
    if mp >= 24:
        return round(TYPE1_MM / 2.8, 4)
    if mp >= 16:
        return round(TYPE1_MM / 3.0, 4)
    if mp >= 10:
        return round(TYPE1_MM / 3.4, 4)
    if mp >= 5:
        return round(TYPE1_MM / 4.0, 4)
    return round(TYPE1_MM / 5.0, 4)


def _flash_none(flash: Any) -> bool:
    if flash is None:
        return True
    return str(flash).strip().lower() in {"", "none", "null", "nil", "no"}


def promote_unlabeled_fronts(cameras: list[dict[str, Any]]) -> None:
    """Relabel wiki 'other' selfie rows (flash None, no role label) as front."""
    for cam in cameras:
        if cam.get("type") not in {"other", None, ""}:
            continue
        if not _flash_none(cam.get("flash")):
            continue
        info = str(cam.get("info") or "").lower()
        if any(k in info for k in ("tele", "ultra", "macro", "depth", "wide", "main")):
            continue
        cam["type"] = "front"


def fill_from_sensor_catalog(cameras: list[dict[str, Any]]) -> int:
    """
    Extrapolate missing optical_format / sensor_size_mm / pixel_pitch_um / mp
    from the sensor part number. Returns number of fields filled.
    """
    filled = 0
    for cam in cameras:
        entry = lookup_sensor(cam.get("sensor_model"))
        if entry:
            if not cam.get("optical_format") and entry.get("optical_format"):
                cam["optical_format"] = str(entry["optical_format"]).replace('"', "")
                filled += 1
            if not cam.get("sensor_size_mm"):
                diag = entry.get("diag_mm") or diag_from_sensor_model(cam.get("sensor_model"))
                if diag:
                    cam["sensor_size_mm"] = float(diag)
                    filled += 1
            if not cam.get("pixel_pitch_um") and entry.get("pixel_pitch_um") is not None:
                cam["pixel_pitch_um"] = float(entry["pixel_pitch_um"])
                filled += 1
            if not cam.get("mp") and entry.get("mp") is not None:
                cam["mp"] = float(entry["mp"])
                filled += 1
            # Mark provenance lightly in info if empty
            if not cam.get("info") and cam.get("sensor_model"):
                cam["info"] = f"{cam['sensor_model']} (catalog)"

        # No catalog hit — still estimate front size from MP
        if not cam.get("sensor_size_mm") and cam.get("type") == "front":
            diag = estimate_front_diag_from_mp(cam.get("mp"))
            if diag is not None:
                cam["sensor_size_mm"] = diag
                filled += 1

        # Derive diagonal from optical_format when size still missing
        if not cam.get("sensor_size_mm") and cam.get("optical_format"):
            from scripts.pipeline.optical import optical_format_to_diagonal_mm

            diag = optical_format_to_diagonal_mm(str(cam["optical_format"]))
            if diag is not None:
                cam["sensor_size_mm"] = float(diag)
                filled += 1
    return filled


# Back-compat alias used by build.py
def fill_sensor_sizes(cameras: list[dict[str, Any]]) -> None:
    fill_from_sensor_catalog(cameras)


def ensure_front_from_sensors(
    cameras: list[dict[str, Any]], sensors: list[dict[str, str]]
) -> None:
    """If proprietary lists a selfie sensor but no front module exists, add one."""
    front_models = [
        s["sensor_model"]
        for s in sensors
        if s.get("type") == "front"
        or _norm(s.get("sensor_model", "")) in {_norm(x) for x in FRONT_MODELS}
        or "front" in str(s.get("path") or "").lower()
        or "selfie" in str(s.get("path") or "").lower()
        or (lookup_sensor(s.get("sensor_model")) or {}).get("role_hint") == "front"
    ]

    if any(c.get("type") == "front" for c in cameras):
        for cam in cameras:
            if cam.get("type") == "front" and not cam.get("sensor_model") and front_models:
                cam["sensor_model"] = front_models[0]
                break
        return

    if not front_models:
        return
    model = front_models[0]
    entry = lookup_sensor(model) or {}
    cameras.append(
        {
            "type": "front",
            "sensor_model": model,
            "sensor_size_mm": entry.get("diag_mm") or diag_from_sensor_model(model),
            "optical_format": entry.get("optical_format"),
            "pixel_pitch_um": entry.get("pixel_pitch_um"),
            "mp": entry.get("mp"),
            "flash": None,
            "info": f"front ({model})",
        }
    )
