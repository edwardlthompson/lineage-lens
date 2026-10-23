"""Flagship override merge replaces the camera stack."""

from scripts.pipeline.flagship_overrides import apply_flagship_overrides


def test_override_replaces_wiki_stack():
    device = {
        "codename": "fuxi",
        "cameras": [
            {"type": "main", "mp": 50, "info": "50 MP"},
            {"type": "macro", "mp": 12, "info": "12 MP (macro)"},
            {"type": "other", "sensor_model": "S5K3T1", "optical_format": "1/3.0"},
            {"type": "front", "mp": 32},
        ],
        "provenance": {"data_sources": [], "quality": "partial"},
    }
    overrides = {
        "fuxi": {
            "waterproofing": "IP68",
            "video_caps_text": "4K@30fps",
            "cameras": [
                {
                    "type": "main",
                    "sensor_model": "IMX800",
                    "optical_format": "1/1.49",
                    "pixel_pitch_um": 1.0,
                    "focal_length_mm": 23,
                    "aperture": 1.8,
                },
                {
                    "type": "front",
                    "sensor_model": "OV32C",
                    "optical_format": "1/3.2",
                    "pixel_pitch_um": 0.7,
                    "focal_length_mm": 24,
                    "aperture": 2.0,
                },
            ],
        }
    }
    apply_flagship_overrides(device, overrides)
    types = [c["type"] for c in device["cameras"]]
    assert types == ["main", "front"]
    assert device["waterproofing"] == "IP68"
    assert device["aggregates"]["video_caps_text"] == "4K@30fps"
    assert "flagship_overrides" in device["provenance"]["data_sources"]


def test_empty_cameras_override_clears_wiki_stubs():
    device = {
        "codename": "odin_m0",
        "type": "handheld game console",
        "soc": "Snapdragon 845",
        "cameras": [
            {"type": "front", "sensor_model": "OV12A10", "info": "front (OV12A10)"},
        ],
        "provenance": {"data_sources": [], "quality": "partial"},
    }
    apply_flagship_overrides(
        device,
        {"odin_m0": {"waterproofing": "None", "cameras": []}},
    )
    assert device["cameras"] == []
    assert device["waterproofing"] == "None"
    assert "flagship_overrides" in device["provenance"]["data_sources"]
