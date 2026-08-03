"""Curation and extraction are deterministic - these run with no model and no network."""
from figma_to_react.core.parser import (
    curate_document, extract_screens_and_flow, extract_tokens,
    parse_figma_key, route_for, summarize_node, tree_stats,
)


def test_parse_figma_key_accepts_all_url_shapes():
    assert parse_figma_key("https://www.figma.com/design/ABC123/My-File") == "ABC123"
    assert parse_figma_key("https://www.figma.com/proto/ABC123/My-File?node-id=0-1") == "ABC123"
    assert parse_figma_key("https://example.com/nope") is None


def test_route_for_slugifies_frame_names():
    assert route_for("About Us") == "/about-us"
    assert route_for("Contact Us.") == "/contact-us"


def test_curation_discards_junk(sample_design):
    doc = sample_design["document"]
    before = tree_stats(doc)["nodes"]
    curated, discards = curate_document(doc)
    after = tree_stats(curated)["nodes"]

    assert after < before
    reasons = {d["reason"] for d in discards}
    assert "hidden layer" in reasons
    assert "scratch page skipped" in reasons


def test_screens_and_flow_extracted(sample_design):
    curated, _ = curate_document(sample_design["document"])
    screens, flow = extract_screens_and_flow(curated)

    names = [s["name"] for s in screens]
    assert names == ["Home", "About"]
    assert screens[0]["route"] == "/home"
    # Home -> About prototype link survives curation
    assert flow and screens[0]["goesTo"] == ["About"]


def test_tokens_and_roles(sample_design):
    curated, _ = curate_document(sample_design["document"])
    tokens = extract_tokens(curated)
    assert any(t["value"].startswith("#") for t in tokens["colors"])

    screens, _ = extract_screens_and_flow(curated)
    counter = {"included": 0, "dropped_depth": 0}
    summary = summarize_node(screens[0]["node"], counter)
    roles = []

    def walk(n):
        if n.get("role"):
            roles.append(n["role"])
        for c in n.get("children", []):
            walk(c)

    walk(summary)
    assert "button" in roles
