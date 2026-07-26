"""Prompt construction: base requirements, per-mode builders, and the .github template."""
import json

from .config import TEMPLATE_FILE

FILE_FORMAT = """Output EVERY file as a fenced block in this exact format (no other prose):
```file:src/screens/Example.jsx
...
```"""

BASE_REQUIREMENTS = """REQUIREMENTS:
- React 18 + Vite, react-router-dom for navigation.
- EVERY screen listed above MUST get its own component file under src/screens/, named after its Figma frame name in PascalCase. No exceptions.
- Each screen's route path MUST be exactly the "route" given for it above; additionally the first screen must also render at "/".
- Wire navigation exactly per the "goesTo" flow.
- Faithful to the design system but responsive — flex/grid, not absolute positioning.
- Render every text layer's exact text content from the design.
- Plain CSS in one styles.css using CSS variables.
- Define the DESIGN TOKENS below as CSS variables in styles.css and use them throughout.
- Nodes tagged "role" MUST render as the matching semantic HTML element (button -> <button>, input -> <input>, nav -> <nav>, select -> <select>, etc.), never a generic <div>.
- Nodes with "repeats": N are detected list items: implement ONE component and map it over an array of N data entries.
- Nodes with "imageAsset" MUST render that exact file (as <img src> or CSS background-image). Every entry in the IMAGE FILL MAP must appear in the code."""

GROUNDING_NOTE = """
Rendered PNG images of the design screens are ATTACHED to this message.
Study them carefully — your generated screens must visually match these images:
same colors, same spacing rhythm, same typography hierarchy, same element proportions."""


def build_prompt_mcp(screens, file_key, grounded, tokens):
    flow_json = json.dumps([{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in screens], indent=2)
    return f"""You are converting a Figma design into a working React (Vite) app.

You have Figma MCP tools available (Framelink). The Figma file key is: {file_key}
{GROUNDING_NOTE if grounded else ""}
SCREENS AND NAVIGATION FLOW (from Figma prototype links — keep this flow intact):
{flow_json}

DESIGN TOKENS (deduplicated from the design - use as CSS variables):
{json.dumps(tokens, indent=2)}

PROCESS:
1. Call get_figma_data with fileKey="{file_key}" (and nodeId per screen id above when the file is large) to retrieve full layout, styling, and text data for every screen.
2. Then generate the app.

{BASE_REQUIREMENTS}
- {FILE_FORMAT}
Include: package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, src/styles.css, and one file per screen under src/screens/."""


def build_prompt_inline(screens, included, grounded, tokens):
    flow_json = json.dumps([{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in screens], indent=2)
    tree_json = json.dumps([p["summary"] for p in included], indent=2)
    return f"""You are converting a Figma design into a working React (Vite) app.
{GROUNDING_NOTE if grounded else ""}
SCREENS AND NAVIGATION FLOW (from Figma prototype links — keep this flow intact):
{flow_json}

DESIGN TOKENS (deduplicated from the design - use as CSS variables):
{json.dumps(tokens, indent=2)}

DESIGN TREE (simplified Figma nodes with layout, text, colors, fonts; "role" = semantic element, "repeats" = list):
{tree_json}

{BASE_REQUIREMENTS}
- {FILE_FORMAT}
Include: package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, src/styles.css, and one file per screen under src/screens/."""


def build_repair_prompt(missed_payloads, all_screens):
    flow_json = json.dumps([{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in all_screens], indent=2)
    tree_json = json.dumps([p["summary"] for p in missed_payloads], indent=2)
    names = ", ".join(p["screen"]["name"] for p in missed_payloads)
    return f"""You did NOT generate components for these Figma screens: {names}

Their design trees:
{tree_json}

Full navigation flow for reference:
{flow_json}

Generate the missing screen components now (src/screens/<PascalCaseFrameName>.jsx for EACH missed screen),
and output an UPDATED src/App.jsx that includes routes for ALL screens (existing + new) at their given route paths.
{FILE_FORMAT}"""


def build_fix_prompt(build_output):
    return f"""The generated app fails to build. Fix the errors and re-output ONLY the corrected files.

Build output:
{build_output}

{FILE_FORMAT}"""


def build_visual_fix_prompt(low_screens_info):
    parts = []
    for info in low_screens_info:
        parts.append(f"""SCREEN "{info['name']}" (route {info['route']}) — measured problems: {info['problems']}
Exact design geometry (positions/sizes in px, colors, fonts — treat as ground truth):
{json.dumps(info['summary'])[:20000]}""")
    body = "\n\n".join(parts)
    return f"""Your generated screens visually deviate from the design. The design render images are ATTACHED — compare them against your implementation and fix the CSS/JSX.

{body}

Fix ONLY these screens (and styles.css if needed). Match spacing, sizes, colors, and typography to the exact values above.
{FILE_FORMAT}"""


def load_context_template():
    try:
        return TEMPLATE_FILE.read_text(encoding="utf-8")
    except Exception:
        return None


def fill_template(template, screens, tokens, tree_section, grounded):
    flow_json = json.dumps([{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in screens], indent=2)
    grounding = ("Rendered PNG images of each design screen are ATTACHED to this message. "
                 "They are ground truth - match them.") if grounded else ""
    return (template
            .replace("{{GROUNDING}}", grounding)
            .replace("{{SCREENS_FLOW}}", flow_json)
            .replace("{{DESIGN_TOKENS}}", json.dumps(tokens, indent=2))
            .replace("{{DESIGN_TREE}}", tree_section))


# ---------- figma parsing ----------


def build_prompt_local_mcp(screens, json_path, grounded, tokens):
    flow_json = json.dumps([{k: s[k] for k in ("id", "name", "route", "goesTo")} for s in screens], indent=2)
    return f"""You are converting a Figma design into a working React (Vite) app.

You have figma-local MCP tools. The exported design JSON is at: {json_path}
{GROUNDING_NOTE if grounded else ""}
SCREENS AND NAVIGATION FLOW (keep this flow intact):
{flow_json}

DESIGN TOKENS (deduplicated from the design - use as CSS variables):
{json.dumps(tokens, indent=2)}

PROCESS:
1. Call get_figma_data_from_json with filePath="{json_path}" to get the simplified design tree
   (includes per-node semanticRole, renderHint, imagePath/svgPath).
2. Call get_node_image with the same filePath and each screen's nodeId to VIEW each screen.
3. Call get_node_svg for every node carrying svgPath and inline the returned SVG verbatim.
4. Then generate the app.

{BASE_REQUIREMENTS}
- {FILE_FORMAT}
Include: package.json, vite.config.js, index.html, src/main.jsx, src/App.jsx, src/styles.css, and one file per screen under src/screens/."""
