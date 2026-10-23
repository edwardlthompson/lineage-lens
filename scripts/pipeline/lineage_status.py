"""Resolve LineageOS support status by codename via the official download API."""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path
from typing import Any, Optional

UA = "LineageLensBot/0.1 (https://github.com/edwardlthompson/lineage-lens)"
DOWNLOAD_API = "https://download.lineageos.org/api/v1/devices"


def _branch_key(branch: str) -> tuple[float, str]:
    nums = branch.split(".")
    try:
        major = float(nums[0])
        minor = float(nums[1]) if len(nums) > 1 else 0.0
    except ValueError:
        return (0.0, branch)
    return (major + minor / 100.0, branch)


def fetch_download_builds(cache_path: Path, *, force: bool = False) -> dict[str, list[str]]:
    """Return map branch → codenames from download.lineageos.org (cached)."""
    if cache_path.is_file() and not force:
        try:
            data = json.loads(cache_path.read_text(encoding="utf-8"))
            if isinstance(data, dict) and data.get("branches"):
                return {str(k): list(v) for k, v in data["branches"].items()}
        except json.JSONDecodeError:
            pass

    req = urllib.request.Request(
        DOWNLOAD_API, headers={"User-Agent": UA, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310
        branches = json.loads(resp.read().decode("utf-8", errors="replace"))
    if not isinstance(branches, dict):
        raise ValueError("unexpected download API payload")

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps({"source": DOWNLOAD_API, "branches": branches}, indent=2) + "\n",
        encoding="utf-8",
    )
    return {str(k): list(v) for k, v in branches.items()}


def codename_branch_map(branches: dict[str, list[str]]) -> dict[str, str]:
    """Map lowercase codename → highest Lineage branch that still ships builds."""
    out: dict[str, str] = {}
    for branch, codes in branches.items():
        for code in codes:
            key = str(code).strip().lower()
            if not key:
                continue
            prev = out.get(key)
            if prev is None or _branch_key(branch) > _branch_key(prev):
                out[key] = str(branch)
    return out


def resolve_status(
    codename: str,
    *,
    branch_by_code: dict[str, str],
    wiki_maintainers: list[str] | None = None,
    wiki_branch: Optional[str] = None,
) -> dict[str, Any]:
    """
    Authoritative status from download API by codename.

    - In download API → status=current, current_branch=<branch>
    - Not in API but wiki listed → discontinued
    - Never unknown when a codename is known
    """
    key = (codename or "").strip().lower()
    api_branch = branch_by_code.get(key)
    if api_branch:
        return {
            "status": "current",
            "current_branch": api_branch,
            "lineage_label": api_branch,
        }

    # Prefer wiki branch text only as historical hint; device is not currently shipping
    label = "discontinued"
    return {
        "status": "discontinued",
        "current_branch": None if not wiki_branch else str(wiki_branch),
        "lineage_label": label,
        "wiki_maintainers": wiki_maintainers or [],
    }
