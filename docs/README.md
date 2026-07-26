# figma-to-react

Figma → React converter built on the GitHub Copilot SDK.
Paste a Figma URL or upload a Framelink Exporter ZIP; get a complete, verified React app.

## Structure

```
figma-to-react/
├── main.py                  # FastAPI entry point (routes only)
├── copilot_client/
│   ├── config.py            # all tunables (budgets, thresholds, paths)
│   ├── parser.py            # tree parsing, curation → manifest, tokens, summaries
│   ├── figma_prefetch.py    # URL mode: REST API fetch, cache, rate-limit handling
│   ├── figma_zip_mcp.py     # offline mode: plugin export ZIP parsing
│   ├── figma_combined.py    # combined mode: URL flow + ZIP renders
│   ├── prompts.py           # prompt builders + .github template filling
│   ├── copilot_service.py   # Copilot SDK sessions, custom agent, the 8-stage pipeline
│   ├── file_writer.py       # fenced-block parsing + direct agent-write detection
│   └── qa_engine.py         # coverage metrics, SSIM, build verify, Playwright visual QA
├── .github/
│   ├── agents/figma-to-react.md        # custom agent (system prompt) — edit freely
│   └── prompts/figma-context.prompt.md # context template with {{placeholders}}
├── frontend/                # React + Vite UI
├── generated/               # output apps, one folder per design
└── docs/
```

## Run

```bash
# backend (repo root)
pip install -r requirements.txt
py -3.12 -m uvicorn main:app --port 4000

# frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Modes

| Mode | Input | Flow wiring | Renders | Figma API cost |
|---|---|---|---|---|
| URL | design link | exact (prototype links) | images API | 2+ calls |
| Offline | plugin ZIP | inferred from names | bundled PNGs | 0 |
| Combined | ZIP + link | exact | bundled PNGs | 1 call |

## Pipeline stages

1. Load (URL fetch / ZIP parse / combined merge)
2. Extract screens + prototype flow · 2.5 Curate → `manifest.json` (discards, tokens, roles, lists)
3. Attach frame renders (visual grounding)
4. Copilot session (custom agent from `.github/agents`, model from Settings)
5. Generate (agent writes files into `generated/<design>/`)
6. Coverage enforcement — repair until 100% screens
7. Build verification — npm build, model fixes errors
8. Visual QA — SSIM + text geometry vs renders, geometry-anchored repair

Every run writes `manifest.json` (ground truth in) and `conversion-report.json` (metrics out).

## Requirements

- Python 3.12, Node 18+
- Fine-grained GitHub PAT with **Copilot Requests** permission + active Copilot plan
- Figma token only for URL/combined modes

