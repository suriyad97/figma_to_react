# Architecture

```
Figma source ──► curate ──► agent session ──► generated app ──► verify ──► report
   (3 modes)     (manifest)   (Copilot SDK)      (React+Vite)    (3 checks)
```

## Layers

| Layer | Module | Responsibility |
|---|---|---|
| Transport | `app.py` | HTTP endpoints, SSE streaming, mode selection |
| Sources | `sources/` | `figma_api` (URL), `figma_zip` (offline export), `combined` (both) |
| Curation | `core/parser.py` | Discard junk, extract screens/flow/tokens, tag roles, detect lists |
| Context | `agent/prompts.py` | Fill `.github/prompts` template with curated context |
| Orchestration | `agent/service.py` | Copilot session, MCP wiring, 8-stage pipeline, repair loops |
| Output | `core/file_writer.py` | Parse fenced blocks + detect direct agent writes |
| Verification | `qa/engine.py` | Coverage metrics, SSIM, text geometry, build runs |
| Management | `api/projects.py` | List, report, preview, enhance, health, download |

## Pipeline stages

1. **Load** — URL fetch / ZIP parse / combined merge
2. **Extract** — screens, prototype flow, node statistics
3. **Curate** — discard hidden/archived/wrapper nodes; tokens; roles; list collapse → `manifest.json`
4. **Ground** — save frame renders, build the image-fill map, attach images
5. **Generate** — custom agent (from `.github/agents/`) writes the app
6. **Enforce coverage** — repair rounds until every frame has a component
7. **Verify build** — `npm install && npm run build`, model fixes errors
8. **Score visually** — SSIM + text geometry vs renders, geometry-anchored repair

## Closing conditions

Machine-checkable (enforced): every Figma frame has a routed component; the app compiles;
every relative import resolves. Scored, not enforced: visual similarity, text placement,
flow-edge implementation.

## Artifacts per run

- `manifest.json` — ground truth in (kept vs discarded, tokens, screens, routes, flow)
- `conversion-report.json` — metrics out (context, curation, coverage, build, visual, timings)
- `.figma-renders/` — design renders used for grounding and scoring
