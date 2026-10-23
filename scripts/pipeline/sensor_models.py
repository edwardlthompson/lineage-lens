"""Extract camera sensor part numbers from Lineage device proprietary-files."""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path
from typing import Any, Optional

UA = "LineageLensBot/0.1 (https://github.com/edwardlthompson/lineage-lens)"
HUDSON_DEPS = (
    "https://raw.githubusercontent.com/LineageOS/hudson/main/updater/device_deps.json"
)

_SENSOR_TOKEN = re.compile(
    r"(?i)\b("
    r"imx\d+[a-z0-9]*|s5k[a-z0-9]+|ov\d+[a-z0-9]*|gn\d+[a-z0-9]*|"
    r"hp\d+[a-z0-9]*|lyt-?\d+[a-z0-9]*|gc\d+[a-z0-9]*|hi\d+[a-z0-9]*|"
    r"jn\d+[a-z0-9]*|isocell[a-z0-9]*"
    r")\b"
)
_SENSOR_PATH = re.compile(
    r"(?i)(?:sensormodule|tuned|/camera/|sensor\.)[^\s#]*?"
    r"(imx\d+[a-z0-9]*|s5k[a-z0-9]+|ov\d+[a-z0-9]*|gn\d+[a-z0-9]*|"
    r"hp\d+[a-z0-9]*|lyt-?\d+[a-z0-9]*|gc\d+[a-z0-9]*|hi\d+[a-z0-9]*|"
    r"jn\d+[a-z0-9]*)"
)

# Prefer these path / model signals when assigning a token to a lens role
_ROLE_HINTS: list[tuple[str, tuple[str, ...]]] = [
    ("front", ("front", "selfie", "s5k3t2", "imx471", "imx616", "ov16a", "ov32c", "s5k3p9")),
    ("ultrawide", ("ultra", "uw", "wideangle", "imx355", "imx481", "imx882", "ov13b")),
    ("telephoto", ("tele", "periscope", "imx712", "imx787", "s5khp", "ov64b")),
    ("macro", ("macro", "gc02", "ov02", "gc5035")),
    ("depth", ("depth", "tof")),
    ("main", ("main", "wide", "primary", "imx586", "imx766", "imx989", "gn1", "gn2", "gn3", "hp3", "hp2")),
]

# Strong model → role when filename has no role keywords
_MODEL_ROLE: dict[str, str] = {
    "IMX471": "front",
    "IMX616": "front",
    "OV32C": "front",
    "OV16A1Q": "front",
    "S5K3T2": "front",
    "IMX481": "ultrawide",
    "IMX355": "ultrawide",
    "IMX586": "main",
    "IMX766": "main",
    "IMX989": "main",
    "GN1": "main",
    "GN2": "main",
    "GN3": "main",
    "GC02M1B": "macro",
    "GC5035": "macro",
}


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310
        return resp.read().decode("utf-8", errors="replace")


def load_device_deps(cache_path: Path, *, force: bool = False) -> dict[str, list[str]]:
    if cache_path.is_file() and not force:
        try:
            data = json.loads(cache_path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {str(k): list(v) for k, v in data.items()}
        except json.JSONDecodeError:
            pass
    raw = json.loads(_get(HUDSON_DEPS))
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")
    return {str(k): list(v) for k, v in raw.items()}


def normalize_sensor_token(tok: str) -> str:
    t = tok.strip().upper().replace("_", "")
    if t.startswith("LYT") and not t.startswith("LYT-"):
        t = "LYT-" + t[3:]
    return t


def extract_sensors_from_proprietary(text: str) -> list[dict[str, str]]:
    """Return ordered unique sensor hits with path context."""
    seen: set[str] = set()
    out: list[dict[str, str]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        low = line.lower()
        if not any(
            k in low
            for k in (
                "sensormodule",
                "sensor.",
                "/camera/",
                "camx",
                "tuned.",
                "ncf_pack_",
            )
        ):
            continue
        # Prefer path-anchored matches
        m = _SENSOR_PATH.search(line)
        tok = m.group(1) if m else None
        if tok is None:
            m2 = _SENSOR_TOKEN.search(line)
            tok = m2.group(1) if m2 else None
        if not tok:
            continue
        # Skip IMU / misc that sneak in
        if re.match(r"(?i)(bmi|icm|lsm|ak|mmc|sx|bu)", tok):
            continue
        norm = normalize_sensor_token(tok)
        if norm in seen:
            continue
        seen.add(norm)
        out.append({"sensor_model": norm, "path": line[:220]})
    return out


def guess_role(sensor_model: str, path: str, index: int, total: int) -> str:
    model = normalize_sensor_token(sensor_model)
    if model in _MODEL_ROLE:
        return _MODEL_ROLE[model]
    blob = f"{sensor_model} {path}".lower()
    for role, hints in _ROLE_HINTS:
        if any(h in blob for h in hints):
            return role
    # Order fallback: main, ultrawide/tele, front last when many modules
    if total >= 3 and index == total - 1:
        return "front"
    if index == 0:
        return "main"
    if index == 1:
        return "ultrawide"
    if index == 2:
        return "telephoto"
    return "other"


def proprietary_urls_for_codename(
    codename: str, deps: dict[str, list[str]], branches: list[str]
) -> list[str]:
    """Candidate raw GitHub URLs for proprietary-files.txt."""
    code = codename.strip()
    repos = deps.get(code) or deps.get(code.lower()) or []
    # Prefer device-specific repos over -common / hardware / kernel
    device_repos = [
        r
        for r in repos
        if r.startswith("android_device_") and "common" not in r and "hardware" not in r
    ]
    common_repos = [
        r for r in repos if r.startswith("android_device_") and "common" in r
    ]
    ranked = device_repos + common_repos
    urls: list[str] = []
    for repo in ranked[:5]:
        for br in branches:
            urls.append(
                f"https://raw.githubusercontent.com/LineageOS/{repo}/{br}/proprietary-files.txt"
            )
            urls.append(
                f"https://raw.githubusercontent.com/LineageOS/{repo}/{br}/proprietary-files-vendor.txt"
            )
    return urls


def fetch_sensors_for_codename(
    codename: str,
    deps: dict[str, list[str]],
    cache_path: Path,
    *,
    branches: list[str] | None = None,
    force: bool = False,
) -> dict[str, Any]:
    if cache_path.is_file() and not force:
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            if "sensors" in cached or cached.get("error"):
                return cached
        except json.JSONDecodeError:
            pass

    brs = branches or ["lineage-23.2", "lineage-22.2", "lineage-21", "lineage-20"]
    sensors: list[dict[str, str]] = []
    used_url: Optional[str] = None
    err: Optional[str] = None
    # Prefer device-specific hits with a sane module count; skip bloated common lists
    candidates: list[tuple[str, list[dict[str, str]]]] = []
    for url in proprietary_urls_for_codename(codename, deps, brs):
        try:
            text = _get(url)
        except Exception as exc:  # noqa: BLE001
            err = str(exc)
            continue
        found = extract_sensors_from_proprietary(text)
        if not found:
            continue
        candidates.append((url, found))
        # Good enough: device tree file with ≤ 12 unique camera sensors
        if "common" not in url and len(found) <= 12:
            sensors = found
            used_url = url
            break

    if not sensors and candidates:
        # Prefer smallest non-empty list (least likely to be a shared mega-list)
        used_url, sensors = min(candidates, key=lambda c: len(c[1]))
        if len(sensors) > 12:
            # Keep only sensormodule / sensor.so style entries
            sensors = [
                s
                for s in sensors
                if re.search(r"(?i)sensormodule|sensor\.[a-z0-9_]+\.so", s.get("path", ""))
            ][:8]

    payload: dict[str, Any] = {
        "codename": codename,
        "source_url": used_url,
        "sensors": sensors,
        "error": None if sensors else (err or "not_found"),
    }
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


_MAIN_RANK = [
    "IMX989",
    "GN3",
    "GN2",
    "GN1",
    "HP3",
    "HP2",
    "IMX766",
    "IMX890",
    "IMX686",
    "IMX586",
    "IMX363",
]


def _cam_role(cam: dict[str, Any]) -> str:
    typ = str(cam.get("type") or "other")
    return "main" if typ in {"main", "wide"} else typ


def apply_sensors_to_cameras(cameras: list[dict[str, Any]], sensors: list[dict[str, str]]) -> None:
    """Fill missing camera.sensor_model from proprietary-files hits or seed rows."""
    if not sensors or not cameras:
        return

    # Seed rows may already carry type=
    typed = [s for s in sensors if s.get("type")]
    if typed:
        by_type: dict[str, list[str]] = {}
        for s in typed:
            by_type.setdefault(str(s["type"]), []).append(s["sensor_model"])
        for cam in cameras:
            if cam.get("sensor_model"):
                continue
            role = _cam_role(cam)
            q = by_type.get(role) or []
            if q:
                cam["sensor_model"] = q.pop(0)
        return

    # Score each sensor for each camera role; assign greedily without dumping leftovers
    pool: list[dict[str, str]] = []
    for i, s in enumerate(sensors):
        pool.append(
            {
                "sensor_model": s["sensor_model"],
                "path": s.get("path", ""),
                "guess": guess_role(s["sensor_model"], s.get("path", ""), i, len(sensors)),
            }
        )

    def rank_for(role: str, item: dict[str, str]) -> tuple[int, int]:
        model = item["sensor_model"]
        guessed = item["guess"]
        # 0 = perfect role match
        match = 0 if guessed == role else (1 if role == "main" and guessed == "main" else 3)
        if role == "main":
            try:
                pref = _MAIN_RANK.index(model)
            except ValueError:
                pref = 50
        else:
            pref = 0 if guessed == role else 10
        return (match, pref)

    for cam in cameras:
        if cam.get("sensor_model") or not pool:
            continue
        role = _cam_role(cam)
        # Only assign when we have a plausible match for this role (avoid mislabeling)
        ranked = sorted(pool, key=lambda it: rank_for(role, it))
        best = ranked[0]
        match_score = rank_for(role, best)[0]
        if match_score > 1 and role not in {"other", "macro", "depth"}:
            # No confident match for this lens — leave blank rather than wrong
            continue
        if match_score > 1 and best["guess"] not in {role, "other", "macro", "depth"}:
            continue
        cam["sensor_model"] = best["sensor_model"]
        pool.remove(best)


def load_sensor_seed(path: Path) -> dict[str, list[dict[str, str]]]:
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, list[dict[str, str]]] = {}
    for key, rows in data.items():
        if key.startswith("_") or not isinstance(rows, list):
            continue
        cleaned: list[dict[str, str]] = []
        for row in rows:
            if not isinstance(row, dict) or not row.get("sensor_model"):
                continue
            cleaned.append(
                {
                    "sensor_model": normalize_sensor_token(str(row["sensor_model"])),
                    "type": str(row.get("type") or ""),
                    "path": "seed",
                }
            )
        if cleaned:
            out[key.lower()] = cleaned
    return out


def load_sensor_cache(
    cache_dir: Path, *, seed_path: Path | None = None
) -> dict[str, list[dict[str, str]]]:
    """Merge proprietary-files cache over curated seed (cache wins when present)."""
    out: dict[str, list[dict[str, str]]] = {}
    if seed_path is not None:
        out.update(load_sensor_seed(seed_path))
    root = cache_dir / "sensor_models"
    if root.is_dir():
        for path in root.glob("*.json"):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            sensors = data.get("sensors")
            if sensors:
                out[path.stem.lower()] = list(sensors)
    return out
