"""Tests for download-API Lineage status resolution."""

from __future__ import annotations

from scripts.pipeline.lineage_status import codename_branch_map, resolve_status
from scripts.pipeline.sensor_models import extract_sensors_from_proprietary, guess_role


def test_codename_picks_highest_branch() -> None:
    m = codename_branch_map({"22.2": ["foo"], "24.0": ["foo", "bar"], "23.2": ["foo"]})
    assert m["foo"] == "24.0"
    assert m["bar"] == "24.0"


def test_resolve_current_from_api() -> None:
    r = resolve_status("cheetah", branch_by_code={"cheetah": "24.0"})
    assert r["status"] == "current"
    assert r["lineage_label"] == "24.0"
    assert r["current_branch"] == "24.0"


def test_resolve_discontinued_never_unknown() -> None:
    r = resolve_status("oldphone", branch_by_code={})
    assert r["status"] == "discontinued"
    assert r["lineage_label"] == "discontinued"
    assert r["status"] != "unknown"


def test_extract_sensormodule_tokens() -> None:
    text = """
odm/lib64/camera/com.qti.sensormodule.semco_imx586.bin
odm/lib64/camera/com.qti.sensormodule.qtech_imx481.bin
odm/lib64/camera/com.qti_kebab.sensor.imx471.so
"""
    found = extract_sensors_from_proprietary(text)
    models = {f["sensor_model"] for f in found}
    assert "IMX586" in models
    assert "IMX481" in models
    assert "IMX471" in models
    assert guess_role("IMX471", "sensor.imx471.so", 0, 3) == "front"
