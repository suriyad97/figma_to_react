"""Figma tree parsing, curation (ground-truth manifest), tokens, summaries."""
import json
import re
from typing import Optional

from figma_to_react.config import PROMPT_TREE_BUDGET

DISCARD_PAGE_RE = re.compile(r"archive|old|scratch|wip|backup|unused|deprecated|draft", re.I)

SEMANTIC_ROLES = [
    ("button", "button"), ("btn", "button"), ("cta", "button"),
    ("input", "input"), ("field", "input"), ("textbox", "input"), ("search", "search"),
    ("checkbox", "checkbox"), ("radio", "radio"), ("dropdown", "select"), ("select", "select"),
    ("toggle", "switch"), ("switch", "switch"), ("nav", "nav"), ("menu", "nav"),
    ("tab", "tab"), ("card", "card"), ("badge", "badge"), ("chip", "badge"),
    ("icon", "icon"), ("avatar", "avatar"), ("modal", "dialog"), ("dialog", "dialog"), ("link", "link"),
]


def parse_figma_key(url: str) -> Optional[str]:
    m = re.search(r"figma\.com/(?:file|design|proto|make|board|slides|site)/([A-Za-z0-9]+)", url or "")
    return m.group(1) if m else None


def route_for(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"/{slug}" if slug else "/"


def safe_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "screen"


def extract_screens_and_flow(doc: dict):
    screens, name_by_id, edges = [], {}, []
    for page in doc.get("children", []):
        for node in page.get("children", []):
            if node.get("type") in ("FRAME", "COMPONENT"):
                screens.append({"id": node["id"], "name": node["name"], "page": page["name"], "node": node})
                name_by_id[node["id"]] = node["name"]

    def walk(node, owner):
        if node.get("transitionNodeID"):
            edges.append({"from": owner, "to": node["transitionNodeID"]})
        for i in node.get("interactions", []):
            for a in i.get("actions", []):
                if a.get("destinationId"):
                    edges.append({"from": owner, "to": a["destinationId"]})
        for rx in node.get("reactions", []):
            act = rx.get("action") or {}
            if act.get("destinationId"):
                edges.append({"from": owner, "to": act["destinationId"]})
        for c in node.get("children", []):
            walk(c, owner)

    for s in screens:
        walk(s["node"], s["id"])

    seen, flow = set(), []
    for e in edges:
        k = f"{e['from']}->{e['to']}"
        if k in seen or e["to"] not in name_by_id or e["from"] == e["to"]:
            continue
        seen.add(k)
        flow.append(e)

    out = [
        {"id": s["id"], "name": s["name"], "page": s["page"],
         "route": route_for(s["name"]),
         "goesTo": [name_by_id[f["to"]] for f in flow if f["from"] == s["id"]],
         "node": s["node"]}
        for s in screens
    ]
    return out, flow


def semantic_role(name):
    n = (name or "").lower()
    for k, r in SEMANTIC_ROLES:
        if k in n:
            return r
    return None


def struct_sig(node, depth=2):
    if depth == 0 or not node.get("children"):
        return node.get("type", "")
    return node.get("type", "") + "(" + ",".join(struct_sig(c, depth - 1) for c in node.get("children", [])[:6]) + ")"


def curate_node(node, discards):
    if node.get("visible") is False:
        discards.append({"reason": "hidden layer", "type": node.get("type"), "name": node.get("name")})
        return None
    if node.get("opacity") == 0:
        discards.append({"reason": "zero opacity", "type": node.get("type"), "name": node.get("name")})
        return None
    node = dict(node)
    if "children" in node:
        kids = []
        for c in node["children"]:
            cc = curate_node(c, discards)
            if cc is not None:
                kids.append(cc)
        node["children"] = kids
        if node.get("type") == "GROUP":
            if len(kids) == 1:
                discards.append({"reason": "wrapper group collapsed", "type": "GROUP", "name": node.get("name")})
                return kids[0]
            if not kids and not node.get("fills"):
                discards.append({"reason": "empty group", "type": "GROUP", "name": node.get("name")})
                return None
    return node


def curate_document(doc):
    discards = []
    pages = []
    for page in doc.get("children", []):
        if DISCARD_PAGE_RE.search(page.get("name", "")):
            discards.append({"reason": "scratch page skipped", "type": "CANVAS", "name": page.get("name")})
            continue
        p = curate_node(page, discards)
        if p is not None:
            pages.append(p)
    return {"type": "DOCUMENT", "children": pages}, discards


def extract_tokens(doc):
    from collections import Counter
    colors, fonts = Counter(), Counter()

    def walk(n):
        for f in n.get("fills", []):
            if f.get("type") == "SOLID" and f.get("visible", True) and f.get("color"):
                c = f["color"]
                colors[f"#{round(c['r']*255):02x}{round(c['g']*255):02x}{round(c['b']*255):02x}"] += 1
        if st := n.get("style"):
            if st.get("fontFamily"):
                fonts[(st["fontFamily"], st.get("fontSize"), st.get("fontWeight"))] += 1
        for c in n.get("children", []):
            walk(c)

    walk(doc)
    return {
        "colors": [{"var": f"--color-{i+1}", "value": c, "uses": n}
                   for i, (c, n) in enumerate(colors.most_common(12))],
        "typography": [{"family": f, "size": s, "weight": w, "uses": n}
                       for (f, s, w), n in fonts.most_common(8)],
    }


def tree_stats(node: dict, stats=None) -> dict:
    if stats is None:
        stats = {"nodes": 0, "components": 0, "instances": 0, "texts": 0, "component_names": set()}
    stats["nodes"] += 1
    t = node.get("type")
    if t == "COMPONENT":
        stats["components"] += 1
        stats["component_names"].add(node.get("name", ""))
    elif t == "INSTANCE":
        stats["instances"] += 1
        stats["component_names"].add(node.get("name", ""))
    elif t == "TEXT":
        stats["texts"] += 1
    for c in node.get("children", []):
        tree_stats(c, stats)
    return stats


def summarize_node(node: dict, counter: dict, depth: int = 0) -> Optional[dict]:
    if depth > 6:
        counter["dropped_depth"] += 1
        return None
    counter["included"] += 1
    out = {"type": node.get("type"), "name": node.get("name")}
    if node.get("type") in ("INSTANCE", "COMPONENT", "FRAME", "GROUP"):
        role = semantic_role(node.get("name"))
        if role:
            out["role"] = role
    if b := node.get("absoluteBoundingBox"):
        out["box"] = {"x": round(b["x"]), "y": round(b["y"]), "w": round(b["width"]), "h": round(b["height"])}
    if node.get("characters"):
        out["text"] = node["characters"][:200]
    if st := node.get("style"):
        out["font"] = {"family": st.get("fontFamily"), "size": st.get("fontSize"), "weight": st.get("fontWeight")}
    for f in node.get("fills", []):
        if f.get("type") == "SOLID" and f.get("visible", True) and f.get("color"):
            c = f["color"]
            out["fill"] = f"rgb({round(c['r']*255)},{round(c['g']*255)},{round(c['b']*255)})"
            break
        if f.get("type") == "IMAGE" and f.get("visible", True) and f.get("imageRef"):
            out["imageAsset"] = f"/assets/image_{f['imageRef']}.png"
            break
    if node.get("cornerRadius"):
        out["radius"] = node["cornerRadius"]
    if node.get("layoutMode"):
        out["layout"] = {"mode": node["layoutMode"], "gap": node.get("itemSpacing"),
                         "padding": [node.get("paddingTop"), node.get("paddingRight"),
                                     node.get("paddingBottom"), node.get("paddingLeft")]}
    if node.get("transitionNodeID"):
        out["navigatesTo"] = node["transitionNodeID"]

    kids_nodes = node.get("children", [])
    kids = []
    i = 0
    while i < len(kids_nodes):
        sig = struct_sig(kids_nodes[i])
        j = i + 1
        while j < len(kids_nodes) and struct_sig(kids_nodes[j]) == sig and sig.count("(") > 0:
            j += 1
        run = j - i
        s = summarize_node(kids_nodes[i], counter, depth + 1)
        if s is not None:
            if run >= 3:
                s["repeats"] = run
                counter["lists"] = counter.get("lists", 0) + 1
                counter["collapsed_repeats"] = counter.get("collapsed_repeats", 0) + (run - 1)
            kids.append(s)
        i = j if run >= 3 else i + 1
    if kids:
        out["children"] = kids
    return out


def collect_texts(node: dict, frame_box: dict, out: list, limit=15):
    if len(out) >= limit:
        return
    if node.get("type") == "TEXT" and node.get("characters") and node.get("absoluteBoundingBox"):
        t = node["characters"].strip()
        if 3 <= len(t) <= 80 and "\n" not in t:
            b = node["absoluteBoundingBox"]
            out.append({"text": t,
                        "cx": b["x"] + b["width"] / 2 - frame_box["x"],
                        "cy": b["y"] + b["height"] / 2 - frame_box["y"]})
    for c in node.get("children", []):
        collect_texts(c, frame_box, out, limit)


def build_screen_payloads(screens, budget=PROMPT_TREE_BUDGET):
    included, excluded, used = [], [], 0
    for s in screens:
        counter = {"included": 0, "dropped_depth": 0}
        summary = summarize_node(s["node"], counter)
        blob = json.dumps(summary)
        if used + len(blob) <= budget:
            used += len(blob)
            included.append({"screen": s, "summary": summary, "nodes_included": counter["included"],
                             "nodes_dropped_depth": counter["dropped_depth"], "chars": len(blob),
                             "lists": counter.get("lists", 0), "collapsed": counter.get("collapsed_repeats", 0)})
        else:
            excluded.append(s["name"])
    return included, excluded, used


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def collect_image_fills(node, screen_name, out):
    """Collect (screen, node name, asset path) for every image fill in a subtree."""
    for f in node.get("fills", []):
        if f.get("type") == "IMAGE" and f.get("visible", True) and f.get("imageRef"):
            out.append({"screen": screen_name, "node": node.get("name", "?"),
                        "asset": f"/assets/image_{f['imageRef']}.png"})
            break
    for c in node.get("children", []):
        collect_image_fills(c, screen_name, out)
