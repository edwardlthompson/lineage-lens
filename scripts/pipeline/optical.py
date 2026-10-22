"""Normalize optical format / sensor size for sorting."""

from __future__ import annotations

import re
from typing import Optional


_FRAC = re.compile(r"^\s*1\s*/\s*(\d+(?:\.\d+)?)\s*$")
_PLAIN = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")


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
    m = _FRAC.match(s)
    if m:
        denom = float(m.group(1))
        if denom <= 0:
            return None
        return round(25.4 / denom, 4)
    m = _PLAIN.match(s)
    if m:
        val = float(m.group(1))
        if val <= 0:
            return None
        # Sheet "Size" column is typically the 1/x denominator (e.g. 1.31 → 1/1.31").
        if val <= 4.0:
            return round(25.4 / val, 4)
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
