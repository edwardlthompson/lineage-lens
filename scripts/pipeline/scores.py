"""v1 scoring formulas for camera / longevity / worth-buying."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from .optical import clamp


def _camera_score(device: dict[str, Any]) -> Optional[float]:
    agg = device.get("aggregates") or {}
    size = agg.get("main_sensor_size")
    pitch = agg.get("main_pixel_pitch")
    ois = agg.get("has_ois_main")
    zoom = agg.get("max_optical_zoom")
    has_tele = agg.get("has_telephoto")

    if size is None and pitch is None and ois is None and zoom is None:
        # wiki-only: weak score from MP if present
        main_mp = agg.get("main_mp")
        if main_mp is None:
            return None
        return round(clamp(float(main_mp) * 0.35), 2)

    score = 0.0
    weight = 0.0
    if size is not None:
        # ~7–16 mm diagonal typical; map 8→40, 16→100
        score += clamp((float(size) - 6.0) / 10.0 * 100.0) * 0.45
        weight += 0.45
    if pitch is not None:
        # larger pixel pitch is better for light; 0.6–1.6 µm
        score += clamp((float(pitch) - 0.5) / 1.2 * 100.0) * 0.2
        weight += 0.2
    if ois is not None:
        score += (100.0 if ois else 20.0) * 0.15
        weight += 0.15
    if zoom is not None or has_tele:
        z = float(zoom or (2.0 if has_tele else 1.0))
        score += clamp((z - 1.0) / 4.0 * 100.0) * 0.2
        weight += 0.2
    if weight <= 0:
        return None
    return round(score / weight * (weight / 1.0), 2) if weight < 1 else round(score, 2)


def _longevity_score(device: dict[str, Any]) -> float:
    maintainers = device.get("maintainers") or []
    versions = device.get("versions") or []
    status = device.get("status") or "unknown"
    score = 0.0
    if maintainers:
        score += 40.0
    score += min(40.0, len(versions) * 8.0)
    if status == "current":
        score += 20.0
    elif status == "experimental":
        score += 5.0
    return round(clamp(score), 2)


def _worth_buying_score(device: dict[str, Any], camera: Optional[float], longevity: float) -> Optional[float]:
    year = device.get("release_year")
    now_y = datetime.now(timezone.utc).year
    age_penalty = 0.0
    if isinstance(year, int):
        age = max(0, now_y - year)
        age_penalty = min(35.0, age * 5.0)
    if camera is None:
        # longevity-only weak signal
        return round(clamp(longevity * 0.6 - age_penalty * 0.3), 2)
    return round(clamp(camera * 0.55 + longevity * 0.45 - age_penalty), 2)


def apply_scores(device: dict[str, Any]) -> None:
    cam = _camera_score(device)
    lon = _longevity_score(device)
    device["scores"] = {
        "camera_score": cam,
        "longevity_score": lon,
        "worth_buying_score": _worth_buying_score(device, cam, lon),
    }
