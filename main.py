"""13957_ui_weaver — Figma to React converter.
FastAPI entry point; all logic lives in the copilot_client package."""
import json
from typing import Optional

from fastapi import FastAPI, File, Form, Header, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from copilot_client.copilot_service import get_models, pipeline
from copilot_client.figma_combined import load_combined
from copilot_client.figma_prefetch import fetch_file
from pathlib import Path

from copilot_client.figma_zip_mcp import extract_asset_files, extract_export_to_disk, parse_export
from copilot_client.parser import parse_figma_key
from copilot_client.projects import router as projects_router

app = FastAPI(title="figma-to-react")
app.include_router(projects_router)


def _event(obj):
    return f"data: {json.dumps(obj)}\n\n"


def _log(message, level="info"):
    return _event({"type": "log", "message": message, "level": level})


@app.get("/api/models")
async def models(x_github_pat: Optional[str] = Header(default=None)):
    return await get_models(x_github_pat)


class ConvertRequest(BaseModel):
    figmaUrl: str
    figmaToken: str
    githubPat: str
    model: str = "auto"
    verifyBuild: bool = True
    verifyVisual: bool = True
    useMcp: bool = True
    groundWithImages: bool = True


@app.post("/api/convert")
async def convert(req: ConvertRequest):
    """URL mode: full API fetch — exact prototype flow, renders via images API."""
    async def stream():
        try:
            file_key = parse_figma_key(req.figmaUrl)
            if not file_key:
                raise ValueError("Could not parse a file key from that Figma URL.")
            yield _log(f"[1/8] Fetching Figma file {file_key}…")
            file, note = await fetch_file(file_key, req.figmaToken)
            yield _log(f'Loaded "{file["name"]}"' + (f" from {note}" if note else ""), "success")

            async for chunk in pipeline(
                    file=file, file_key=file_key, source="url", renders=None,
                    figma_token=req.figmaToken, github_pat=req.githubPat, model=req.model,
                    verify_build=req.verifyBuild, verify_visual=req.verifyVisual,
                    use_mcp=req.useMcp, ground=req.groundWithImages):
                yield chunk
        except Exception as e:
            yield _event({"type": "error", "message": str(e)})

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/api/convert-local")
async def convert_local(
    export: UploadFile = File(...),
    githubPat: str = Form(...),
    model: str = Form("auto"),
    verifyBuild: bool = Form(True),
    verifyVisual: bool = Form(True),
    groundWithImages: bool = Form(True),
):
    """Offline mode: Framelink Exporter ZIP — zero Figma API calls."""
    blob = await export.read()
    filename = export.filename or "export.zip"

    async def stream():
        try:
            yield _log(f"[1/8] Parsing uploaded export {filename} ({len(blob)//1024} KB) — zero Figma API calls")
            file, renders = parse_export(filename, blob)
            json_path = extract_export_to_disk(filename, blob, Path("designs"))
            yield _log(f'Loaded "{file["name"]}" from export | {len(renders)} bundled frame renders matched'
                       + (" | extracted to disk for figma-local MCP" if json_path else ""), "success")

            async for chunk in pipeline(
                    file=file, file_key=None, source="upload", renders=renders,
                    figma_token=None, github_pat=githubPat, model=model,
                    verify_build=verifyBuild, verify_visual=verifyVisual,
                    use_mcp=True, ground=groundWithImages, local_json_path=json_path,
                    mcp_strict=True, assets=extract_asset_files(blob)):
                yield chunk
        except Exception as e:
            yield _event({"type": "error", "message": str(e)})

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/api/convert-combined")
async def convert_combined(
    export: UploadFile = File(...),
    figmaUrl: str = Form(...),
    figmaToken: str = Form(...),
    githubPat: str = Form(...),
    model: str = Form("auto"),
    verifyBuild: bool = Form(True),
    verifyVisual: bool = Form(True),
    groundWithImages: bool = Form(True),
):
    """Combined mode: exact flow from the URL (1 API call) + renders from the ZIP."""
    blob = await export.read()
    filename = export.filename or "export.zip"

    async def stream():
        try:
            yield _log(f"[1/8] Combined mode: URL flow + ZIP renders ({filename}, {len(blob)//1024} KB)")
            file, renders, info = await load_combined(figmaUrl, figmaToken, filename, blob)
            json_path = extract_export_to_disk(filename, blob, Path("designs"))
            yield _log(f'Loaded "{file["name"]}" | {info["screens"]} screens, {info["flowEdges"]} flow edges '
                       f'from API | {info["rendersMatched"]} renders matched from ZIP', "success")

            async for chunk in pipeline(
                    file=file, file_key=info["fileKey"], source="combined", renders=renders,
                    figma_token=figmaToken, github_pat=githubPat, model=model,
                    verify_build=verifyBuild, verify_visual=verifyVisual,
                    use_mcp=True, ground=groundWithImages, local_json_path=json_path,
                    mcp_strict=True, assets=extract_asset_files(blob)):
                yield chunk
        except Exception as e:
            yield _event({"type": "error", "message": str(e)})

    return StreamingResponse(stream(), media_type="text/event-stream")
