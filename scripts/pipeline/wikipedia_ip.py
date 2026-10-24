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


_VENDOR_NOISE = re.compile(
    r"\b(oppo|oneplus|xiaomi|redmi|poco|samsung|google|motorola|sony|lg|"
    r"asus|nothing|fairphone|international|global|china|india)\b",
    re.I,
)


def _query_key_tokens(query: str) -> list[str]:
    """Distinctive model tokens from a search query (vendor noise stripped)."""
    q = re.sub(r"\([^)]*\)", "", query)
    q = _VENDOR_NOISE.sub(" ", q)
    tokens = [t for t in re.split(r"[^a-z0-9]+", q.lower()) if len(t) >= 2]
    # Prefer longer tokens (model codes) over lone digits.
    tokens.sort(key=lambda t: (len(t), t), reverse=True)
    return tokens


def title_matches_query(title: str, query: str) -> bool:
    """
    Reject loose Wikipedia hits (e.g. query 'F1' matching Oppo Reno14).

    Requires the longest distinctive query token to appear in the title.
    """
    tokens = _query_key_tokens(query)
    if not tokens:
        return True
    tlow = title.lower()
    key = tokens[0]
    if len(key) <= 2:
        # Short keys (f1, r5): require word-ish boundary, not substring of Reno14.
        return bool(re.search(rf"(?<![a-z0-9]){re.escape(key)}(?![a-z0-9])", tlow))
    return key in tlow


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
        if not title_matches_query(title, query):
            continue
        if title.lower() in q_low or any(
            part and part in title.lower() for part in q_low.split() if len(part) > 2
        ):
            return title
        if title_matches_query(title, query):
            return title
    for h in hits:
        title = str(h.get("title") or "")
        if title and title_matches_query(title, query):
            return title
    return None


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
