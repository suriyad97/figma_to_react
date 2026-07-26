"""Quality assurance: coverage metrics, SSIM, build runs, visual verification."""
import asyncio
import io
from pathlib import Path

import httpx

from .config import (MAX_VISUAL_REPAIR_SCREENS, PREVIEW_PORT, SSIM_REPAIR_THRESHOLD,
                     TEXT_REPAIR_THRESHOLD)
from .parser import collect_texts, norm


def compute_metrics(figma_screens, component_names, written, out_dir: Path):
    gen_screens = [Path(f).stem for f in written if f.replace("\\", "/").startswith("src/screens/")]
    figma_names = [s["name"] for s in figma_screens]

    def matches(a, b):
        na, nb = norm(a), norm(b)
        return na and nb and (na in nb or nb in na)

    matched_figma = [f for f in figma_names if any(matches(f, g) for g in gen_screens)]
    matched_gen = [g for g in gen_screens if any(matches(f, g) for f in figma_names)]
    recall = len(matched_figma) / len(figma_names) if figma_names else None
    precision = len(matched_gen) / len(gen_screens) if gen_screens else None

    code = " ".join(
        norm((out_dir / f).read_text(encoding="utf-8", errors="ignore"))
        for f in written if f.endswith((".jsx", ".js", ".css", ".html")) and (out_dir / f).exists()
    )
    comp_names = [c for c in component_names if norm(c)]
    found = [c for c in comp_names if norm(c) in code]

    return {
        "screens": {
            "figmaTotal": len(figma_names), "generatedTotal": len(gen_screens),
            "matched": len(matched_figma),
            "recall": round(recall, 3) if recall is not None else None,
            "precision": round(precision, 3) if precision is not None else None,
            "missedFigmaScreens": [f for f in figma_names if f not in matched_figma],
            "extraGeneratedScreens": [g for g in gen_screens if g not in matched_gen],
        },
        "components": {
            "passedToAgent": len(comp_names), "foundInOutput": len(found),
            "coverage": round(len(found) / len(comp_names), 3) if comp_names else None,
            "missing": [c for c in comp_names if c not in found][:25],
        },
    }


def ssim_score(png_a: bytes, png_b: bytes) -> tuple:
    """Compare design render vs app screenshot.
    Normalizes both to the same width, compares the overlapping height region.
    Returns (ssim, height_ratio)."""
    import numpy as np
    from PIL import Image

    ia = Image.open(io.BytesIO(png_a)).convert("L")
    ib = Image.open(io.BytesIO(png_b)).convert("L")

    # normalize to a common width (design render may be @2x)
    W = 512
    ia = ia.resize((W, max(1, round(ia.height * W / ia.width))))
    ib = ib.resize((W, max(1, round(ib.height * W / ib.width))))

    height_ratio = round(ib.height / ia.height, 3) if ia.height else None

    # compare the region both images actually cover
    H = min(ia.height, ib.height)
    a = np.asarray(ia.crop((0, 0, W, H)), dtype=np.float64)
    b = np.asarray(ib.crop((0, 0, W, H)), dtype=np.float64)

    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    win = 32
    vals = []
    for i in range(0, H - win + 1, win):
        for j in range(0, W - win + 1, win):
            wa, wb = a[i:i+win, j:j+win], b[i:i+win, j:j+win]
            ma, mb = wa.mean(), wb.mean()
            va, vb = wa.var(), wb.var()
            cov = ((wa - ma) * (wb - mb)).mean()
            vals.append(((2*ma*mb + C1) * (2*cov + C2)) / ((ma*ma + mb*mb + C1) * (va + vb + C2)))
    return (round(float(np.mean(vals)), 3) if vals else None), height_ratio


async def run_cmd(cmd: str, cwd: Path, timeout_s: int):
    proc = await asyncio.create_subprocess_shell(
        cmd, cwd=str(cwd),
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout_s)
    except asyncio.TimeoutError:
        proc.kill()
        return False, f"'{cmd}' timed out after {timeout_s}s"
    return proc.returncode == 0, out.decode(errors="ignore")[-3000:]


async def visual_verify(screens, renders, out_dir: Path):
    from playwright.async_api import async_playwright

    preview = await asyncio.create_subprocess_shell(
        f"npx vite preview --port {PREVIEW_PORT} --strictPort",
        cwd=str(out_dir), stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
    try:
        async with httpx.AsyncClient(timeout=5) as http:
            for _ in range(30):
                try:
                    await http.get(f"http://localhost:{PREVIEW_PORT}/")
                    break
                except Exception:
                    await asyncio.sleep(1)

        results = []
        async with async_playwright() as pw:
            browser = await pw.chromium.launch()
            for s in screens:
                if s["id"] not in renders:
                    continue
                fb = s["node"].get("absoluteBoundingBox") or {"x": 0, "y": 0, "width": 1280, "height": 800}
                w = max(320, min(1920, int(fb["width"])))
                page = await browser.new_page(viewport={"width": w, "height": 900})
                try:
                    await page.goto(f"http://localhost:{PREVIEW_PORT}{s['route']}",
                                    wait_until="networkidle", timeout=20000)
                    await page.evaluate("() => new Promise(r => { "
                                        "const imgs = [...document.images].filter(i => !i.complete); "
                                        "if (!imgs.length) return r(); let n = imgs.length; "
                                        "imgs.forEach(i => i.addEventListener('load', () => --n || r()) "
                                        "|| i.addEventListener('error', () => --n || r())); "
                                        "setTimeout(r, 4000); })")
                    shot = await page.screenshot(full_page=True)
                    score, height_ratio = ssim_score(renders[s["id"]], shot)

                    texts = []
                    collect_texts(s["node"], fb, texts)
                    geo = {"total": len(texts), "found": 0, "within5pct": 0, "meanOffsetPct": None}
                    if texts:
                        rects = await page.evaluate(
                            """(targets) => targets.map(t => {
                                const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                                while (w.nextNode()) {
                                    const n = w.currentNode;
                                    if (n.textContent.trim() === t) {
                                        const r = n.parentElement.getBoundingClientRect();
                                        return {cx: r.x + r.width/2, cy: r.y + r.height/2};
                                    }
                                }
                                return null;
                            })""",
                            [t["text"] for t in texts])
                        diag = (fb["width"] ** 2 + fb["height"] ** 2) ** 0.5
                        offsets = []
                        for t, rect in zip(texts, rects):
                            if rect:
                                geo["found"] += 1
                                off = ((rect["cx"] - t["cx"]) ** 2 + (rect["cy"] - t["cy"]) ** 2) ** 0.5
                                pct = off / diag * 100
                                offsets.append(pct)
                                if pct <= 5:
                                    geo["within5pct"] += 1
                        if offsets:
                            geo["meanOffsetPct"] = round(sum(offsets) / len(offsets), 1)

                    results.append({"name": s["name"], "route": s["route"], "ssim": score,
                                    "heightRatio": height_ratio, "textGeometry": geo})
                except Exception as e:
                    results.append({"name": s["name"], "route": s["route"], "error": str(e)[:150]})
                finally:
                    await page.close()
            await browser.close()
        return results
    finally:
        try:
            import subprocess
            subprocess.run(f"taskkill /F /T /PID {preview.pid}", shell=True, capture_output=True)
        except Exception:
            pass


def low_scoring(visual):
    low = []
    for v in visual:
        if "error" in v:
            low.append((v, "route failed to render"))
            continue
        problems = []
        if v["ssim"] < SSIM_REPAIR_THRESHOLD:
            problems.append(f"visual similarity {v['ssim']} (target >= {SSIM_REPAIR_THRESHOLD})")
        hr = v.get("heightRatio")
        if hr is not None and (hr < 0.75 or hr > 1.3):
            problems.append(f"page height is {round(hr*100)}% of the design's (vertical spacing/section sizes off)")
        g = v.get("textGeometry") or {}
        if g.get("found"):
            ratio = g["within5pct"] / g["found"]
            if ratio < TEXT_REPAIR_THRESHOLD:
                problems.append(f"only {g['within5pct']}/{g['found']} texts within 5% of design position "
                                f"(mean offset {g.get('meanOffsetPct')}%)")
        if g.get("total") and not g.get("found"):
            problems.append("none of the design's text layers were found in the page")
        if problems:
            low.append((v, "; ".join(problems)))
    return low[:MAX_VISUAL_REPAIR_SCREENS]



