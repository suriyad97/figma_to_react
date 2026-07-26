"""URL mode: Figma REST API fetching with cache and rate-limit handling."""
import asyncio
import time

import httpx

from .config import CACHE_TTL

_FILE_CACHE: dict = {}
_RENDER_CACHE: dict = {}


async def fetch_file(file_key: str, figma_token: str):
    """Fetch a Figma file (cached). Returns (file_json, note). Raises RuntimeError with helpful messages."""
    cached = _FILE_CACHE.get(file_key)
    if cached and time.monotonic() - cached[0] < CACHE_TTL:
        return cached[1], f"cache ({int(time.monotonic() - cached[0])}s old)"
    async with httpx.AsyncClient(timeout=60) as http:
        r = await http.get(f"https://api.figma.com/v1/files/{file_key}",
                           headers={"X-Figma-Token": figma_token})
        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", "30"))
            if wait <= 60:
                await asyncio.sleep(wait)
                r = await http.get(f"https://api.figma.com/v1/files/{file_key}",
                                   headers={"X-Figma-Token": figma_token})
            else:
                raise RuntimeError(
                    f"Figma rate limit exceeded (resets in ~{wait//3600+1}h). Starter-plan files get "
                    f"only 6 API requests/month. Use offline mode: export a ZIP with the "
                    f"'Framelink Exporter' plugin and upload it - no API needed.")
    if r.status_code == 400 and "not supported" in r.text:
        raise RuntimeError("This is a Figma Make/FigJam/Slides file - the Figma API only serves "
                           "Design files. Use a figma.com/design/... link.")
    if r.status_code != 200:
        raise RuntimeError(f"Figma API {r.status_code}: {r.text[:200]}")
    file = r.json()
    _FILE_CACHE[file_key] = (time.monotonic(), file)
    return file, None


async def fetch_renders(screens, file_key, figma_token):
    cached = _RENDER_CACHE.get(file_key)
    if cached and time.monotonic() - cached[0] < CACHE_TTL:
        return cached[1]
    ids = ",".join(s["id"] for s in screens)
    renders = {}
    async with httpx.AsyncClient(timeout=120) as http:
        r = await http.get(f"https://api.figma.com/v1/images/{file_key}",
                           params={"ids": ids, "format": "png", "scale": 1},
                           headers={"X-Figma-Token": figma_token})
        if r.status_code != 200:
            raise RuntimeError(f"Figma images API {r.status_code}: {r.text[:150]}")
        urls = r.json().get("images", {})
        for sid, url in urls.items():
            if url:
                img = await http.get(url)
                if img.status_code == 200:
                    renders[sid] = img.content
    _RENDER_CACHE[file_key] = (time.monotonic(), renders)
    return renders
