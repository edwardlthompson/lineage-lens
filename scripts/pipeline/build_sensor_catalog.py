#!/usr/bin/env python3
"""Build data/raw/sensor_catalog.json from Wikipedia ISOCELL + curated Sony/OV listings."""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "raw" / "sensor_catalog.json"
TYPE1_MM = 16.0
UA = "LineageLensBot/0.1 (https://github.com/edwardlthompson/lineage-lens)"

# Datasheet / press-release backed Sony + OmniVision entries (optical format, native pitch µm, MP).
# Sources: Sony press (IMX586), Commonlands/IADIY (IMX766), module vendors (IMX989), public teardowns.
CURATED: dict[str, dict] = {
    "IMX989": {
        "vendor": "Sony",
        "optical_format": "1/1.0",
        "diag_mm": 15.86,
        "pixel_pitch_um": 1.6,
        "mp": 50.3,
        "notes": "1\" type; 0.8µm native / 1.6µm Quad Bayer binned",
        "sources": ["sony-module-listings", "press"],
    },
    "IMX766": {
        "vendor": "Sony",
        "optical_format": "1/1.56",
        "diag_mm": 10.24,
        "pixel_pitch_um": 1.0,
        "mp": 50.3,
        "sources": ["https://commonlands.com/pages/image-sensors/imx766"],
    },
    "IMX890": {
        "vendor": "Sony",
        "optical_format": "1/1.56",
        "diag_mm": round(TYPE1_MM / 1.56, 4),
        "pixel_pitch_um": 1.0,
        "mp": 50.0,
        "sources": ["oem-listings"],
    },
    "IMX686": {
        "vendor": "Sony",
        "optical_format": "1/1.73",
        "diag_mm": round(TYPE1_MM / 1.73, 4),
        "pixel_pitch_um": 0.8,
        "mp": 64.0,
        "sources": ["oem-listings"],
    },
    "IMX586": {
        "vendor": "Sony",
        "optical_format": "1/2.0",
        "diag_mm": 8.0,
        "pixel_pitch_um": 0.8,
        "mp": 48.0,
        "sources": ["https://www.sony.com/en/SonyInfo/News/Press/201807/18-060E/", "IMX586 datasheet"],
    },
    "IMX363": {
        "vendor": "Sony",
        "optical_format": "1/2.55",
        "diag_mm": round(TYPE1_MM / 2.55, 4),
        "pixel_pitch_um": 1.4,
        "mp": 12.2,
        "sources": ["pixel-teardowns"],
    },
    "IMX787": {
        "vendor": "Sony",
        "optical_format": "1/2.55",
        "diag_mm": round(TYPE1_MM / 2.55, 4),
        "pixel_pitch_um": 0.7,
        "mp": 50.0,
        "sources": ["oem-listings"],
    },
    "IMX712": {
        "vendor": "Sony",
        "optical_format": "1/2.55",
        "diag_mm": round(TYPE1_MM / 2.55, 4),
        "pixel_pitch_um": 0.7,
        "mp": 50.0,
        "sources": ["oem-listings", "front-uw"],
    },
    "IMX564": {
        "vendor": "Sony",
        "optical_format": "1/2.0",
        "diag_mm": 8.0,
        "pixel_pitch_um": 0.7,
        "mp": 48.0,
        "sources": ["pixel8-teardowns"],
    },
    "IMX481": {
        "vendor": "Sony",
        "optical_format": "1/2.8",
        "diag_mm": round(TYPE1_MM / 2.8, 4),
        "pixel_pitch_um": 1.12,
        "mp": 16.0,
        "sources": ["oem-listings"],
    },
    "IMX882": {
        "vendor": "Sony",
        "optical_format": "1/2.0",
        "diag_mm": 8.0,
        "pixel_pitch_um": 0.8,
        "mp": 50.0,
        "sources": ["oem-listings"],
    },
    "IMX355": {
        "vendor": "Sony",
        "optical_format": "1/2.8",
        "diag_mm": round(TYPE1_MM / 2.8, 4),
        "pixel_pitch_um": 1.0,
        "mp": 12.0,
        "sources": ["oem-listings"],
    },
    "IMX471": {
        "vendor": "Sony",
        "optical_format": "1/3.0",
        "diag_mm": round(TYPE1_MM / 3.0, 4),
        "pixel_pitch_um": 1.0,
        "mp": 16.0,
        "role_hint": "front",
        "sources": ["oem-listings", "oneplus-8t"],
    },
    "IMX616": {
        "vendor": "Sony",
        "optical_format": "1/2.8",
        "diag_mm": round(TYPE1_MM / 2.8, 4),
        "pixel_pitch_um": 0.8,
        "mp": 32.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "IMX583": {
        "vendor": "Sony",
        "optical_format": "1/2.55",
        "diag_mm": round(TYPE1_MM / 2.55, 4),
        "pixel_pitch_um": 0.8,
        "mp": 48.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "OV32C": {
        "vendor": "OmniVision",
        "optical_format": "1/2.8",
        "diag_mm": round(TYPE1_MM / 2.8, 4),
        "pixel_pitch_um": 0.8,
        "mp": 32.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "OV16A1Q": {
        "vendor": "OmniVision",
        "optical_format": "1/3.06",
        "diag_mm": round(TYPE1_MM / 3.06, 4),
        "pixel_pitch_um": 1.0,
        "mp": 16.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "OV50A": {
        "vendor": "OmniVision",
        "optical_format": "1/1.5",
        "diag_mm": round(TYPE1_MM / 1.5, 4),
        "pixel_pitch_um": 1.0,
        "mp": 50.0,
        "sources": ["oem-listings"],
    },
    "OV02B1B": {
        "vendor": "OmniVision",
        "optical_format": "1/5.0",
        "diag_mm": round(TYPE1_MM / 5.0, 4),
        "pixel_pitch_um": 1.75,
        "mp": 2.0,
        "role_hint": "macro",
        "sources": ["oem-listings"],
    },
    "GC02M1B": {
        "vendor": "GalaxyCore",
        "optical_format": "1/5.0",
        "diag_mm": round(TYPE1_MM / 5.0, 4),
        "pixel_pitch_um": 1.75,
        "mp": 2.0,
        "role_hint": "macro",
        "sources": ["oem-listings"],
    },
    "GC5035": {
        "vendor": "GalaxyCore",
        "optical_format": "1/4.7",
        "diag_mm": round(TYPE1_MM / 4.7, 4),
        "pixel_pitch_um": 1.12,
        "mp": 5.0,
        "role_hint": "macro",
        "sources": ["oem-listings"],
    },
    "S5K3T2": {
        "vendor": "Samsung",
        "optical_format": "1/3.2",
        "diag_mm": round(TYPE1_MM / 3.2, 4),
        "pixel_pitch_um": 0.8,
        "mp": 20.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "S5K3P9": {
        "vendor": "Samsung",
        "optical_format": "1/3.0",
        "diag_mm": round(TYPE1_MM / 3.0, 4),
        "pixel_pitch_um": 1.0,
        "mp": 16.0,
        "role_hint": "front",
        "sources": ["oem-listings"],
    },
    "IMX381": {
        "vendor": "Sony",
        "optical_format": "1/2.55",
        "diag_mm": round(TYPE1_MM / 2.55, 4),
        "pixel_pitch_um": 1.25,
        "mp": 12.2,
        "sources": ["pixel7-leaks"],
    },
    "GM1": {
        "vendor": "Samsung",
        "optical_format": "1/2.0",
        "diag_mm": 8.0,
        "pixel_pitch_um": 0.8,
        "mp": 48.0,
        "aliases": ["GM1", "S5KGM1"],
        "sources": ["pixel7-pro-leaks"],
    },
    "S5KGM1": {
        "vendor": "Samsung",
        "optical_format": "1/2.0",
        "diag_mm": 8.0,
        "pixel_pitch_um": 0.8,
        "mp": 48.0,
        "sources": ["pixel7-pro-leaks"],
    },
    "S5K3J1": {
        "vendor": "Samsung",
        "optical_format": "1/3.0",
        "diag_mm": round(TYPE1_MM / 3.0, 4),
        "pixel_pitch_um": 1.22,
        "mp": 10.8,
        "role_hint": "front",
        "aliases": ["3J1", "S5K3J1"],
        "sources": ["pixel7-leaks"],
    },
    "IMX858": {
        "vendor": "Sony",
        "optical_format": "1/2.51",
        "diag_mm": round(TYPE1_MM / 2.51, 4),
        "pixel_pitch_um": 0.7,
        "mp": 50.0,
        "sources": ["pixel9-oem"],
    },
    "IMX789": {
        "vendor": "Sony",
        "optical_format": "1/1.43",
        "diag_mm": round(TYPE1_MM / 1.43, 4),
        "pixel_pitch_um": 1.12,
        "mp": 48.0,
        "sources": ["oneplus9pro"],
    },
    "IMX709": {
        "vendor": "Sony",
        "optical_format": "1/3.5",
        "diag_mm": round(TYPE1_MM / 3.5, 4),
        "pixel_pitch_um": 1.0,
        "mp": 8.0,
        "sources": ["oneplus9pro"],
    },
    "IMX707": {
        "vendor": "Sony",
        "optical_format": "1/1.28",
        "diag_mm": round(TYPE1_MM / 1.28, 4),
        "pixel_pitch_um": 1.22,
        "mp": 50.0,
        "sources": ["xiaomi12pro"],
    },
}


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310
        return resp.read().decode("utf-8", errors="replace")


def parse_isocell_wikipedia() -> dict[str, dict]:
    """Parse the multi-line wikitable on Wikipedia ISOCELL (cells are one per line)."""
    api = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "parse",
            "page": "ISOCELL",
            "prop": "wikitext",
            "format": "json",
            "redirects": 1,
        }
    )
    wt = json.loads(_get(api))["parse"]["wikitext"]["*"]
    out: dict[str, dict] = {}
    # Split on row markers; skip header
    rows = re.split(r"\n\|\-\n", wt)
    for row in rows:
        if "ISOCELL" not in row or "1/" not in row:
            continue
        # Strip refs for easier matching
        clean = re.sub(r"<ref>.*?</ref>", "", row, flags=re.S)
        clean = re.sub(r"\{\{[^}]+\}\}", "", clean)
        nm = re.search(r"ISOCELL\s+([A-Z0-9]+)\s*(?:\((S5K[A-Z0-9]+)\))?", clean)
        if not nm:
            continue
        name = nm.group(1).upper()
        s5k = (nm.group(2) or f"S5K{name}").upper()
        fmt_m = re.search(
            r"(1/\d+(?:\.\d+)?)\"?(?:<br\s*/?>|\s)*\(?\s*([\d.]+)?\s*(?:&nbsp;)?\s*mm\)?",
            clean,
            re.I,
        )
        if not fmt_m:
            continue
        fmt = fmt_m.group(1)
        denom = float(fmt.split("/")[1])
        diag = float(fmt_m.group(2)) if fmt_m.group(2) else round(TYPE1_MM / denom, 4)
        # Pixel size cell is the first 0.5–2.0 standalone cell after optical format
        after = clean[fmt_m.end() : fmt_m.end() + 120]
        pitch_m = re.search(r"\|\s*(0\.\d+|1\.\d+|2\.\d+)\s*(?:\n|$)", after)
        if not pitch_m:
            pitch_m = re.search(r"\n\|\s*(0\.\d+|1\.\d+)\s*\n", clean[fmt_m.end() :])
        pitch_v = float(pitch_m.group(1)) if pitch_m else None
        mpm = re.search(r"(\d+(?:\.\d+)?)\s*[Mm][Pp]", clean)
        # Front sensors often listed under Products used in Front:
        role_hint = None
        if re.search(r"'''Front", clean) and not re.search(r"'''Rear", clean[: clean.find("Front") + 1] if "Front" in clean else ""):
            role_hint = "front"
        elif re.search(r"Front:", clean) and "Rear" not in clean.split("Front:")[0][-40:]:
            # Heuristic: GH1/JD1/GD* known front
            if name in {"GH1", "JD1", "GD1", "GD2"}:
                role_hint = "front"
        entry = {
            "vendor": "Samsung",
            "optical_format": fmt,
            "diag_mm": round(diag, 4),
            "pixel_pitch_um": pitch_v,
            "mp": float(mpm.group(1)) if mpm else None,
            "aliases": [name, s5k],
            "sources": ["https://en.wikipedia.org/wiki/ISOCELL"],
        }
        if role_hint:
            entry["role_hint"] = role_hint
        out[name] = entry
        out[s5k] = entry
    return out


def normalize_key(model: str) -> str:
    return model.strip().upper().replace(" ", "").replace("-", "")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=OUT)
    parser.add_argument("--skip-wiki", action="store_true")
    args = parser.parse_args()

    catalog: dict[str, dict] = {}
    for k, v in CURATED.items():
        catalog[normalize_key(k)] = {
            **v,
            "optical_format": v["optical_format"],
            "diag_mm": v["diag_mm"],
            "pixel_pitch_um": v.get("pixel_pitch_um"),
            "mp": v.get("mp"),
        }

    if not args.skip_wiki:
        try:
            wiki = parse_isocell_wikipedia()
            print(f"Wikipedia ISOCELL entries: {len(wiki)}")
            for k, v in wiki.items():
                key = normalize_key(k)
                # Prefer curated when both exist
                if key in catalog and catalog[key].get("sources") and "sony" in str(catalog[key].get("sources")).lower():
                    continue
                if key not in catalog or catalog[key].get("diag_mm") is None:
                    catalog[key] = v
                else:
                    # Fill missing pitch/mp from wiki
                    for field in ("pixel_pitch_um", "mp", "optical_format"):
                        if catalog[key].get(field) is None and v.get(field) is not None:
                            catalog[key][field] = v[field]
        except Exception as exc:  # noqa: BLE001
            print(f"WARN wiki scrape failed: {exc}", file=sys.stderr)

    # Alias GN1 → also ISOCELLGN1 stripped
    aliases_extra: dict[str, str] = {}
    for key, entry in list(catalog.items()):
        for a in entry.get("aliases") or []:
            aliases_extra[normalize_key(a)] = key
        # Samsung short names already keys

    payload = {
        "type1_mm": TYPE1_MM,
        "generated_by": "scripts/pipeline/build_sensor_catalog.py",
        "sensors": catalog,
        "aliases": aliases_extra,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")
    print(f"Wrote {args.out} ({len(catalog)} sensors)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
