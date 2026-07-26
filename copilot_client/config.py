"""Central configuration for the figma-to-react pipeline."""
from pathlib import Path

OUT_ROOT = Path("generated").resolve()
CACHE_TTL = 300  # seconds, Figma file/render cache
PROMPT_TREE_BUDGET = 60000  # chars of design tree per first-pass prompt
MAX_REPAIR_ROUNDS = 3
MAX_BUILD_FIX_ROUNDS = 2
SSIM_REPAIR_THRESHOLD = 0.85
TEXT_REPAIR_THRESHOLD = 0.6
MAX_VISUAL_REPAIR_SCREENS = 5
PREVIEW_PORT = 4173

FALLBACK_MODELS = [{"id": "auto", "name": "Auto (Copilot picks)"}]

AGENT_FILE = Path(".github/agents/figma-to-react.md")
TEMPLATE_FILE = Path(".github/prompts/figma-context.prompt.md")

EXCLUDE_SCAN_DIRS = {"node_modules", "dist", ".figma-renders", ".git"}
EXCLUDE_SCAN_FILES = {"manifest.json", "conversion-report.json", "raw-response.md", "package-lock.json"}
