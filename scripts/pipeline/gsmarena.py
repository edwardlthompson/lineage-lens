"""Fetch and parse GSMArena camera / video specs (cached, resumable)."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Optional

UA = (
    "Mozilla/5.0 (compatible; LineageLensBot/0.1; +https://github.com/edwardlthompson/lineage-lens)"
)

_OPTICAL = re.compile(r"1/(\d+(?:\.\d+)?)\s*\"?")
_PITCH = re.compile(r"(\d+(?:\.\d+)?)\s*µm|(\d+(?:\.\d+)?)\s*um", re.I)
_MP = re.compile(r"(\d+(?:\.\d+)?)\s*MP", re.I)
_APERTURE = re.compile(r"f/(\d+(?:\.\d+)?)", re.I)
_FOCAL = re.compile(r"(\d+(?:\.\d+)?)\s*mm", re.I)
_FOV = re.compile(r"(\d+)\s*°")
_ZOOM = re.compile(r"(\d+(?:\.\d+)?)\s*x\s*(?:optical|lossless)?\s*zoom", re.I)
_SENSOR_MODEL = re.compile(
    r"\b("
    r"IMX\d+\w*|S5K\w+|OV\d+\w*|GN\d+\w*|JN\d+\w*|HP\d+\w*|LYT-?\d+\w*|"
    r"ISOCELL\s+\w+|Sony\s+IMX\d+\w*|Samsung\s+S5K\w+|OmniVision\s+OV\d+\w*"
    r")\b",
    re.I,
)
_IP = re.compile(r"\bIP\s*([0-9]{2}[A-Za-z]?)(?:\s*/\s*IP\s*([0-9]{2}[A-Za-z]?))?\b", re.I)
_SEARCH_HREF = re.compile(
    r'href="((?:https://www\.gsmarena\.com/)?[a-z0-9_]+-\d+\.php)"', re.I
)
# Phone optical "Type" inch: 1" ≈ 16 mm diagonal (not a literal 25.4 mm inch).
_TYPE1_MM = 16.0


def extract_ip_rating(text: str | None) -> str | None:
    """Normalize the first IP rating found in free text (e.g. IP68, IP67/IP68)."""
    if not text:
        return None
    plain = re.sub(r"<[^>]+>", " ", text)
    m = _IP.search(plain)
    if not m:
        return None
    a = m.group(1).upper()
    b = m.group(2).upper() if m.group(2) else None
    return f"IP{a}/IP{b}" if b and b != a else f"IP{a}"


def extract_sensor_model(text: str | None) -> str | None:
    if not text:
        return None
    m = _SENSOR_MODEL.search(text)
    return m.group(1).strip() if m else None


def _get(url: str, timeout: int = 45) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
        return resp.read().decode("utf-8", errors="replace")


def _type_from_blob(blob: str) -> str:
    b = blob.lower()
    if "periscope" in b or "telephoto" in b or "(tele" in b:
        return "telephoto"
    if "ultrawide" in b or "ultra-wide" in b or "ultra wide" in b:
        return "ultrawide"
    if "macro" in b:
        return "macro"
    if "depth" in b or "tof" in b:
        return "depth"
    if "wide" in b or "main" in b:
        return "main"
    return "main"


def parse_camera_modules(raw: str, *, front: bool = False) -> list[dict[str, Any]]:
    modules: list[dict[str, Any]] = []
    if not raw:
        return modules
    # GSMArena uses <br> or newlines between modules
    chunks = re.split(r"<br\s*/?>|\n+", raw, flags=re.I)
    for chunk in chunks:
        text = re.sub(r"<[^>]+>", " ", chunk)
        text = re.sub(r"\s+", " ", text).strip()
        if not text or len(text) < 4:
            continue
        if not _MP.search(text) and "mp" not in text.lower():
            # features line — skip as module
            continue
        opt = None
        m = _OPTICAL.search(text)
        if m:
            opt = m.group(1)
        pitch = None
        pm = _PITCH.search(text)
        if pm:
            pitch = float(pm.group(1) or pm.group(2))
        mp_m = _MP.search(text)
        ap_m = _APERTURE.search(text)
        fo_m = _FOCAL.search(text)
        fv_m = _FOV.search(text)
        zm_m = _ZOOM.search(text)
        diag = None
        if opt:
            try:
                diag = round(_TYPE1_MM / float(opt), 4)
            except ZeroDivisionError:
                diag = None
        typ = "front" if front else _type_from_blob(text)
        modules.append(
            {
                "type": typ,
                "mp": float(mp_m.group(1)) if mp_m else None,
                "optical_format": opt,
                "sensor_size_mm": diag,
                "pixel_pitch_um": pitch,
                "focal_length_mm": float(fo_m.group(1)) if fo_m else None,
                "aperture": float(ap_m.group(1)) if ap_m else None,
                "fov_deg": float(fv_m.group(1)) if fv_m else None,
                "ois": True if re.search(r"\bOIS\b", text) else False if "stabil" in text.lower() else None,
                "zoom": float(zm_m.group(1)) if zm_m else None,
                "flash": None,
                "info": text[:240],
                "sensor_model": extract_sensor_model(text),
            }
        )
    return modules


def parse_video_caps(raw: str) -> tuple[dict[str, Any] | None, str]:
    """Return (structured video dict or None, raw text)."""
    text = re.sub(r"<[^>]+>", " ", raw or "")
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return None, ""
    structured: dict[str, Any] = {"1080p": {}, "4k": {}}
    # e.g. 4K@30/60fps, 1080p@30/60/120/240fps, 8K@30fps
    for res, key in (("8K", "8k"), ("4K", "4k"), ("2160p", "4k"), ("1080p", "1080p"), ("720p", "720p")):
        for m in re.finditer(rf"{res}\s*@\s*([\d/]+)\s*fps", text, re.I):
            rates = m.group(1)
            bucket = "4k" if key in {"8k", "4k"} else "1080p" if key == "1080p" else None
            if bucket is None:
                continue
            for part in rates.split("/"):
                part = part.strip()
                if part.isdigit():
                    structured[bucket][part] = True
            if key == "8k":
                structured["4k"]["8K"] = True
    low = text.lower()
    if "hdr10+" in low:
        structured["4k"]["HDR10+"] = True
    elif "hdr10" in low or "hdr" in low:
        structured["4k"]["HDR"] = True
    if "dolby" in low:
        structured["4k"]["Dolby"] = True
    if "10-bit" in low or "10 bit" in low:
        structured["4k"]["10 Bit"] = True
    has_any = any(structured["1080p"].values()) or any(structured["4k"].values())
    return (structured if has_any else None), text


def extract_specs_sections(html: str) -> dict[str, dict[str, str]]:
    """Map section -> {label: value} from #specs-list tables."""
    sections: dict[str, dict[str, str]] = {}
    # Split by tables
    for table in re.findall(r"<table[^>]*>(.*?)</table>", html, flags=re.I | re.S):
        th = re.search(r"<th[^>]*>(.*?)</th>", table, flags=re.I | re.S)
        if not th:
            continue
        title = re.sub(r"<[^>]+>", "", th.group(1)).strip()
        rows: dict[str, str] = {}
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", table, flags=re.I | re.S):
            ttl = re.search(r'class="ttl"[^>]*>(.*?)</td>', tr, flags=re.I | re.S)
            nfo = re.search(r'class="nfo"[^>]*>(.*?)</td>', tr, flags=re.I | re.S)
            if not ttl or not nfo:
                continue
            key = re.sub(r"<[^>]+>", "", ttl.group(1)).strip()
            val = nfo.group(1).strip()
            if key:
                rows[key] = val
        if title and rows:
            sections[title] = rows
    return sections


def search_gsmarena(query: str) -> Optional[str]:
    """Return first matching device page URL slug path, or None."""
    q = urllib.parse.quote_plus(query)
    url = f"https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName={q}"
    html = _get(url)
    # Prefer result links
    for m in _SEARCH_HREF.finditer(html):
        href = m.group(1)
        if "results.php" in href or "res.php" in href:
            continue
        if href.startswith("http"):
            return href
        return "https://www.gsmarena.com/" + href.lstrip("/")
    return None


def enrich_from_html(html: str, *, page_url: str) -> dict[str, Any]:
    sections = extract_specs_sections(html)
    main = sections.get("Main Camera") or sections.get("Camera") or {}
    selfie = sections.get("Selfie camera") or sections.get("Selfie Camera") or {}

    main_raw = main.get("Single") or main.get("Dual") or main.get("Triple") or main.get("Quad") or ""
    # Sometimes key is empty / uses Features only — try first nfo-like values
    if not main_raw:
        for k, v in main.items():
            if "MP" in v:
                main_raw = v
                break
    selfie_raw = (
        selfie.get("Single")
        or selfie.get("Dual")
        or next((v for v in selfie.values() if "MP" in v), "")
    )
    video_raw = main.get("Video") or ""
    features_raw = main.get("Features") or ""

    cameras = parse_camera_modules(main_raw, front=False)
    cameras += parse_camera_modules(selfie_raw, front=True)
    video, video_text = parse_video_caps(video_raw)

    feat_l = (features_raw + " " + video_text).lower()
    features = {
        "dcg": "dcg" in feat_l or "dual conversion" in feat_l or "dual-gain" in feat_l,
        "raw_video": "raw" in feat_l and "video" in (video_text.lower() + " " + feat_l),
        "raw_photo": "raw" in feat_l,
        "pdaf": "pdaf" in feat_l or "dual pixel" in feat_l,
        "laser_af": "laser" in feat_l,
        "eis": "eis" in feat_l or "gyro-eis" in feat_l,
        "hdr10": "hdr10" in feat_l or "hdr" in video_text.lower(),
        "dolby_vision": "dolby" in feat_l,
        "notes": re.sub(r"<[^>]+>", " ", features_raw).strip()[:400],
    }

    main_cam = next((c for c in cameras if c.get("type") in {"main", "wide"}), None)
    teles = [c for c in cameras if c.get("type") == "telephoto"]
    zooms = [c.get("zoom") for c in teles if c.get("zoom") is not None]

    body = sections.get("Body") or {}
    body_blob = " ".join(str(v) for v in body.values())
    waterproofing = extract_ip_rating(body_blob) or extract_ip_rating(
        body.get("Build") or body.get("Protection") or ""
    )

    return {
        "gsmarena_url": page_url,
        "cameras": cameras,
        "video": video,
        "camera_features": features,
        "waterproofing": waterproofing,
        "aggregates": {
            "main_sensor_size": None if main_cam is None else main_cam.get("sensor_size_mm"),
            "main_optical_format": None if main_cam is None else main_cam.get("optical_format"),
            "main_pixel_pitch": None if main_cam is None else main_cam.get("pixel_pitch_um"),
            "has_ois_main": None if main_cam is None else main_cam.get("ois"),
            "has_telephoto": bool(teles),
            "has_ultrawide": any(c.get("type") == "ultrawide" for c in cameras),
            "max_optical_zoom": max(zooms) if zooms else None,
            "camera_module_count": len(cameras),
            "video_caps_text": video_text,
            "camera_features_text": features.get("notes"),
            "has_dcg": features["dcg"],
            "has_raw_video": features["raw_video"],
            "has_pdaf": features["pdaf"],
        },
    }


def fetch_device_enrichment(vendor: str, name: str, cache_path: Path) -> Optional[dict[str, Any]]:
    if cache_path.is_file():
        try:
            return json.loads(cache_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    queries = [
        f"{vendor} {name}".strip(),
        name.strip(),
        re.sub(r"\([^)]*\)", "", name).strip(),
    ]
    page_url = None
    last_err = None
    for q in queries:
        if not q:
            continue
        try:
            page_url = search_gsmarena(q)
            if page_url:
                break
        except Exception as exc:  # noqa: BLE001
            last_err = str(exc)
            time.sleep(1.5)
    if not page_url:
        payload = {"error": last_err or "not_found", "queries": queries}
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return None

    try:
        html = _get(page_url)
        data = enrich_from_html(html, page_url=page_url)
    except Exception as exc:  # noqa: BLE001
        payload = {"error": str(exc), "gsmarena_url": page_url}
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return None

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data
