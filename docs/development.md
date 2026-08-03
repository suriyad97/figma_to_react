# Development

```bash
make setup     # pip install -e ".[dev]" + npm install
make test      # 12 tests, no model calls, no network
make api       # backend on :4000
make web       # frontend on :5173
```

## Tools that need no credentials

```bash
python scripts/inspect_export.py path/to/export.zip   # what would the agent see?
python scripts/verify_projects.py                     # health of every generated app
```

## Conventions

- Deterministic logic lives in `core/` and `qa/` and is unit-tested.
- Anything touching the model lives in `agent/` and is *not* unit-tested - it is
  verified at runtime by the pipeline's own enforcement stages.
- New design sources go in `sources/` and must return `(file_dict, renders)`.
- Prompts and agent behaviour live in `.github/`, not in Python, so they can be
  edited and reviewed without touching code.
