"""Project management: list, report (structural/behavioral/visual), preview, enhance, delete, download."""
import asyncio
import json
import re
import tempfile
import time
import zipfile
from pathlib import Path

from fastapi import APIRouter, Form
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from .config import OUT_ROOT
from .file_writer import scan_new_files
from .parser import norm, safe_name

router = APIRouter(prefix="/api/projects")
PREVIEW_PORT = 4174
_preview = {"proc_pid": None, "slug": None}


def _dir(slug: str) -> Path:
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        raise ValueError("bad slug")
    d = (OUT_ROOT / slug).resolve()
    if not str(d).startswith(str(OUT_ROOT)):
        raise ValueError("bad slug")
    return d


def _load_json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def check_health(d: Path) -> dict:
    """Verify every relative import in the project resolves to a real file."""
    missing, checked = [], 0
    src = d / "src"
    if not src.exists():
        return {"ok": False, "missing": ["src/ (no source directory)"], "checked": 0}
    for f in src.rglob("*.jsx"):
        try:
            code = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for m in re.finditer(r"""from\s+['"](\.[^'"]+)['"]""", code):
            rel = m.group(1)
            checked += 1
            target = (f.parent / rel).resolve()
            candidates = [target]
            if not target.suffix:
                candidates += [target.with_suffix(".jsx"), target.with_suffix(".js"),
                               target / "index.jsx", target / "index.js"]
            if not any(c.exists() for c in candidates):
                missing.append(f"{f.relative_to(d).as_posix()} -> {rel}")
    entry_missing = [x for x in ("package.json", "index.html", "src/main.jsx")
                     if not (d / x).exists()]
    missing = entry_missing + missing
    return {"ok": not missing, "missing": missing[:10], "checked": checked}


@router.get("")
def list_projects():
    out = []
    if OUT_ROOT.exists():
        for d in sorted(OUT_ROOT.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            if not d.is_dir():
                continue
            report = _load_json(d / "conversion-report.json")
            manifest = _load_json(d / "manifest.json")
            m = (report or {}).get("metrics", {})
            out.append({
                "slug": d.name,
                "name": (report or manifest or {}).get("file", d.name),
                "modified": d.stat().st_mtime,
                "screens": m.get("figma", {}).get("screens") or len((manifest or {}).get("screens", [])),
                "buildStatus": m.get("enforcement", {}).get("buildStatus"),
                "coverage": m.get("screens", {}).get("recall"),
                "avgSsim": (m.get("visual") or {}).get("avgSsim"),
                "hasReport": report is not None,
                "hasApp": (d / "package.json").exists(),
                "health": check_health(d),
            })
    return {"projects": out}


@router.get("/{slug}/report")
def project_report(slug: str):
    d = _dir(slug)
    report = _load_json(d / "conversion-report.json") or {}
    manifest = _load_json(d / "manifest.json") or {}
    metrics = report.get("metrics", {})
    screens = manifest.get("screens", [])

    # behavioral: for each flow edge, is the target route referenced in the source screen's file?
    route_by_name = {s["name"]: s.get("route") for s in screens}
    gen_files = {f.stem: f for f in (d / "src" / "screens").glob("*.jsx")} if (d / "src" / "screens").exists() else {}

    def file_for(name):
        n = norm(name)
        for stem, f in gen_files.items():
            if n and (n in norm(stem) or norm(stem) in n):
                return f
        return None

    behavioral = []
    for s in screens:
        src_file = file_for(s["name"])
        code = src_file.read_text(encoding="utf-8", errors="ignore") if src_file else ""
        for target in s.get("goesTo", []):
            route = route_by_name.get(target)
            behavioral.append({
                "from": s["name"], "to": target, "route": route,
                "implemented": bool(route and route in code),
                "sourceFile": src_file.name if src_file else None,
            })

    visual_by_name = {}
    for v in (metrics.get("visual") or {}).get("perScreen", []):
        visual_by_name[v.get("name")] = v

    screen_details = []
    for s in screens:
        render = d / ".figma-renders" / f"{safe_name(s['name'])}.png"
        screen_details.append({
            "name": s["name"], "route": s.get("route"), "goesTo": s.get("goesTo", []),
            "id": s.get("id"),
            "width": s.get("width", 1440), "height": s.get("height", 900),
            "renderUrl": f"/api/projects/{slug}/render/{safe_name(s['name'])}" if render.exists() else None,
            "visual": visual_by_name.get(s["name"]),
            "generatedFile": (file_for(s["name"]) or Path("x")).name if file_for(s["name"]) else None,
        })

    meta = _load_json(d / "project-meta.json") or {}
    figma_url = meta.get("figmaUrl") or report.get("url")

    impl = [b for b in behavioral if b["implemented"]]
    return {
        "slug": slug, "name": report.get("file", manifest.get("file", slug)),
        "figmaUrl": figma_url,
        "metrics": metrics, "manifest": manifest,
        "screens": screen_details,
        "behavioral": {"edges": behavioral, "total": len(behavioral), "implemented": len(impl),
                       "score": round(len(impl) / len(behavioral), 3) if behavioral else None},
    }


@router.post("/{slug}/figma-url")
def set_figma_url(slug: str, url: str = Form(...)):
    """Persist the Figma prototype URL for side-by-side interactive comparison."""
    d = _dir(slug)
    meta_path = d / "project-meta.json"
    meta = _load_json(meta_path) or {}
    meta["figmaUrl"] = url.strip()
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return {"figmaUrl": meta["figmaUrl"]}


@router.get("/{slug}/render/{name}")
def render_png(slug: str, name: str):
    d = _dir(slug)
    p = d / ".figma-renders" / f"{re.sub(r'[^a-z0-9-]', '', name)}.png"
    if not p.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(p, media_type="image/png")


@router.delete("/{slug}")
def delete_project(slug: str):
    import shutil
    d = _dir(slug)
    shutil.rmtree(d, ignore_errors=True)
    return {"deleted": slug}


@router.get("/{slug}/download")
def download_project(slug: str):
    d = _dir(slug)
    tmp = Path(tempfile.gettempdir()) / f"{slug}-{int(time.time())}.zip"
    skip = {"node_modules", "dist"}
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for p in d.rglob("*"):
            if p.is_file() and not any(part in skip for part in p.parts):
                z.write(p, p.relative_to(d))
    return FileResponse(tmp, media_type="application/zip", filename=f"{slug}.zip")


@router.post("/{slug}/preview")
async def start_preview(slug: str):
    """Start (or switch) the vite preview server for a project. SSE progress, ends with ready+url."""
    d = _dir(slug)

    async def stream():
        def ev(o):
            return f"data: {json.dumps(o)}\n\n"

        try:
            import subprocess
            if _preview["proc_pid"]:
                subprocess.run(f"taskkill /F /T /PID {_preview['proc_pid']}", shell=True, capture_output=True)
                _preview.update(proc_pid=None, slug=None)

            health = check_health(d)
            if not health["ok"]:
                raise RuntimeError("Project is incomplete - missing files: "
                                   + "; ".join(health["missing"])
                                   + ". Use Enhance to regenerate them, or re-run the conversion.")

            if not (d / "node_modules").exists():
                yield ev({"type": "log", "message": "Installing dependencies (first preview)…"})
                proc = await asyncio.create_subprocess_shell(
                    "npm install --no-audit --no-fund", cwd=str(d),
                    stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
                await asyncio.wait_for(proc.communicate(), 300)
            dist = d / "dist"
            newest_src = max((f.stat().st_mtime for f in (d / "src").rglob("*") if f.is_file()), default=0)
            dist_time = dist.stat().st_mtime if dist.exists() else 0
            if not dist.exists() or newest_src > dist_time:
                yield ev({"type": "log", "message": "Building app (sources changed since last build)…"})
                proc = await asyncio.create_subprocess_shell(
                    "npm run build", cwd=str(d),
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
                bout, _ = await asyncio.wait_for(proc.communicate(), 180)
                if proc.returncode != 0:
                    raise RuntimeError("Build failed: " + bout.decode(errors="ignore")[-400:])

            yield ev({"type": "log", "message": "Starting preview server…"})
            proc = await asyncio.create_subprocess_shell(
                f"npx vite preview --port {PREVIEW_PORT} --strictPort", cwd=str(d),
                stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
            _preview.update(proc_pid=proc.pid, slug=slug)

            import httpx
            async with httpx.AsyncClient(timeout=3) as http:
                for _ in range(30):
                    try:
                        await http.get(f"http://localhost:{PREVIEW_PORT}/")
                        break
                    except Exception:
                        await asyncio.sleep(1)
            yield ev({"type": "ready", "url": f"http://localhost:{PREVIEW_PORT}"})
        except Exception as e:
            yield ev({"type": "error", "message": str(e)[:300]})

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/{slug}/enhance")
async def enhance(slug: str, message: str = Form(...), githubPat: str = Form(...),
                  model: str = Form("auto")):
    """Chat-driven enhancement: the agent edits the generated app in place."""
    d = _dir(slug)

    async def stream():
        def ev(o):
            return f"data: {json.dumps(o)}\n\n"

        client = None
        try:
            from copilot import CopilotClient, PermissionHandler

            yield ev({"type": "log", "message": f"Starting enhancement session ({model})…"})
            client = CopilotClient(github_token=githubPat)
            await client.start()
            session = await client.create_session(
                model=None if model == "auto" else model,
                working_directory=str(d),
                on_permission_request=PermissionHandler.approve_all)

            files = [str(p.relative_to(d)) for p in d.rglob("*.jsx")][:40]
            prompt = f"""You are enhancing an existing generated React (Vite) app in the current working directory.
Project files include: {', '.join(files)} plus src/styles.css, package.json, index.html.
Edit files DIRECTLY using your file tools. Do not run npm commands.

USER REQUEST: {message}"""

            t0 = time.time()
            resp = await session.send_and_wait(prompt, timeout=600)
            text = ""
            if resp is not None:
                data = getattr(resp, "data", None)
                text = getattr(data, "content", None) or ""
            changed = scan_new_files(d, t0)
            yield ev({"type": "changes", "files": changed})

            if changed:
                yield ev({"type": "log", "message": "Rebuilding to verify…"})
                proc = await asyncio.create_subprocess_shell(
                    "npm run build", cwd=str(d),
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
                out, _ = await asyncio.wait_for(proc.communicate(), 180)
                ok = proc.returncode == 0
                yield ev({"type": "build", "ok": ok,
                          "output": "" if ok else out.decode(errors="ignore")[-500:]})
            yield ev({"type": "reply", "message": text or "(files updated)"})
            await client.stop()
            client = None
        except Exception as e:
            yield ev({"type": "error", "message": str(e)[:400]})
        finally:
            if client is not None:
                try:
                    await client.stop()
                except Exception:
                    pass

    return StreamingResponse(stream(), media_type="text/event-stream")
