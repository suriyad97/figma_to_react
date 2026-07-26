"""Combined mode: URL flow wiring + ZIP renders. Best of both sources."""
from .figma_prefetch import fetch_file
from .figma_zip_mcp import parse_export
from .parser import extract_screens_and_flow, parse_figma_key


async def load_combined(figma_url: str, figma_token: str, zip_filename: str, zip_blob: bytes):
    """Document (with prototype flow) from the API; frame renders from the ZIP.
    Returns (file_dict, renders, info). Raises on stale/mismatched export."""
    file_key = parse_figma_key(figma_url)
    if not file_key:
        raise ValueError("Could not parse a file key from that Figma URL.")
    url_file, note = await fetch_file(file_key, figma_token)
    _, zip_renders = parse_export(zip_filename, zip_blob)

    screens, flow = extract_screens_and_flow(url_file["document"])
    matched = sum(1 for s in screens if s["id"] in zip_renders)
    info = {"fileKey": file_key, "screens": len(screens), "flowEdges": len(flow),
            "rendersMatched": matched, "cacheNote": note}
    if screens and matched == 0 and zip_renders:
        raise RuntimeError(
            "The ZIP's renders match none of the URL file's screens - the export is stale or "
            "from a different file. Re-export the ZIP from the current design.")
    return url_file, zip_renders, info
