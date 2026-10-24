"""Video score weighting — 4K 120fps+ gets an extra boost."""

from scripts.pipeline.scores import _text_has_4k120, _video_score


def test_structured_4k120_scores_higher_than_4k60():
    base = {
        "video": {
            "1080p": {"30": True, "60": True},
            "4k": {"30": True, "60": True},
        }
    }
    high = {
        "video": {
            "1080p": {"30": True, "60": True},
            "4k": {"30": True, "60": True, "120": True},
        }
    }
    assert _video_score(high) > _video_score(base)


def test_text_caps_detect_4k120():
    assert _text_has_4k120("8K@30fps, 4K@30/60/120fps, 1080p@30/60/240fps")
    assert not _text_has_4k120("4K@30/60fps, 1080p@30/60/120fps")


def test_text_fallback_4k120_boost():
    low = {"aggregates": {"video_caps_text": "4K@30/60fps, 1080p@30/60fps"}}
    high = {"aggregates": {"video_caps_text": "4K@30/60/120fps, 1080p@30/60fps"}}
    assert _video_score(high) > _video_score(low)
