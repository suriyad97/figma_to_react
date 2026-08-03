"""Duration formatting is deterministic and has no external dependencies."""
from figma_to_react.core.time import format_duration


def test_format_duration_rounds_to_seconds():
    assert format_duration(45.7) == "45s"
    assert format_duration(90) == "1m 30s"
    assert format_duration(3661) == "1h 1m 1s"
    assert format_duration(3600) == "1h"


def test_format_duration_zero():
    assert format_duration(0) == "0s"


def test_format_duration_rejects_negative():
    try:
        format_duration(-1)
        raise AssertionError("expected ValueError")
    except ValueError as exc:
        assert "non-negative" in str(exc)
