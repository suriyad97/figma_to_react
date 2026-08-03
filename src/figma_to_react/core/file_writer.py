"""Writing generated files: fenced-block parsing, direct-write detection, render assets."""
import re
import time
from pathlib import Path

from figma_to_react.config import EXCLUDE_SCAN_DIRS, EXCLUDE_SCAN_FILES
from figma_to_react.core.parser import safe_name


def write_generated_files(text: str, out_dir: Path) -> list[str]:
    written = []
    for m in re.finditer(r"```file:([^\n]+)\n(.*?)```", text, re.DOTALL):
        rel = m.group(1).strip().lstrip("/")
        target = (out_dir / rel).resolve()
        if not str(target).startswith(str(out_dir)):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(m.group(2), encoding="utf-8")
        written.append(rel)
    return written




def scan_new_files(out_dir: Path, since: float) -> list[str]:
    """Files the agent wrote directly into the working directory after `since`."""
    found = []
    for p in out_dir.rglob("*"):
        if not p.is_file():
            continue
        if any(part in EXCLUDE_SCAN_DIRS for part in p.parts):
            continue
        rel = p.relative_to(out_dir).as_posix()
        if Path(rel).name in EXCLUDE_SCAN_FILES:
            continue
        try:
            if p.stat().st_mtime >= since - 2:
                found.append(rel)
        except OSError:
            pass
    return found


# ---------- metrics ----------


def save_renders(renders, screens, out_dir: Path):
    rd = out_dir / ".figma-renders"
    rd.mkdir(parents=True, exist_ok=True)
    paths = {}
    for s in screens:
        if s["id"] in renders:
            p = rd / f"{safe_name(s['name'])}.png"
            p.write_bytes(renders[s["id"]])
            paths[s["id"]] = str(p)
    return paths


def render_attachments(screens, render_paths, limit=10):
    atts = []
    for s in screens[:limit]:
        if s["id"] in render_paths:
            atts.append({"type": "file", "path": render_paths[s["id"]],
                         "displayName": f"design render: {s['name']}"})
    return atts


# ---------- prompts ----------
