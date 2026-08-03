"""Copilot SDK orchestration: session management, custom agent, the conversion pipeline."""
import json
import re
import time
from pathlib import Path

from figma_to_react.config import (AGENT_FILE, FALLBACK_MODELS, MAX_BUILD_FIX_ROUNDS, MAX_REPAIR_ROUNDS,
                     OUT_ROOT, PROMPT_TREE_BUDGET)
from figma_to_react.sources.figma_api import fetch_renders
from figma_to_react.core.file_writer import (render_attachments, save_renders, scan_new_files,
                          write_generated_files)
from figma_to_react.core.parser import (build_screen_payloads, collect_image_fills, curate_document, extract_screens_and_flow,
                     extract_tokens, summarize_node, tree_stats)
from figma_to_react.agent.prompts import (build_fix_prompt, build_prompt_inline, build_prompt_local_mcp, build_prompt_mcp,
                      build_repair_prompt, build_visual_fix_prompt, fill_template,
                      load_context_template)
from figma_to_react.observability import RunTracer, agent_version
from figma_to_react.qa.engine import compute_metrics, low_scoring, run_cmd, visual_verify


def load_custom_agent():
    """Parse .github/agents/figma-to-react.md -> CustomAgentConfig dict, or None."""
    try:
        raw = AGENT_FILE.read_text(encoding="utf-8")
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.S)
        if not m:
            return None
        meta = {}
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        return {"name": meta.get("name", "figma-to-react"),
                "display_name": meta.get("display_name", "Figma to React"),
                "description": meta.get("description", ""),
                "prompt": m.group(2).strip()}
    except Exception:
        return None


async def get_models(x_github_pat=None):
    """List models available on the given PAT (or logged-in user)."""
    try:
        from copilot import CopilotClient

        client = CopilotClient(github_token=x_github_pat) if x_github_pat else CopilotClient()
        await client.start()
        auth = await client.get_auth_status()
        auth_info = {"isAuthenticated": getattr(auth, "isAuthenticated", False),
                     "login": getattr(auth, "login", None),
                     "authType": getattr(auth, "authType", None),
                     "statusMessage": getattr(auth, "statusMessage", None)}
        models = await client.list_models()
        await client.stop()
        def _model_row(m):
            billing = getattr(m, "billing", None)
            mult = getattr(billing, "multiplier", None) if billing else None
            caps = getattr(m, "capabilities", None)
            supports = getattr(caps, "supports", None) if caps else None
            return {
                "id": getattr(m, "id", m),
                "name": getattr(m, "name", None) or getattr(m, "id", m),
                "multiplier": mult,
                "vision": bool(getattr(supports, "vision", False)) if supports else None,
            }

        result = {"models": [_model_row(m) for m in models], "auth": auth_info}
        if x_github_pat and auth_info.get("authType") not in ("token", "env", None):
            result["warning"] = (f"Your PAT was ignored - authenticated via {auth_info.get('authType')} "
                                 f"as {auth_info.get('login')} instead. That login has no Copilot API access.")
        return result
    except Exception as e:
        if x_github_pat:
            return {"models": [], "error": str(e)}
        return {"models": FALLBACK_MODELS, "fallback": True, "reason": str(e)}


async def pipeline(*, file, file_key, source, renders, figma_token, github_pat,
                   model, verify_build, verify_visual, use_mcp, ground, local_json_path=None,
                   mcp_strict=False, assets=None):
    """Async generator yielding SSE strings. `renders` may be pre-loaded (offline mode)."""
    def event(obj):
        return f"data: {json.dumps(obj)}\n\n"

    def log(message, level="info"):
        return event({"type": "log", "message": message, "level": level})

    timings, client = {}, None
    tracer = RunTracer("conversion", {
        "source": source, "model": model, "file": file.get("name"),
        "fileKey": file_key, "verifyBuild": verify_build, "verifyVisual": verify_visual,
        "useMcp": use_mcp, "grounded": ground, "assetCount": len(assets or {}),
    })
    try:
        # extract + curate
        t1 = time.monotonic()
        raw_stats = tree_stats(file["document"])
        curated_doc, discards = curate_document(file["document"])
        file = {**file, "document": curated_doc}
        tokens = extract_tokens(curated_doc)
        screens, flow = extract_screens_and_flow(curated_doc)
        if not screens:
            raise ValueError("No top-level frames found in this design (after curation).")
        stats = tree_stats(curated_doc)
        component_names = sorted(stats["component_names"] - {""})
        yield log(f"[2/8] Extracted: {stats['nodes']} nodes | {len(screens)} screens | "
                  f"{stats['components']} components + {stats['instances']} instances | "
                  f"{stats['texts']} text layers | {len(flow)} prototype connections", "success")
        yield log(f"[2.5/8] Curated: {len(discards)} junk nodes discarded "
                  f"({raw_stats['nodes']} -> {stats['nodes']} nodes) | "
                  f"{len(tokens['colors'])} color tokens | {len(tokens['typography'])} type styles", "success")
        if source == "upload" and not flow:
            yield log("Note: plugin exports usually lack prototype interactions — flow will rely on "
                      "frame naming / model inference. Use URL mode for exact flow wiring.", "error")

        slug = re.sub(r"[^a-z0-9]+", "-", file["name"].lower()).strip("-") or (file_key or "design")
        out_dir = OUT_ROOT / slug
        version = 1
        while out_dir.exists() and any(out_dir.iterdir()):
            version += 1
            out_dir = OUT_ROOT / f"{slug}-v{version}"
        if version > 1:
            yield log(f"Existing version(s) found — this run is v{version} ({out_dir.name}); previous versions are preserved", "success")
        out_dir.mkdir(parents=True, exist_ok=True)

        def _dims(sc):
            b = sc["node"].get("absoluteBoundingBox") or {}
            return {"width": round(b.get("width") or 1440), "height": round(b.get("height") or 900)}

        manifest = {"file": file["name"], "source": source,
                    "screens": [{"id": s["id"], "name": s["name"], "route": s["route"], "goesTo": s["goesTo"], **_dims(s)} for s in screens],
                    "flowEdges": len(flow), "tokens": tokens,
                    "discarded": {"count": len(discards), "items": discards[:100]}}
        (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        tracer.stage_event("curate", {
            "rawNodes": raw_stats["nodes"], "curatedNodes": stats["nodes"],
            "discarded": len(discards), "screens": len(screens), "flowEdges": len(flow),
            "colorTokens": len(tokens["colors"]), "typeStyles": len(tokens["typography"])})
        yield log("Ground-truth manifest saved to manifest.json (review it to see what was kept vs discarded)", "success")

        assets_note = ""
        if assets:
            adir = out_dir / "public" / "assets"
            adir.mkdir(parents=True, exist_ok=True)
            for aname, abytes in assets.items():
                try:
                    (adir / aname).write_bytes(abytes)
                except OSError:
                    pass
            names = sorted(assets.keys())
            assets_note = ("\n\nIMAGE AND ICON ASSETS extracted from the design are already in public/assets/ "
                           "of the working directory. Reference them as /assets/<filename> for photos, image fills, "
                           "logos, and icons. NEVER use placeholder URLs or invent images. Available files: "
                           + ", ".join(names[:60]))
            yield log(f"Extracted {len(assets)} design assets into public/assets/ (photos, icons)", "success")

        # renders / grounding
        render_paths, attachments = {}, []
        if renders is None:
            renders = {}
            if (ground or verify_visual) and figma_token and file_key:
                yield log("[3/8] Rendering design frames via Figma images API…")
                try:
                    renders = await fetch_renders(screens, file_key, figma_token)
                except Exception as e:
                    yield log(f"Frame rendering failed ({str(e)[:120]}) — continuing without grounding", "error")
        else:
            yield log(f"[3/8] Using {len(renders)} pre-rendered frames from the export (no API calls)", "success")
        if renders:
            render_paths = save_renders(renders, screens, out_dir)
            if ground:
                attachments = render_attachments(screens, render_paths)
                yield log(f"{len(attachments)} design renders attached to generation prompt", "success")

        # session
        yield log(f"[4/8] Copilot SDK session (model: {model})…")
        from copilot import CopilotClient, PermissionHandler

        client = CopilotClient(github_token=github_pat)
        await client.start()
        mcp_active = False
        session = None
        session_events = []
        last_resp = {}

        def _on_evt(evt):
            try:
                t = str(getattr(evt, "type", ""))
                if "TOOL" in t.upper():
                    _d = getattr(evt, "data", None)
                    tracer.tool_call(str(getattr(_d, "name", None) or getattr(_d, "toolName", None)
                                         or getattr(_d, "tool", None) or "unknown_tool"),
                                     getattr(_d, "arguments", None))
                if any(k in t.lower() for k in ("error", "warning", "fail")):
                    data = getattr(evt, "data", None)
                    msg = (getattr(data, "message", None) or getattr(data, "content", None)
                           or str(data))
                    session_events.append(f"{t}: {str(msg)[:200]}")
            except Exception:
                pass
        agent_cfg = load_custom_agent()
        agent_active = agent_cfg is not None
        agent_kwargs = {"custom_agents": [agent_cfg], "agent": agent_cfg["name"]} if agent_active else {}
        agent_kwargs.update({"working_directory": str(out_dir),
                             "on_permission_request": PermissionHandler.approve_all})
        if agent_active:
            yield log(f"Custom agent loaded from {AGENT_FILE} ({len(agent_cfg['prompt'])} char system prompt)", "success")
        else:
            yield log("No .github/agents/figma-to-react.md found — using built-in prompts")
        if use_mcp and source == "url" and figma_token:
            try:
                session = await client.create_session(
                    model=None if model == "auto" else model,
                    mcp_servers={"figma": {
                        "type": "stdio",
                        "command": "cmd",
                        "args": ["/c", "npx", "-y", "figma-developer-mcp",
                                 f"--figma-api-key={figma_token}", "--stdio"],
                        "tools": ["*"],
                    }},
                    **agent_kwargs)
                mcp_active = True
                tracer.stage_event("mcp_attach", {"server": "framelink"})
                yield log("Framelink Figma MCP attached to agent session", "success")
            except Exception as e:
                yield log(f"MCP attach failed ({str(e)[:100]}) — falling back to inline design tree", "error")
        elif use_mcp and source in ("upload", "combined") and local_json_path:
            try:
                session = await client.create_session(
                    model=None if model == "auto" else model,
                    mcp_servers={"figma-local": {
                        "type": "stdio",
                        "command": "cmd",
                        "args": ["/c", "npx", "-y", "figma-local-mcp", "--stdio"],
                        "tools": ["*"],
                    }},
                    **agent_kwargs)
                mcp_active = True
                tracer.stage_event("mcp_attach", {"server": "figma-local"})
                yield log("figma-local MCP attached — agent pulls design data from the export on disk (zero API calls)", "success")
            except Exception as e:
                yield log(f"figma-local MCP attach failed ({str(e)[:100]}) — inline design tree", "error")
        elif use_mcp and source in ("upload", "combined"):
            yield log("No extracted export on disk — inline design tree instead")
        if session is None:
            try:
                session = await client.create_session(model=None if model == "auto" else model, **agent_kwargs)
            except Exception as e:
                if agent_kwargs:
                    yield log(f"Custom agent rejected ({str(e)[:100]}) — plain session", "error")
                    agent_active = False
                    session = await client.create_session(model=None if model == "auto" else model)
                else:
                    raise
        try:
            session.on(_on_evt)
        except Exception:
            pass

        # prompt + generate
        included, excluded, used_chars = build_screen_payloads(screens)
        nodes_in = sum(p["nodes_included"] for p in included)
        grounded = bool(attachments)
        template = load_context_template() if agent_active else None
        if template:
            if mcp_active and source in ("upload", "combined"):
                tree_section = (f"Full design data is available via the figma-local MCP tools. The export JSON is at: "
                                f"{local_json_path}. Call get_figma_data_from_json(filePath) first, then get_node_image "
                                f"with each screen's nodeId to VIEW each screen, and get_node_svg for every node with an "
                                f"svgPath (inline the SVG verbatim), before generating.")
            elif mcp_active:
                tree_section = (f"Full design data is available via the Figma MCP tools. File key: {file_key}. "
                                f"Call get_figma_data (per screen id when large) before generating.")
            else:
                tree_section = ("Simplified design tree (\"role\" = semantic element, \"repeats\" = list):\n"
                                + json.dumps([p["summary"] for p in included], indent=2))
            prompt = fill_template(template, screens, tokens, tree_section, grounded)
            yield log(f"[5/8] Custom agent mode ({'mcp' if mcp_active else 'inline'}"
                      f"{' + image grounding' if grounded else ''}): prompt {len(prompt):,} chars", "success")
        elif mcp_active and source in ("upload", "combined"):
            prompt = build_prompt_local_mcp(screens, local_json_path, grounded, tokens)
            yield log(f"[5/8] Local-MCP mode{' + image grounding' if grounded else ''}: prompt {len(prompt):,} chars", "success")
        elif mcp_active:
            prompt = build_prompt_mcp(screens, file_key, grounded, tokens)
            yield log(f"[5/8] MCP mode{' + image grounding' if grounded else ''}: prompt {len(prompt):,} chars", "success")
        else:
            prompt = build_prompt_inline(screens, included, grounded, tokens)
            yield log(f"[5/8] Inline mode{' + image grounding' if grounded else ''}: "
                      f"{len(included)}/{len(screens)} screens ({used_chars:,} chars) | {nodes_in} nodes", "success")
        if not mcp_active and excluded:
            yield log(f"    deferred to repair rounds (over budget): {', '.join(excluded)}")

        image_map = []
        for sc in screens:
            collect_image_fills(sc["node"], sc["name"], image_map)
        if assets and image_map:
            avail = {f"/assets/{a}" for a in assets.keys()}
            mapped = [m for m in image_map if m["asset"] in avail]
            if mapped:
                lines = "\n".join(f'- screen "{m["screen"]}", element "{m["node"]}" -> {m["asset"]}' for m in mapped[:40])
                assets_note += ("\n\nIMAGE FILL MAP (exact photo per element - use EVERY one of these):\n" + lines)
                yield log(f"Image fill map built: {len(mapped)} photo placements resolved to asset files", "success")
        if assets_note:
            prompt = prompt + assets_note

        context_summary = {
            "source": source,
            "mode": "mcp" if mcp_active else "inline",
            "mcpServer": ("figma-local" if (mcp_active and source in ("upload", "combined"))
                          else "framelink" if mcp_active else None),
            "screensWithData": len(screens) if mcp_active else len(included),
            "screensTotal": len(screens),
            "flowEdges": len(flow),
            "designNodes": stats["nodes"],
            "assetFiles": len(assets or {}),
            "imagePlacementsMapped": len(mapped) if (assets and image_map) else 0,
            "rendersAttached": len(attachments),
            "promptChars": len(prompt),
        }
        yield log("CONTEXT: " + " | ".join(
            f"{k}={v}" for k, v in context_summary.items() if v not in (None, 0)), "success")

        async def send(p, atts=None, timeout=600, turn_name="model_turn"):

            _t0 = time.time()
            try:
                resp = await session.send_and_wait(p, attachments=atts or None, timeout=timeout)
            except Exception:
                if atts:
                    resp = await session.send_and_wait(p, timeout=timeout)
                else:
                    raise
            last_resp["repr"] = repr(resp)[:300]
            _text = ""
            if resp is not None:
                _data = getattr(resp, "data", None)
                _text = getattr(_data, "content", None) or getattr(resp, "content", None) or ""
            tracer.model_turn(turn_name, p, _text, model, attachments=len(atts or []),
                              duration=time.time() - _t0)
            return _text

        async def send_and_collect(p, atts=None, timeout=600, turn_name="model_turn"):
            t_start = time.time()
            text = await send(p, atts, timeout, turn_name=turn_name)
            files = write_generated_files(text, out_dir)
            files += [f for f in scan_new_files(out_dir, t_start) if f not in files]
            return text, files

        t2 = time.monotonic()
        yield log("Generating app code (this can take a few minutes)…")
        text, gen_files = await send_and_collect(prompt, attachments, turn_name="generate")
        if not text.strip() and not gen_files:
            yield log(f"Empty model response (event: {last_resp.get('repr', 'none')[:160]})", "error")
            for ev in session_events[-5:]:
                yield log(f"    session: {ev}", "error")
            if mcp_active and mcp_strict:
                raise RuntimeError(
                    "MCP generation returned an empty response (strict MCP mode, no fallback). "
                    "Session events: " + ("; ".join(session_events[-3:]) or "none captured")
                    + f" | last event: {last_resp.get('repr', 'none')[:200]}")
            if mcp_active:
                yield log("Retrying without MCP — inline curated design tree instead", "error")
                try:
                    await session.destroy()
                except Exception:
                    pass
                session = await client.create_session(model=None if model == "auto" else model, **agent_kwargs)
                try:
                    session.on(_on_evt)
                except Exception:
                    pass
                mcp_active = False
                if template:
                    tree_section = ("Simplified design tree (\"role\" = semantic element, \"repeats\" = list):\n"
                                    + json.dumps([p["summary"] for p in included], indent=2))
                    prompt = fill_template(template, screens, tokens, tree_section, grounded)
                else:
                    prompt = build_prompt_inline(screens, included, grounded, tokens)
                yield log(f"Retry prompt: {len(prompt):,} chars")
                text, gen_files = await send_and_collect(prompt, attachments, turn_name="generate_retry")
        all_written = list(dict.fromkeys(gen_files))
        if not all_written:
            (out_dir / "raw-response.md").write_text(text, encoding="utf-8")
            raise RuntimeError("Model response contained no file blocks — raw response saved to raw-response.md")
        timings["generate_s"] = round(time.monotonic() - t2, 1)
        yield log(f"Wrote {len(all_written)} files in {timings['generate_s']}s", "success")

        # coverage repair
        metrics = compute_metrics(screens, component_names, all_written, out_dir)
        repair_rounds = 0
        by_name = {s["name"]: s for s in screens}
        while metrics["screens"]["missedFigmaScreens"] and repair_rounds < MAX_REPAIR_ROUNDS:
            repair_rounds += 1
            missed_names = metrics["screens"]["missedFigmaScreens"]
            yield log(f"[6/8] Repair round {repair_rounds}/{MAX_REPAIR_ROUNDS}: "
                      f"{len(missed_names)} screens missing → {', '.join(missed_names)}", "error")
            missed_screens = [by_name[n] for n in missed_names if n in by_name]
            payloads, _, _ = build_screen_payloads(missed_screens, budget=40000)
            atts = render_attachments(missed_screens, render_paths, limit=5)
            _, new_files = await send_and_collect(build_repair_prompt(payloads, screens), atts, timeout=300,
                                                  turn_name=f"repair_round_{repair_rounds}")
            all_written = list(dict.fromkeys(all_written + new_files))
            yield log(f"    repair wrote {len(new_files)} files", "success" if new_files else "error")
            metrics = compute_metrics(screens, component_names, all_written, out_dir)

        sc = metrics["screens"]
        if sc["recall"] == 1.0:
            yield log(f"[6/8] ✔ 100% screen coverage after {repair_rounds} repair round(s)", "success")
        else:
            yield log(f"[6/8] ✗ Coverage: {sc['matched']}/{sc['figmaTotal']} — still missing: "
                      f"{', '.join(sc['missedFigmaScreens'])}", "error")

        # build verification
        build_status = "skipped"
        if verify_build:
            t3 = time.monotonic()
            yield log("[7/8] Build verification: npm install…")
            ok, out = await run_cmd("npm install --no-audit --no-fund", out_dir, 300)
            if not ok:
                yield log(f"npm install failed: {out[-400:]}", "error")
                build_status = "install-failed"
            else:
                for fix_round in range(MAX_BUILD_FIX_ROUNDS + 1):
                    yield log("Running npm run build…")
                    ok, out = await run_cmd("npm run build", out_dir, 180)
                    if ok:
                        build_status = "passed"
                        yield log(f"✔ Build passed ({round(time.monotonic()-t3,1)}s total)", "success")
                        break
                    if fix_round == MAX_BUILD_FIX_ROUNDS:
                        build_status = "failed"
                        yield log(f"✗ Build still failing after {MAX_BUILD_FIX_ROUNDS} fix rounds: {out[-400:]}", "error")
                        break
                    yield log(f"Build failed — asking model to fix (round {fix_round+1}/{MAX_BUILD_FIX_ROUNDS})…", "error")
                    _, fixed = await send_and_collect(build_fix_prompt(out), timeout=300,
                                                          turn_name=f"build_fix_{fix_round + 1}")
                    all_written = list(dict.fromkeys(all_written + fixed))
                    yield log(f"    fix wrote {len(fixed)} files")
            timings["build_s"] = round(time.monotonic() - t3, 1)
            tracer.stage_event("build_verify", {"status": build_status, "seconds": timings.get("build_s")})

        # visual accuracy + geometry repair
        visual, visual_repair_info = None, None
        if verify_visual and build_status == "passed" and renders:
            t4 = time.monotonic()
            yield log("[8/8] Visual accuracy: screenshotting routes vs design renders…")
            try:
                visual = await visual_verify(screens, renders, out_dir)
                scored = [v for v in visual if "ssim" in v]
                before_avg = round(sum(v["ssim"] for v in scored) / len(scored), 3) if scored else None
                yield log(f"Initial visual: avg SSIM {before_avg} across {len(scored)} screens")

                low = low_scoring(visual)
                if low:
                    names = [v["name"] for v, _ in low]
                    yield log(f"Geometry-anchored repair: {len(low)} low-scoring screens → {', '.join(names)}", "error")
                    infos = []
                    for v, problems in low:
                        s = by_name.get(v["name"])
                        if not s:
                            continue
                        counter = {"included": 0, "dropped_depth": 0}
                        infos.append({"name": v["name"], "route": v["route"], "problems": problems,
                                      "summary": summarize_node(s["node"], counter)})
                    low_screens = [by_name[n] for n in names if n in by_name]
                    atts = render_attachments(low_screens, render_paths, limit=5)
                    _, vfixed = await send_and_collect(build_visual_fix_prompt(infos), atts, timeout=400,
                                                      turn_name="visual_repair")
                    all_written = list(dict.fromkeys(all_written + vfixed))
                    yield log(f"    visual fix wrote {len(vfixed)} files")
                    ok, _ = await run_cmd("npm run build", out_dir, 180)
                    if ok:
                        revisit = [s for s in screens if s["name"] in names]
                        new_results = await visual_verify(revisit, renders, out_dir)
                        by_route = {v["route"]: v for v in new_results}
                        visual = [by_route.get(v["route"], v) if v["name"] in names else v for v in visual]
                        scored = [v for v in visual if "ssim" in v]
                        after_avg = round(sum(v["ssim"] for v in scored) / len(scored), 3) if scored else None
                        visual_repair_info = {"screens": names, "avgSsimBefore": before_avg, "avgSsimAfter": after_avg}
                        yield log(f"✔ After geometry repair: avg SSIM {before_avg} → {after_avg}", "success")
                    else:
                        yield log("Visual fix broke the build — reverting to pre-fix scores", "error")
                else:
                    yield log("✔ All screens above thresholds — no visual repair needed", "success")
                timings["visual_s"] = round(time.monotonic() - t4, 1)
                tracer.stage_event("visual_verify", {"screensScored": len(scored), "avgSsim": before_avg,
                                                     "seconds": timings.get("visual_s")})
            except ImportError:
                yield log("Playwright not installed — visual stage skipped", "error")
            except Exception as e:
                yield log(f"Visual stage failed: {str(e)[:200]}", "error")
        elif verify_visual:
            reason = "build did not pass" if build_status != "passed" else "no design renders available"
            yield log(f"[8/8] Visual stage skipped ({reason})", "error")

        await client.stop()
        client = None

        metrics = compute_metrics(screens, component_names, all_written, out_dir)
        metrics["prompt"] = {"mode": "mcp" if mcp_active else "inline",
                             "customAgent": agent_active,
                             "source": source, "grounded": grounded,
                             "screensIncluded": len(screens) if mcp_active else len(included),
                             "screensExcluded": [] if mcp_active else excluded,
                             "nodesPassedToAgent": stats["nodes"] if mcp_active else nodes_in,
                             "promptChars": len(prompt), "budget": PROMPT_TREE_BUDGET}
        metrics["figma"] = {"totalNodes": stats["nodes"], "screens": len(screens),
                            "components": stats["components"], "instances": stats["instances"],
                            "textLayers": stats["texts"], "flowConnections": len(flow)}
        metrics["timings"] = timings
        metrics["context"] = context_summary
        metrics["telemetry"] = {
            "modelTurns": tracer.model_turns,
            "tools": tracer.tool_usage(
                ["get_figma_data_from_json", "get_node_image", "get_node_svg"]
                if (mcp_active and source in ("upload", "combined"))
                else ["get_figma_data", "download_figma_images"] if mcp_active else []),
            **agent_version()}
        metrics["curation"] = {"discardedNodes": len(discards),
                               "colorTokens": len(tokens["colors"]),
                               "typeStyles": len(tokens["typography"]),
                               "listsDetected": sum(p.get("lists", 0) for p in included),
                               "nodesCollapsedInLists": sum(p.get("collapsed", 0) for p in included)}
        metrics["enforcement"] = {"repairRounds": repair_rounds, "buildStatus": build_status,
                                  "screenCoverage": metrics["screens"]["recall"],
                                  "visualRepair": visual_repair_info}
        if visual:
            scored = [v for v in visual if "ssim" in v]
            metrics["visual"] = {
                "perScreen": visual,
                "avgSsim": round(sum(v["ssim"] for v in scored) / len(scored), 3) if scored else None,
            }

        report = {"file": file["name"], "source": source, "model": model,
                  "generatedFiles": all_written, "metrics": metrics}
        (out_dir / "conversion-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

        tracer.finish(metrics, str(out_dir))

        yield event({"type": "metrics", "metrics": metrics})
        yield event({"type": "done", "outputDir": str(out_dir),
                     "screens": [{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in screens],
                     "flows": len(flow), "model": model, "files": all_written,
                     "buildStatus": build_status, "repairRounds": repair_rounds,
                     "mcp": mcp_active, "grounded": grounded, "source": source})
    except Exception as e:
        tracer.fail(str(e))
        yield event({"type": "error", "message": str(e)})
    finally:
        if client is not None:
            try:
                await client.stop()
            except Exception:
                pass



