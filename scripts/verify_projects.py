"""Health-check every generated project and print a table. No model calls.

Usage: python scripts/verify_projects.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from figma_to_react.api.projects import check_health  # noqa: E402
from figma_to_react.config import OUT_ROOT  # noqa: E402


def main():
    if not OUT_ROOT.exists():
        raise SystemExit("no generated/ directory yet")

    rows = []
    for d in sorted(OUT_ROOT.iterdir()):
        if not d.is_dir():
            continue
        health = check_health(d)
        report = d / "conversion-report.json"
        metrics = json.loads(report.read_text(encoding="utf-8"))["metrics"] if report.exists() else {}
        rows.append((
            d.name,
            "OK" if health["ok"] else f'BROKEN ({len(health["missing"])})',
            metrics.get("enforcement", {}).get("buildStatus", "-"),
            metrics.get("screens", {}).get("recall", "-"),
            (metrics.get("visual") or {}).get("avgSsim", "-"),
        ))

    width = max((len(r[0]) for r in rows), default=10)
    print(f'{"project":<{width}}  {"health":<12} {"build":<14} {"coverage":<10} ssim')
    for name, health, build, cov, ssim in rows:
        print(f"{name:<{width}}  {health:<12} {build:<14} {cov:<10} {ssim}")

    broken = [r for r in rows if r[1] != "OK"]
    if broken:
        print(f"\n{len(broken)} broken project(s) - re-run the conversion or use Enhance to repair.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
