"""Wikipedia IP title matching must reject Reno14 for old Oppo F1/R5 queries."""

from scripts.pipeline.wikipedia_ip import title_matches_query


def test_rejects_reno14_for_short_oppo_queries():
    assert not title_matches_query("Oppo Reno14", "F1")
    assert not title_matches_query("Oppo Reno14", "OPPO F1 (International)")
    assert not title_matches_query("Oppo Reno14", "R5s")
    assert not title_matches_query("Oppo Reno14", "R7s (International)")


def test_accepts_plausible_titles():
    assert title_matches_query("Oppo F1", "OPPO F1 (International)")
    assert title_matches_query("OnePlus 13", "OnePlus 13")
    assert title_matches_query("Oppo R5", "R5")
