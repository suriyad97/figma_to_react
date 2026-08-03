"""Human-readable duration formatting."""


def format_duration(seconds: float) -> str:
    """Format a duration in seconds as a compact human-readable string."""
    if seconds < 0:
        raise ValueError("duration must be non-negative")

    total = int(seconds)
    parts = [
        f"{value}{label}"
        for value, label in (
            (total // 3600, "h"),
            ((total % 3600) // 60, "m"),
            (total % 60, "s"),
        )
        if value
    ]

    return " ".join(parts) if parts else "0s"
