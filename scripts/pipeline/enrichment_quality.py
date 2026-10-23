"""Decide provenance.quality — enriched vs complete completeness gates."""

from __future__ import annotations

from typing import Any

# Core optics required for quality=enriched.
_ENRICHED_CAMERA_FIELDS = (
    "sensor_model",
    "focal_length_mm",
    "aperture",
    "pixel_pitch_um",
)

# Every camera field required for quality=complete (plus type-specific rules).
_COMPLETE_CAMERA_FIELDS = (
    "mp",
    "sensor_model",
    "optical_format",
    "sensor_size_mm",
    "pixel_pitch_um",
    "focal_length_mm",
    "aperture",
    "fov_deg",
    "info",
)


def _usable_flash(flash: Any) -> bool:
    if flash is None:
        return False
    s = str(flash).strip()
    return bool(s) and s.lower() != "none"


def camera_has_hardware_specs(cam: dict[str, Any]) -> bool:
    return bool(
        cam.get("sensor_size_mm") is not None
        or cam.get("optical_format")
        or cam.get("pixel_pitch_um") is not None
        or cam.get("focal_length_mm") is not None
        or cam.get("fov_deg") is not None
        or cam.get("aperture") is not None
        or cam.get("ois") is True
        or cam.get("zoom") is not None
        or cam.get("sensor_model")
        or _usable_flash(cam.get("flash"))
    )


def meaningful_cameras(cameras: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for cam in cameras or []:
        if not isinstance(cam, dict):
            continue
        if camera_has_hardware_specs(cam):
            out.append(cam)
            continue
        if str(cam.get("info") or "").strip():
            out.append(cam)
            continue
        if cam.get("mp") is not None:
            out.append(cam)
    return out


def camera_is_complete(cam: dict[str, Any]) -> bool:
    """Enriched-tier: model, size/format, FL, aperture, and pitch present."""
    model = str(cam.get("sensor_model") or "").strip()
    if not model:
        return False
    if cam.get("sensor_size_mm") is None and not cam.get("optical_format"):
        return False
    if cam.get("focal_length_mm") is None:
        return False
    if cam.get("aperture") is None:
        return False
    if cam.get("pixel_pitch_um") is None:
        return False
    return True


def camera_gap_fields(cam: dict[str, Any]) -> list[str]:
    gaps: list[str] = []
    if not str(cam.get("sensor_model") or "").strip():
        gaps.append("sensor_model")
    if cam.get("sensor_size_mm") is None and not cam.get("optical_format"):
        gaps.append("size")
    if cam.get("focal_length_mm") is None:
        gaps.append("focal_length_mm")
    if cam.get("aperture") is None:
        gaps.append("aperture")
    if cam.get("pixel_pitch_um") is None:
        gaps.append("pixel_pitch_um")
    return gaps


def camera_is_fully_specified(cam: dict[str, Any]) -> bool:
    """Complete-tier: every camera module field filled (ois/flash explicit)."""
    for key in _COMPLETE_CAMERA_FIELDS:
        val = cam.get(key)
        if val is None:
            return False
        if isinstance(val, str) and not val.strip():
            return False
    if cam.get("ois") is None:
        return False
    if not str(cam.get("flash") or "").strip():
        return False
    if str(cam.get("type") or "") == "telephoto" and cam.get("zoom") is None:
        return False
    return True


def camera_full_gap_fields(cam: dict[str, Any]) -> list[str]:
    gaps: list[str] = []
    for key in _COMPLETE_CAMERA_FIELDS:
        val = cam.get(key)
        if val is None or (isinstance(val, str) and not str(val).strip()):
            gaps.append(key)
    if cam.get("ois") is None:
        gaps.append("ois")
    if not str(cam.get("flash") or "").strip():
        gaps.append("flash")
    if str(cam.get("type") or "") == "telephoto" and cam.get("zoom") is None:
        gaps.append("zoom")
    return gaps


def _structured_video_present(device: dict[str, Any]) -> bool:
    """True only when `video` has at least one enabled rate/feature the UI can show."""
    video = device.get("video")
    if not isinstance(video, dict) or not video:
        return False
    for bucket in video.values():
        if isinstance(bucket, dict) and any(v is True for v in bucket.values()):
            return True
    return False


def device_has_video(device: dict[str, Any]) -> bool:
    """Complete-tier video gate: structured caps only (not caps-text alone)."""
    return _structured_video_present(device)


def fill_structured_video_from_caps(device: dict[str, Any]) -> bool:
    """
    Parse aggregates.video_caps_text into device.video when structured video is missing.

    Keeps complete honest: quality and the Video column use the same structured field.
    """
    if _structured_video_present(device):
        return False
    text = str((device.get("aggregates") or {}).get("video_caps_text") or "").strip()
    if not text:
        return False
    # Lazy import — avoid gsmarena ↔ quality cycles at module load.
    from scripts.pipeline.gsmarena import parse_video_caps

    structured, _ = parse_video_caps(text)
    if not structured:
        return False
    device["video"] = structured
    return True


def is_camera_less_form_factor(device: dict[str, Any]) -> bool:
    """Form factors that are not expected to ship camera modules."""
    t = str(device.get("type") or "").lower()
    return (
        "handheld" in t
        or "game console" in t
        or "set top" in t
        or t in {"stb", "devkit", "android tv"}
        or "devkit" in t
    )


def device_is_camera_less_complete(device: dict[str, Any]) -> bool:
    """
    Complete for devices with no camera hardware: waterproofing + SoC filled,
    and no meaningful camera stubs left to fill.
    """
    if not is_camera_less_form_factor(device):
        return False
    if meaningful_cameras(device.get("cameras")):
        return False
    if not str(device.get("waterproofing") or "").strip():
        return False
    if not str(device.get("soc") or "").strip():
        return False
    return True


def device_is_fully_enriched(device: dict[str, Any]) -> bool:
    """
    Enriched = every meaningful camera has core optics AND waterproofing is set.

    Requires at least one rear (non-front) module so empty selfie-only stubs
    cannot count as enriched.
    """
    cams = meaningful_cameras(device.get("cameras"))
    if not cams:
        return False
    if not any(str(c.get("type") or "") != "front" for c in cams):
        return False
    if not all(camera_is_complete(c) for c in cams):
        return False
    if not str(device.get("waterproofing") or "").strip():
        return False
    return True


def device_is_fully_complete(device: dict[str, Any]) -> bool:
    """
    Complete = enriched + every camera field filled + video capability present.

    Strictest provenance tier — no null ois/flash/fov/mp/info/size+format.
    Camera-less handhelds use device_is_camera_less_complete instead.
    """
    if device_is_camera_less_complete(device):
        return True
    if not device_is_fully_enriched(device):
        return False
    cams = meaningful_cameras(device.get("cameras"))
    if not all(camera_is_fully_specified(c) for c in cams):
        return False
    if not device_has_video(device):
        return False
    return True


def infer_quality(device: dict[str, Any]) -> str:
    if device_is_fully_complete(device):
        return "complete"
    if device_is_fully_enriched(device):
        return "enriched"
    cams = meaningful_cameras(device.get("cameras"))
    if len(cams) >= 2 and any(
        str(c.get("type") or "") in {"ultrawide", "telephoto", "macro", "front"} for c in cams
    ):
        return "partial"
    if any(camera_has_hardware_specs(c) for c in cams):
        return "partial"
    return "wiki_only"


def assign_provenance_quality(device: dict[str, Any]) -> str:
    """Overwrite provenance.quality from completeness (call after all fills)."""
    quality = infer_quality(device)
    prov = dict(device.get("provenance") or {})
    prov["quality"] = quality
    device["provenance"] = prov
    return quality
