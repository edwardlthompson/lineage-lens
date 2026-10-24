"""Structured video parsing keeps 8K frame rates in their own bucket."""

from scripts.pipeline.gsmarena import parse_video_caps


def test_8k_rates_are_not_merged_into_4k():
    structured, _ = parse_video_caps("8K@30fps, 4K@30/60/120fps, 1080p@30/60/240fps")
    assert structured is not None
    assert structured["8k"]["30"] is True
    assert structured["4k"]["30"] is True
    assert structured["4k"]["60"] is True
    assert structured["4k"]["120"] is True
    assert "8K" not in structured["4k"]
    assert "30" in structured["4k"]  # from 4K line, not borrowed from 8K alone


def test_8k_only_caps():
    structured, _ = parse_video_caps("8K@24/30fps")
    assert structured is not None
    assert structured["8k"]["24"] is True
    assert structured["8k"]["30"] is True
    assert not any((structured.get("4k") or {}).values())
