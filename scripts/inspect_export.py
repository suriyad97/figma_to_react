"""Inspect a Figma export ZIP: screens, flow, tokens, assets. No model calls, no network.

Usage: python scripts/inspect_export.py path/to/export.zip
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from figma_to_react.core.parser import (  # noqa: E402
    collect_image_fills, curate_document, extract_screens_and_flow, extract_tokens, tree_stats,
)
from figma_to_react.sources.figma_zip import extract_asset_files, parse_export  # noqa: E402


def main(path: str):
    blob = Path(path).read_bytes()
    file, renders = parse_export(Path(path).name, blob)
    assets = extract_asset_files(blob)

    raw = tree_stats(file["document"])
    curated, discards = curate_document(file["document"])
    stats = tree_stats(curated)
    screens, flow = extract_screens_and_flow(curated)
    tokens = extract_tokens(curated)

    print(f'file            : {file["name"]}')
    print(f'nodes           : {raw["nodes"]} raw -> {stats["nodes"]} curated ({len(discards)} discarded)')
    print(f'screens         : {len(screens)}')
    print(f'flow edges      : {len(flow)}')
    print(f'tokens          : {len(tokens["colors"])} colors, {len(tokens["typography"])} type styles')
    print(f'bundled renders : {len(renders)}')
    print(f'asset files     : {len(assets)}')
    print()
    for s in screens:
        arrows = f' -> {", ".join(s["goesTo"])}' if s["goesTo"] else ""
        print(f'  {s["name"]:<28} {s["route"]:<22}{arrows}')

    fills = []
    for s in screens:
        collect_image_fills(s["node"], s["name"], fills)
    if fills:
        print(f"\nimage placements ({len(fills)}):")
        for f in fills[:20]:
            print(f'  {f["screen"]:<20} {f["node"]:<28} {f["asset"]}')


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
