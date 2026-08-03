"""Export parsing works from raw JSON and from a ZIP, with no network."""
import io
import json
import zipfile

from figma_to_react.sources.figma_zip import extract_asset_files, parse_export


def test_parse_export_from_json_bytes(sample_design):
    blob = json.dumps(sample_design).encode()
    file, renders = parse_export("sample_design.json", blob)
    assert file["name"] == sample_design["name"]
    assert renders == {}


def test_parse_export_and_assets_from_zip(sample_design):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("design.json", json.dumps(sample_design))
        z.writestr("design.assets/image_abc.png", b"\x89PNG fake")
        z.writestr("design.assets/icon_1_2.svg", b"<svg/>")
    blob = buf.getvalue()

    file, _ = parse_export("design.zip", blob)
    assert file["name"] == sample_design["name"]

    assets = extract_asset_files(blob)
    assert "image_abc.png" in assets
    assert "icon_1_2.svg" in assets
