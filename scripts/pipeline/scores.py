"""Camera / longevity / worth-buying scores (optics & video first)."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from .optical import clamp


def _max_enabled_fps(flags: dict[str, Any]) -> int:
    rates: list[int] = []
    for key, on in (flags or {}).items():
        if on and str(key).isdigit():
            rates.append(int(key))
    return max(rates) if rates else 0


def _text_has_4k120(caps: str) -> bool:
    """True when free-text caps advertise 4K at 120fps or higher."""
    compact = re.sub(r"\s+", "", caps.lower())
    m = re.search(r"(?:4k|2160p?)@([\d/]+)fps", compact)
    if m:
        return any(int(x) >= 120 for x in m.group(1).split("/") if x.isdigit())
    return bool(re.search(r"(?:4k|2160p?).{0,12}(?:120|240)\s*fps", caps.lower()))


def _video_score(device: dict[str, Any]) -> Optional[float]:
    """Higher resolutions and frame rates rank higher."""
    video = device.get("video") or {}
    if not video:
        # Fall back to free-text video caps from GSMArena
        caps = (device.get("aggregates") or {}).get("video_caps_text") or ""
        if not caps:
            return None
        score = 20.0
        low = caps.lower()
        if "8k" in low:
            score += 35.0
        if "4k" in low or "2160" in low:
            score += 25.0
        if "1080" in low or "fhd" in low:
            score += 10.0
        for marker, pts in (("240", 12), ("120", 10), ("60", 8), ("30", 3)):
            if f"@{marker}" in low.replace(" ", "") or f"{marker}fps" in low.replace(" ", ""):
                score += pts
        if _text_has_4k120(caps):
            score += 16.0
        if "raw" in low:
            score += 15.0
        if "hdr" in low:
            score += 8.0
        return round(clamp(score), 2)

    score = 0.0
    f1080 = video.get("1080p") or {}
    f4k = video.get("4k") or {}
    f8k = video.get("8k") or {}

    def fps_points(flags: dict, weight: float) -> float:
        pts = 0.0
        for key, on in flags.items():
            if not on:
                continue
            if key.isdigit():
                rate = int(key)
                # diminishing returns above 60
                pts += min(25.0, rate / 8.0)
            else:
                # HDR / 10 Bit / Dolby
                pts += 8.0
        return pts * weight

    score += fps_points(f1080, 0.35)
    score += fps_points(f4k, 0.65)
    score += fps_points(f8k, 0.5)
    # presence of 4K at all
    if any(f4k.get(k) for k in f4k if str(k).isdigit()):
        score += 15.0
    # Extra weight for high-speed 4K (120fps+).
    if _max_enabled_fps(f4k) >= 120:
        score += 16.0
    if any(f8k.get(k) for k in f8k if str(k).isdigit()) or f4k.get("8K"):
        score += 12.0
    if f4k.get("10 Bit") or f4k.get("HDR") or f4k.get("HDR10+") or f4k.get("Dolby"):
        score += 10.0
    return round(clamp(score), 2)


def _feature_score(device: dict[str, Any]) -> float:
    feats = device.get("camera_features") or {}
    agg = device.get("aggregates") or {}
    score = 0.0
    if feats.get("dcg") or agg.get("has_dcg"):
        score += 18.0
    if feats.get("raw_video") or agg.get("has_raw_video"):
        score += 16.0
    if feats.get("raw_photo") or agg.get("has_raw_photo"):
        score += 6.0
    if feats.get("pdaf") or agg.get("has_pdaf"):
        score += 6.0
    if feats.get("laser_af"):
        score += 4.0
    if feats.get("eis"):
        score += 3.0
    if feats.get("hdr10") or feats.get("dolby_vision"):
        score += 5.0
    # text scrape fallbacks
    blob = " ".join(
        str(x)
        for x in (
            feats.get("notes"),
            agg.get("camera_features_text"),
            agg.get("video_caps_text"),
        )
        if x
    ).lower()
    if "dcg" in blob or "dual conversion" in blob or "dual-gain" in blob:
        score += 12.0
    if "raw" in blob and "video" in blob:
        score += 10.0
    if "log" in blob or "hlg" in blob:
        score += 6.0
    return round(clamp(score), 2)


def _optics_sensor_score(device: dict[str, Any]) -> Optional[float]:
    agg = device.get("aggregates") or {}
    cams = device.get("cameras") or []
    size = agg.get("main_sensor_size")
    pitch = agg.get("main_pixel_pitch")
    ois = agg.get("has_ois_main")
    zoom = agg.get("max_optical_zoom")
    has_tele = agg.get("has_telephoto")
    has_uw = agg.get("has_ultrawide")

    main = next((c for c in cams if c.get("type") in {"main", "wide"}), None)
    aperture = None if main is None else main.get("aperture")
    focal = None if main is None else main.get("focal_length_mm")

    # Fixed weight budget — missing fields contribute 0 (no renormalization).
    # Incomplete "5× module" stubs must not outrank fully specified optics.
    score = 0.0
    present = 0

    # Sensor size dominates
    if size is not None:
        score += clamp((float(size) - 5.5) / 11.0 * 100.0) * 0.38
        present += 1
    if pitch is not None:
        score += clamp((float(pitch) - 0.5) / 1.3 * 100.0) * 0.14
        present += 1
    if aperture is not None:
        # lower f-number is better; f/1.4 → ~100, f/2.4 → ~40
        score += clamp((2.6 - float(aperture)) / 1.4 * 100.0) * 0.12
        present += 1
    if focal is not None:
        # mild preference for ~24–28mm natural FOV
        score += clamp(100.0 - abs(float(focal) - 26.0) * 4.0) * 0.06
        present += 1
    if ois is not None:
        score += (100.0 if ois else 25.0) * 0.12
        present += 1
    if zoom is not None or has_tele:
        z = float(zoom or (2.0 if has_tele else 1.0))
        score += clamp((z - 1.0) / 5.0 * 100.0) * 0.12
        present += 1
    if has_uw:
        score += 70.0 * 0.06
        present += 1

    module_count = agg.get("camera_module_count") or len(cams)
    if module_count:
        score += min(100.0, float(module_count) * 18.0) * 0.06
        present += 1

    if present <= 0:
        return None
    return round(score, 2)


def _sensor_age_factor(device: dict[str, Any]) -> float:
    """Newer sensors score closer to 1.0; older get a gentle penalty factor."""
    year = device.get("release_year")
    if not isinstance(year, int):
        return 1.0
    now_y = datetime.now(timezone.utc).year
    age = max(0, now_y - year)
    # 0y → 1.0, 8y → ~0.72
    return max(0.55, 1.0 - age * 0.035)


def _camera_score(device: dict[str, Any]) -> Optional[float]:
    optics = _optics_sensor_score(device)
    video = _video_score(device)
    features = _feature_score(device)
    age_f = _sensor_age_factor(device)

    if optics is None and video is None and features <= 0:
        return None

    # Primary: optics/sensor (~55%), video (~30%), features (~15%), then age.
    # Missing optics/video contribute 0 — placeholders inflated incomplete devices.
    o = optics if optics is not None else 0.0
    v = video if video is not None else 0.0
    combined = o * 0.55 + v * 0.30 + features * 0.15
    return round(clamp(combined * age_f), 2)


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


def _worth_buying_score(
    device: dict[str, Any], camera: Optional[float], longevity: float
) -> Optional[float]:
    year = device.get("release_year")
    now_y = datetime.now(timezone.utc).year
    age_penalty = 0.0
    if isinstance(year, int):
        age = max(0, now_y - year)
        age_penalty = min(35.0, age * 5.0)
    if camera is None:
        return round(clamp(longevity * 0.6 - age_penalty * 0.3), 2)
    return round(clamp(camera * 0.6 + longevity * 0.4 - age_penalty * 0.5), 2)


def apply_scores(device: dict[str, Any]) -> None:
    cam = _camera_score(device)
    lon = _longevity_score(device)
    device["scores"] = {
        "camera_score": cam,
        "longevity_score": lon,
        "worth_buying_score": _worth_buying_score(device, cam, lon),
        "video_score": _video_score(device),
        "optics_score": _optics_sensor_score(device),
        "feature_score": _feature_score(device),
    }
