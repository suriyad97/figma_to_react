"""Offline mode: parse Figma plugin export ZIPs (JSON tree + bundled PNG renders)."""
import io
import json
import zipfile
from pathlib import Path

from figma_to_react.core.parser import extract_screens_and_flow, safe_name


def parse_export(filename: str, blob: bytes):
    """Parse a Figma plugin export (ZIP with JSON + assets, or bare JSON).
    Returns (file_dict{name,document}, renders{screen_id: png_bytes})."""
    doc_json, assets = None, {}
    if zipfile.is_zipfile(io.BytesIO(blob)):
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            for info in z.infolist():
                if info.is_dir():
                    continue
                n = info.filename
                if n.lower().endswith(".json") and doc_json is None:
                    doc_json = json.loads(z.read(n).decode("utf-8"))
                elif n.lower().endswith(".png"):
                    assets[Path(n).name] = z.read(n)
    else:
        doc_json = json.loads(blob.decode("utf-8"))

    if doc_json is None:
        raise ValueError("No JSON found in the uploaded export.")

    # Accept GetFileResponse {document}, plugin export, or GetFileNodesResponse {nodes}
    if "document" in doc_json:
        document = doc_json["document"]
    elif "nodes" in doc_json:
        children = [v["document"] for v in doc_json["nodes"].values() if isinstance(v, dict) and "document" in v]
        document = {"type": "DOCUMENT", "children": [
            {"type": "CANVAS", "name": "Exported", "children": children}]}
    elif doc_json.get("type") == "DOCUMENT":
        document = doc_json
    else:
        raise ValueError("Unrecognized export JSON shape (expected 'document' or 'nodes' at top level).")

    # If top-level children are frames (not canvases), wrap them in a canvas
    kids = document.get("children", [])
    if kids and all(k.get("type") != "CANVAS" for k in kids):
        document = {"type": "DOCUMENT", "children": [{"type": "CANVAS", "name": "Exported", "children": kids}]}

    name = doc_json.get("name") or Path(filename).stem
    file_dict = {"name": name, "document": document}

    # Match render PNGs to screen ids: filenames typically contain the node id
    screens, _ = extract_screens_and_flow(document)
    renders = {}
    for s in screens:
        sid = s["id"]
        variants = {sid, sid.replace(":", "-"), sid.replace(":", "_"), sid.replace(":", "")}
        for fname, data in assets.items():
            base = Path(fname).stem
            if any(v in base for v in variants) or safe_name(s["name"]) == safe_name(base):
                renders[sid] = data
                break
    return file_dict, renders


def extract_export_to_disk(filename: str, blob: bytes, designs_root: Path):
    """Unzip a plugin export into designs/<slug>/ so the figma-local MCP server can read it.
    Returns the absolute path to the design JSON, or None."""
    import re as _re
    slug = _re.sub(r"[^a-z0-9]+", "-", Path(filename).stem.lower()).strip("-") or "design"
    target = designs_root / slug
    target.mkdir(parents=True, exist_ok=True)
    json_path = None
    if zipfile.is_zipfile(io.BytesIO(blob)):
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            z.extractall(target)
        for cand in sorted(target.rglob("*.json")):
            json_path = cand
            break
    else:
        json_path = target / (Path(filename).stem + ".json")
        json_path.write_bytes(blob)
    return str(json_path.resolve()) if json_path else None


def extract_asset_files(blob: bytes) -> dict:
    """Pull image/icon asset bytes (png/jpg/svg) out of a plugin export ZIP."""
    import re as _re
    assets = {}
    if not zipfile.is_zipfile(io.BytesIO(blob)):
        return assets
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            name = Path(info.filename).name
            if name.lower().endswith((".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif")):
                safe = _re.sub(r"[^A-Za-z0-9._-]", "-", name)
                assets[safe] = z.read(info.filename)
    return assets
