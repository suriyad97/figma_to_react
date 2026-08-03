.PHONY: setup api web app test lint format verify clean

setup:          ## install the package (editable) and dev tools
	pip install -e ".[dev]"
	cd frontend && npm install

api:            ## run the FastAPI backend on :4000
	uvicorn figma_to_react.app:app --port 4000 --app-dir src

web:            ## run the Vite frontend on :5173
	cd frontend && npm run dev

test:           ## run the test suite (no model calls, no network)
	pytest -q

lint:
	ruff check src tests scripts

format:
	ruff format src tests scripts

verify:         ## health-check every generated project
	python scripts/verify_projects.py

inspect:        ## inspect a Figma export ZIP without any model call
	python scripts/inspect_export.py $(ZIP)

clean:
	python -c "import shutil,pathlib;[shutil.rmtree(p,ignore_errors=True) for p in pathlib.Path('.').rglob('__pycache__')]"
