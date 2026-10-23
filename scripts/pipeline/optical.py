"""Normalize optical format / sensor size for sorting."""

from __future__ import annotations

import math
import re
from typing import Optional


_FRAC = re.compile(r"^\s*1\s*/\s*(\d+(?:\.\d+)?)\s*$")
_PLAIN = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")

# Full-frame 36×24 mm diagonal (mm).
FF_DIAGONAL_MM = math.hypot(36.0, 24.0)


def optical_format_to_diagonal_mm(fmt: Optional[str]) -> Optional[float]:
    """Convert optical format string to approximate sensor diagonal in mm.

    Accepts wiki/sheet forms like ``1/1.28``, ``1.28``, or ``1.00`` (sheet
    often stores the denominator alone when the format is 1/x).
    """
    if fmt is None:
        return None
    s = str(fmt).strip()
    if not s:
        return None
    # Phone "Type" inch: 1" ≈ 16 mm diagonal (not a literal 25.4 mm inch).
    type1_mm = 16.0
    m = _FRAC.match(s)
    if m:
        denom = float(m.group(1))
        if denom <= 0:
            return None
        return round(type1_mm / denom, 4)
    m = _PLAIN.match(s)
    if m:
        val = float(m.group(1))
        if val <= 0:
            return None
        # Sheet "Size" column is typically the 1/x denominator (e.g. 1.31 → 1/1.31").
        if val <= 4.0:
            return round(type1_mm / val, 4)
        return round(val, 4)
    return None


def parse_zoom(raw: Optional[str]) -> Optional[float]:
    """Parse zoom strings like ``5x``, ``3.2x``, ``3.5x/5.2x`` → max factor."""
    if raw is None:
        return None
    s = str(raw).strip().lower().replace("×", "x")
    if not s:
        return None
    nums = re.findall(r"(\d+(?:\.\d+)?)\s*x?", s)
    if not nums:
        return None
    try:
        return max(float(n) for n in nums)
    except ValueError:
        return None


def sensor_area_mm2(diagonal_mm: Optional[float]) -> Optional[float]:
    """Approximate area assuming 4:3 sensor from diagonal."""
    if diagonal_mm is None or diagonal_mm <= 0:
        return None
    # diagonal^2 = w^2 + h^2, w/h = 4/3 → w = 0.8 * d * sqrt(1/(0.64+0.36))? 
    # w = d * 4 / 5, h = d * 3 / 5 for 4:3
    w = diagonal_mm * 4 / 5
    h = diagonal_mm * 3 / 5
    return round(w * h, 4)


def clamp(n: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, n))


def fov_deg_from_ff_equivalent(focal_ff_eq_mm: Optional[float]) -> Optional[float]:
    """Diagonal FOV (degrees) from a 35mm-equivalent focal length."""
    if focal_ff_eq_mm is None or focal_ff_eq_mm <= 0:
        return None
    # FOV = 2 * atan(diag / (2f)) on the reference format.
    rad = 2.0 * math.atan(FF_DIAGONAL_MM / (2.0 * float(focal_ff_eq_mm)))
    return round(math.degrees(rad), 1)


def fill_camera_derived_fields(cameras: list[dict]) -> None:
    """Fill FOV / info stubs from known FL + model (does not invent ois/flash)."""
    for cam in cameras:
        if not isinstance(cam, dict):
            continue
        fl = cam.get("focal_length_mm")
        if cam.get("fov_deg") is None and fl is not None:
            # Marketing FL >= 10 is treated as FF-equivalent (same as UI).
            if float(fl) >= 10:
                fov = fov_deg_from_ff_equivalent(float(fl))
            else:
                diag = cam.get("sensor_size_mm")
                if diag:
                    rad = 2.0 * math.atan(float(diag) / (2.0 * float(fl)))
                    fov = round(math.degrees(rad), 1)
                else:
                    fov = None
            if fov is not None:
                cam["fov_deg"] = fov
        if not str(cam.get("info") or "").strip():
            typ = str(cam.get("type") or "camera")
            model = cam.get("sensor_model")
            cam["info"] = f"{typ} ({model})" if model else typ
        if cam.get("type") == "front" and not str(cam.get("flash") or "").strip():
            cam["flash"] = "None"
