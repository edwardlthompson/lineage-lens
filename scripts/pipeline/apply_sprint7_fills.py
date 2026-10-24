"""Apply Sprint 7 gap fills to devices.json + overrides + charge catalog."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(".")
sys.path.insert(0, str(ROOT))
from scripts.pipeline.enrichment_quality import assign_provenance_quality, fill_structured_video_from_caps
from scripts.pipeline.flagship_overrides import apply_flagship_overrides, load_flagship_overrides

FILLS_PATH = ROOT / "data" / "raw" / "sprint7_gap_fills.json"
# Optional override: python apply_sprint7_fills.py path/to/fills.json
if len(sys.argv) > 1:
    FILLS_PATH = Path(sys.argv[1])
DEVICES = ROOT / "examples" / "web" / "public" / "data" / "devices.json"
OVERRIDES = ROOT / "data" / "raw" / "flagship_camera_overrides.json"
CHARGE_DIR = ROOT / "examples" / "web" / "src" / "features" / "table"
CHARGE_MODERN = CHARGE_DIR / "chargeCatalogModern.ts"
CHARGE_LEGACY = CHARGE_DIR / "chargeCatalogLegacy.ts"
CHARGE_FILES = (CHARGE_MODERN, CHARGE_LEGACY)

def optical_to_mm(fmt: str | None) -> float | None:
    if not fmt: return None
    m = re.match(r"1/([\d.]+)", str(fmt).strip())
    if not m: return None
    # approx diagonal inches * 25.4
    try:
        denom = float(m.group(1))
        return round(25.4 / denom, 4)
    except ValueError:
        return None

def merge_cam_fields(device, sensors):
    cams = list(device.get("cameras") or [])
    by_type = {}
    for i,c in enumerate(cams):
        by_type.setdefault(str(c.get("type")), []).append(i)
    type_idx = {}
    for s in sensors:
        typ = str(s["type"])
        i = type_idx.get(typ, 0)
        type_idx[typ] = i + 1
        idxs = by_type.get(typ) or []
        if i >= len(idxs):
            # append new
            cam = {"type": typ}
            cams.append(cam)
            idx = len(cams)-1
        else:
            idx = idxs[i]
            cam = cams[idx]
        for k,v in s.items():
            if k == "type": continue
            if v is None: continue
            cam[k] = v
        if s.get("optical_format") and not cam.get("sensor_size_mm"):
            mm = optical_to_mm(s.get("optical_format"))
            if mm: cam["sensor_size_mm"] = mm
        model = cam.get("sensor_model")
        if model and not (cam.get("info") or "").strip():
            cam["info"] = f"{typ} ({model})"
        elif model and model not in str(cam.get("info") or ""):
            cam["info"] = f"{typ} ({model})"
        cams[idx] = cam
    device["cameras"] = cams

def apply_fill_to_device(d, fill):
    if fill.get("sensors"):
        merge_cam_fields(d, fill["sensors"])
    if fill.get("waterproofing"):
        d["waterproofing"] = fill["waterproofing"]
    if fill.get("clear_none_ip") and str(d.get("waterproofing") or "").strip().lower() == "none":
        d["waterproofing"] = ""
    if fill.get("refresh_rate") is not None:
        scr = dict(d.get("screen") or {}) if isinstance(d.get("screen"), dict) else {}
        scr["refresh_rate"] = fill["refresh_rate"]
        d["screen"] = scr
    if fill.get("battery_mah") is not None:
        bat = dict(d.get("battery") or {}) if isinstance(d.get("battery"), dict) else {}
        bat["capacity"] = fill["battery_mah"]
        d["battery"] = bat
    fill_structured_video_from_caps(d)

def upsert_override(ov, cn, fill):
    key = cn  # preserve case if exists
    # find existing key case-insensitive
    existing_key = None
    for k in ov:
        if k.lower() == cn.lower():
            existing_key = k
            break
    block = dict(ov.get(existing_key) or {}) if existing_key else {}
    srcs = list(block.get("_sources") or [])
    for s in fill.get("sources") or []:
        if s not in srcs:
            srcs.append(s)
    if srcs:
        block["_sources"] = srcs
    if fill.get("waterproofing"):
        block["waterproofing"] = fill["waterproofing"]
    if fill.get("refresh_rate") is not None:
        scr = dict(block.get("screen") or {})
        scr["refresh_rate"] = fill["refresh_rate"]
        block["screen"] = scr
    if fill.get("sensors"):
        # merge into override cameras by type
        existing = list(block.get("cameras") or [])
        by_type = {}
        for i,c in enumerate(existing):
            by_type.setdefault(str(c.get("type")), []).append(i)
        type_idx = {}
        for s in fill["sensors"]:
            typ = str(s["type"])
            i = type_idx.get(typ, 0)
            type_idx[typ] = i + 1
            idxs = by_type.get(typ) or []
            if i < len(idxs):
                cam = dict(existing[idxs[i]])
            else:
                cam = {"type": typ}
                existing.append(cam)
                idxs = [len(existing)-1]
                by_type.setdefault(typ, []).append(idxs[0])
            for k,v in s.items():
                if k=="type": continue
                if v is None: continue
                cam[k] = v
            model = cam.get("sensor_model")
            if model:
                cam["info"] = f"{typ} ({model})"
            existing[idxs[i] if i < len(idxs) else -1] = cam
        block["cameras"] = existing
    if existing_key:
        ov[existing_key] = block
    else:
        ov[cn] = block

def _charge_entry(cn: str, charge: dict) -> str:
    wired = charge.get("wired")
    wireless = charge.get("wireless")
    has_w = charge.get("hasWireless")
    qi = charge.get("qi")
    parts = [
        f"wired: {wired if wired is not None else 'null'}",
        f"wireless: {wireless if wireless is not None else 'null'}",
        f"hasWireless: {'true' if has_w else 'false'}",
    ]
    if qi:
        parts.append(f'qi: "{qi}"')
    return f"  {cn}: {{ {', '.join(parts)} }},"


def remove_charge_ts(text: str, cn: str) -> str:
    pat = re.compile(rf"\n\s*{re.escape(cn)}\s*:\s*\{{[^}}]*\}},?", re.M)
    return pat.sub("", text)


def upsert_charge_ts(text: str, cn: str, charge: dict | None) -> str:
    if charge is None:
        return remove_charge_ts(text, cn)
    entry = _charge_entry(cn, charge)
    pat = re.compile(rf"(?:^|\n)\s*{re.escape(cn)}\s*:\s*\{{[^}}]*\}},?", re.M)
    if pat.search(text):
        return pat.sub(lambda m: ("\n" if m.group(0).startswith("\n") else "") + entry, text, count=1)
    m = re.search(r"\n\};\s*$", text)
    if not m:
        raise SystemExit("charge catalog closing brace not found")
    return text[: m.start()] + "\n" + entry + "\n" + text[m.start() + 1 :]


def load_charge_texts() -> dict[Path, str]:
    return {p: p.read_text(encoding="utf-8") for p in CHARGE_FILES}


def find_charge_file(texts: dict[Path, str], cn: str) -> Path | None:
    pat = re.compile(rf"(?:^|\n)\s*{re.escape(cn)}\s*:\s*\{{", re.M)
    for path, text in texts.items():
        if pat.search(text):
            return path
    return None


def upsert_charge_files(texts: dict[Path, str], cn: str, charge: dict | None) -> None:
    existing = find_charge_file(texts, cn)
    if charge is None:
        if existing:
            texts[existing] = remove_charge_ts(texts[existing], cn)
        return
    target = existing or CHARGE_LEGACY
    texts[target] = upsert_charge_ts(texts[target], cn, charge)


def main():
    if not FILLS_PATH.is_file():
        print("no fills file yet", FILLS_PATH)
        return
    fills = json.loads(FILLS_PATH.read_text(encoding="utf-8"))
    # strip meta keys
    fills = {k:v for k,v in fills.items() if not k.startswith("_") and isinstance(v, dict)}

    data = json.loads(DEVICES.read_text(encoding="utf-8"))
    ov = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    charge_texts = load_charge_texts()

    applied = 0
    for d in data["devices"]:
        cn = d.get("codename")
        fill = fills.get(cn) or fills.get(str(cn).lower())
        if not fill:
            continue
        apply_fill_to_device(d, fill)
        upsert_override(ov, cn, fill)
        if "charge" in fill:
            # Explicit null removes a bad catalog entry.
            upsert_charge_files(charge_texts, cn, fill.get("charge"))
        if fill.get("remove_charge"):
            upsert_charge_files(charge_texts, cn, None)
        applied += 1

    # clear None IP when fill says global clear, or when fill has clear_none_ip_all
    if fills.get("__meta__", {}).get("clear_all_none_ip"):
        pass

    # re-apply overrides then quality
    overrides = load_flagship_overrides(OVERRIDES)  # will reload after write
    OVERRIDES.write_text(json.dumps(ov, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    overrides = load_flagship_overrides(OVERRIDES)
    for d in data["devices"]:
        apply_flagship_overrides(d, overrides)
        fill_structured_video_from_caps(d)
        assign_provenance_quality(d)

    # also clear waterproofing "None" -> "" for phones when requested via fills __clear_none_ip
    meta = json.loads(FILLS_PATH.read_text(encoding="utf-8")).get("_meta") or {}
    if meta.get("clear_none_ip"):
        for d in data["devices"]:
            if str(d.get("waterproofing") or "").strip().lower() == "none":
                t = str(d.get("type") or "").lower()
                if "phone" in t or "foldable" in t or "slider" in t:
                    d["waterproofing"] = ""
                    assign_provenance_quality(d)

    complete = sum(1 for d in data["devices"] if d["provenance"]["quality"] == "complete")
    enriched = sum(1 for d in data["devices"] if d["provenance"]["quality"] == "enriched")
    partial = sum(1 for d in data["devices"] if d["provenance"]["quality"] == "partial")
    data["complete_count"] = complete
    data["enriched_count"] = enriched
    data["partial_count"] = partial
    DEVICES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for path, text in charge_texts.items():
        path.write_text(text, encoding="utf-8")
    print(f"applied fills to {applied} device rows; complete={complete} enriched={enriched}")

if __name__ == "__main__":
    main()
