"""Apply press/teardown camera overrides for flagship codenames."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PATH = ROOT / "data" / "raw" / "flagship_camera_overrides.json"

_FILL_KEYS = (
    "sensor_model",
    "mp",
    "optical_format",
    "sensor_size_mm",
    "pixel_pitch_um",
    "focal_length_mm",
    "fov_deg",
    "aperture",
    "ois",
    "zoom",
    "flash",
    "info",
)


def load_flagship_overrides(path: Path | None = None) -> dict[str, dict[str, Any]]:
    p = path or DEFAULT_PATH
    if not p.is_file():
        return {}
    raw = json.loads(p.read_text(encoding="utf-8"))
    return {k.lower(): v for k, v in raw.items() if not str(k).startswith("_")}


def apply_flagship_overrides(device: dict[str, Any], overrides: dict[str, dict[str, Any]]) -> None:
    """
    Merge typed override cameras onto the device.

    - Prefer override field values (press-sourced).
    - Drop empty stub modules of the same type once an override exists.
    - Append override types that were missing entirely.
    """
    code = str(device.get("codename") or "").lower()
    block = overrides.get(code)
    if not block:
        return
    touched = False
    # Explicit "cameras" key is authoritative (including [] to clear wiki stubs
    # on camera-less handhelds / STBs / devkits).
    if "cameras" in block:
        ov_cams = [
            c for c in (block.get("cameras") or []) if isinstance(c, dict) and c.get("type")
        ]
        if not ov_cams:
            device["cameras"] = []
            touched = True
        else:
            existing = list(device.get("cameras") or [])
            by_type: dict[str, list[dict[str, Any]]] = {}
            for cam in existing:
                by_type.setdefault(str(cam.get("type") or "other"), []).append(cam)

            type_idx: dict[str, int] = {}
            merged: list[dict[str, Any]] = []

            for ov in ov_cams:
                typ = str(ov["type"])
                i = type_idx.get(typ, 0)
                type_idx[typ] = i + 1
                candidates = by_type.get(typ) or []
                base = (candidates[i] if i < len(candidates) else {}).copy()
                for key in _FILL_KEYS:
                    if key not in ov:
                        continue
                    if ov[key] is None:
                        base.pop(key, None)
                    else:
                        base[key] = ov[key]
                base["type"] = typ
                if ov.get("info"):
                    base["info"] = ov["info"]
                elif not base.get("info"):
                    base["info"] = f"{typ} ({ov.get('sensor_model') or 'override'})"
                merged.append(base)

            # Override stack is authoritative — do not keep leftover wiki modules
            # (phantom "other"/macro stubs block quality=complete).
            device["cameras"] = merged
            touched = True

    if block.get("waterproofing") is not None:
        device["waterproofing"] = block["waterproofing"]
        touched = True
    if block.get("video"):
        device["video"] = block["video"]
        touched = True
    if block.get("video_caps_text"):
        agg = dict(device.get("aggregates") or {})
        agg["video_caps_text"] = block["video_caps_text"]
        device["aggregates"] = agg
        # Keep Video column + complete gate aligned: text alone is not enough.
        if not block.get("video"):
            from scripts.pipeline.gsmarena import parse_video_caps

            structured, _ = parse_video_caps(str(block["video_caps_text"]))
            if structured and not device.get("video"):
                device["video"] = structured
        touched = True

    if block.get("storage"):
        device["storage"] = block["storage"]
        touched = True
    if block.get("wifi"):
        device["wifi"] = block["wifi"]
        touched = True
    if isinstance(block.get("screen"), dict):
        screen = dict(device.get("screen") or {})
        screen.update(block["screen"])
        device["screen"] = screen
        touched = True

    if not touched:
        return

    sources = list((device.get("provenance") or {}).get("data_sources") or [])
    if "flagship_overrides" not in sources:
        sources.append("flagship_overrides")
        prov = dict(device.get("provenance") or {})
        prov["data_sources"] = sources
        device["provenance"] = prov
