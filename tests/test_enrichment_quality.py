"""Completeness gates for provenance.quality enriched vs complete."""

from scripts.pipeline.enrichment_quality import (
    assign_provenance_quality,
    camera_full_gap_fields,
    camera_gap_fields,
    camera_is_complete,
    camera_is_fully_specified,
    device_has_video,
    device_is_fully_complete,
    device_is_fully_enriched,
    fill_structured_video_from_caps,
    infer_quality,
)


def _cam(**kwargs):
    base = {
        "type": "main",
        "mp": 50,
        "sensor_model": "IMX989",
        "optical_format": "1/1.0",
        "sensor_size_mm": 13.2,
        "focal_length_mm": 23.0,
        "aperture": 1.8,
        "pixel_pitch_um": 1.6,
        "fov_deg": 73.0,
        "ois": True,
        "flash": "Dual LED",
        "info": "main (IMX989)",
    }
    base.update(kwargs)
    return base


def test_camera_is_complete_requires_core_optics():
    assert camera_is_complete(_cam())
    assert not camera_is_complete(_cam(sensor_model=""))
    assert not camera_is_complete(_cam(focal_length_mm=None))
    assert not camera_is_complete(_cam(aperture=None))
    assert not camera_is_complete(_cam(pixel_pitch_um=None))
    assert not camera_is_complete(
        _cam(sensor_size_mm=None, optical_format=None)
    )


def test_camera_fully_specified_needs_every_field():
    assert camera_is_fully_specified(_cam())
    assert not camera_is_fully_specified(_cam(fov_deg=None))
    assert not camera_is_fully_specified(_cam(ois=None))
    assert not camera_is_fully_specified(_cam(flash=""))
    assert not camera_is_fully_specified(_cam(mp=None))
    assert not camera_is_fully_specified(_cam(optical_format=None))
    assert not camera_is_fully_specified(_cam(sensor_size_mm=None))
    tele = _cam(type="telephoto", zoom=3)
    assert camera_is_fully_specified(tele)
    assert "zoom" in camera_full_gap_fields(_cam(type="telephoto", zoom=None))


def test_device_enriched_vs_complete():
    device = {
        "cameras": [_cam(), _cam(type="front", sensor_model="IMX615", ois=False, flash="None")],
        "waterproofing": "IP68",
        "video": {"4k": {"30": True}},
        "provenance": {"quality": "partial"},
    }
    assert device_is_fully_enriched(device)
    assert device_is_fully_complete(device)
    assert infer_quality(device) == "complete"

    device["video"] = None
    device["aggregates"] = {}
    assert device_is_fully_enriched(device)
    assert not device_is_fully_complete(device)
    assert infer_quality(device) == "enriched"

    # Caps text alone must not count as complete (UI only shows structured video).
    device["aggregates"] = {
        "video_caps_text": "8K@24fps, 4K@30/60fps, 1080p@30/60fps",
    }
    assert not device_has_video(device)
    assert not device_is_fully_complete(device)
    assert infer_quality(device) == "enriched"

    assert fill_structured_video_from_caps(device) is True
    assert device_has_video(device)
    assert device["video"]["4k"].get("30") is True
    assert device_is_fully_complete(device)
    assert infer_quality(device) == "complete"

    # IP is not required for camera enriched/complete (still shown in Gaps).
    device["waterproofing"] = None
    assert device_is_fully_enriched(device)
    assert infer_quality(device) == "complete"

    device["waterproofing"] = "None"
    assert device_is_fully_enriched(device)
    assert infer_quality(device) == "complete"

    device["waterproofing"] = "IP68"
    device["cameras"][0]["aperture"] = None
    assert not device_is_fully_enriched(device)
    assert "aperture" in camera_gap_fields(device["cameras"][0])


def test_purged_sensor_model_is_not_complete():
    """Sprint 6 cleared placeholder sensor names — stored complete must not stick."""
    device = {
        "cameras": [_cam(sensor_model=""), _cam(type="front", sensor_model="", ois=False, flash="None")],
        "waterproofing": "IP68",
        "video": {"4k": {"30": True}},
        "provenance": {"quality": "complete"},
    }
    assert assign_provenance_quality(device) == "partial"
    assert device["provenance"]["quality"] == "partial"


def test_camera_less_handheld_can_be_complete():
    device = {
        "type": "handheld game console",
        "cameras": [],
        "soc": "Qualcomm QCS8550",
        "waterproofing": "IPX4",
        "provenance": {"quality": "wiki_only"},
    }
    assert infer_quality(device) == "complete"
    device["waterproofing"] = None
    assert infer_quality(device) == "wiki_only"
    device["waterproofing"] = "None"
    assert infer_quality(device) == "wiki_only"
    device["waterproofing"] = "IPX4"
    device["soc"] = None
    assert infer_quality(device) == "wiki_only"


def test_camera_less_stb_can_be_complete():
    device = {
        "type": "set top box",
        "cameras": [],
        "soc": "Amlogic S905X4",
        "waterproofing": "IPX0",
        "provenance": {"quality": "wiki_only"},
    }
    assert infer_quality(device) == "complete"


def test_assign_provenance_quality_overwrites():
    device = {
        "cameras": [_cam(type="main", aperture=None), _cam(type="ultrawide")],
        "waterproofing": "IP67",
        "provenance": {"quality": "complete", "data_sources": ["gsmarena"]},
    }
    assert assign_provenance_quality(device) == "partial"
    assert device["provenance"]["quality"] == "partial"
    assert device["provenance"]["data_sources"] == ["gsmarena"]
