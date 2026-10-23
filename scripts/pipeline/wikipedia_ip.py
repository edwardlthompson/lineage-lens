"""Resolve IP / ingress ratings from Wikipedia phone infoboxes (cached)."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Optional

from scripts.pipeline.gsmarena import extract_ip_rating

UA = "LineageLensBot/0.1 (https://github.com/edwardlthompson/lineage-lens; FOSS device guide)"
_API = "https://en.wikipedia.org/w/api.php"
_WATER_FIELD = re.compile(
    r"\|\s*(?:water[_\s-]?resistance|resistance|protection)\s*=\s*([^\n|{]+)",
    re.I,
)


def _get_json(params: dict[str, str]) -> dict[str, Any]:
    url = _API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def search_title(query: str) -> Optional[str]:
    data = _get_json(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": "5",
            "format": "json",
        }
    )
    hits = (data.get("query") or {}).get("search") or []
    if not hits:
        return None
    # Prefer titles that look like the device name
    q_low = query.lower()
    for h in hits:
        title = str(h.get("title") or "")
        if title.lower() in q_low or any(
            part and part in title.lower() for part in q_low.split() if len(part) > 2
        ):
            return title
    return str(hits[0].get("title") or "") or None


def parse_ip_from_wikitext(wikitext: str) -> Optional[str]:
    m = _WATER_FIELD.search(wikitext or "")
    if m:
        found = extract_ip_rating(m.group(1))
        if found:
            return found
    # Fallback: first IP near "water" / "dust" / "ingress"
    for m2 in re.finditer(r"(?i).{0,40}\bIP\s*[0-9]{2}[A-Za-z]?\b.{0,20}", wikitext or ""):
        window = m2.group(0)
        if re.search(r"(?i)water|dust|ingress|resist|protect|seal", window):
            found = extract_ip_rating(window)
            if found:
                return found
    return extract_ip_rating(wikitext)


def fetch_page_ip(title: str) -> Optional[str]:
    data = _get_json(
        {
            "action": "parse",
            "page": title,
            "prop": "wikitext",
            "format": "json",
            "redirects": "1",
        }
    )
    wt = ((data.get("parse") or {}).get("wikitext") or {}).get("*") or ""
    return parse_ip_from_wikitext(wt)


def fetch_device_ip(
    vendor: str,
    name: str,
    cache_path: Path,
    *,
    force: bool = False,
) -> Optional[str]:
    """Return IP rating string or None; writes cache JSON."""
    if cache_path.is_file() and not force:
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            if "ip" in cached or cached.get("error"):
                return cached.get("ip")
        except json.JSONDecodeError:
            pass

    queries = [
        f"{vendor} {name}".strip(),
        name.strip(),
        re.sub(r"\([^)]*\)", "", name).strip(),
    ]
    ip: Optional[str] = None
    title: Optional[str] = None
    err: Optional[str] = None
    for q in queries:
        if not q:
            continue
        try:
            title = search_title(q)
            if not title:
                continue
            ip = fetch_page_ip(title)
            if ip:
                break
        except Exception as exc:  # noqa: BLE001
            err = str(exc)
            time.sleep(0.5)

    payload: dict[str, Any] = {
        "queries": queries,
        "title": title,
        "ip": ip,
        "error": None if ip else (err or "not_found"),
    }
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return ip


def load_ip_cache(cache_dir: Path) -> dict[str, str]:
    """Map codename → IP rating from cache hits."""
    root = cache_dir / "wikipedia_ip"
    out: dict[str, str] = {}
    if not root.is_dir():
        return out
    for path in root.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        ip = data.get("ip")
        if ip:
            out[path.stem.lower()] = str(ip)
    return out
