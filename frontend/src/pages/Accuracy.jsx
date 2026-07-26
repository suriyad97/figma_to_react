import React, { useEffect, useRef, useState } from "react";

function ScaledFrame({ url, route, width, height }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    function fit() {
      if (boxRef.current) setScale(Math.min(1, boxRef.current.clientWidth / width));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [width]);
  const h = Math.min(height, 6000);
  return (
    <div ref={boxRef} className="fixed-view">
      <div style={{ width: "100%", height: h * scale, overflow: "hidden" }}>
        <iframe
          title="preview"
          src={`${url}${route || ""}`}
          style={{ width, height: h, border: "none", background: "#fff",
                   transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
    </div>
  );
}
import { Link, useParams } from "react-router-dom";

function Pct({ value }) {
  if (value === null || value === undefined) return <span className="pct">n/a</span>;
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? "good" : pct >= 50 ? "mid" : "bad";
  return <span className={`pct ${cls}`}>{pct}%<span className="bar"><span style={{ width: `${pct}%` }} /></span></span>;
}

export default function Accuracy() {
  const { slug } = useParams();
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("visual");
  const [screen, setScreen] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState(null);
  const [liveFigma, setLiveFigma] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${slug}/report`).then((r) => r.json()).then((d) => {
      setReport(d);
      if (d.figmaUrl) setFigmaUrl(d.figmaUrl);
      if (d.screens?.length) setScreen(d.screens[0]);
    });
  }, [slug]);

  async function startPreview() {
    setStatus("Starting preview…");
    const res = await fetch(`/api/projects/${slug}/preview`, { method: "POST" });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop();
      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        const evt = JSON.parse(line);
        if (evt.type === "log") setStatus(evt.message);
        if (evt.type === "ready") { setPreviewUrl(evt.url); setStatus(null); }
        if (evt.type === "error") setStatus(`Preview failed: ${evt.message}`);
      }
    }
  }

  useEffect(() => {
    function onMsg(e) {
      if (!e.data || typeof e.data !== "object") return;
      const t = e.data.type;
      if (t !== "PRESENTED_NODE_CHANGED" && t !== "INITIAL_LOAD") return;
      const nodeId = e.data.data?.presentedNodeId || e.data.presentedNodeId;
      if (!nodeId || !report?.screens) return;
      const norm = (x) => String(x).replace(/-/g, ":");
      const match = report.screens.find((sc) => norm(sc.id) === norm(nodeId));
      if (match && match.name !== screen?.name) setScreen(match);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [report, screen]);

  async function saveFigmaUrl() {
    const fd = new FormData();
    fd.append("url", figmaUrl);
    await fetch(`/api/projects/${slug}/figma-url`, { method: "POST", body: fd });
    setLiveFigma(true);
  }

  function embedUrl() {
    if (!figmaUrl) return null;
    let u = figmaUrl;
    if (screen?.id) {
      const nodeParam = encodeURIComponent(screen.id);
      u = u.includes("node-id=")
        ? u.replace(/node-id=[^&]*/, `node-id=${nodeParam}`)
        : u + (u.includes("?") ? "&" : "?") + `node-id=${nodeParam}`;
    }
    // fit the design to the panel width instead of rendering at 100% zoom
    u = u.replace(/[?&]scaling=[^&]*/g, "").replace(/[?&]content-scaling=[^&]*/g, "");
    u += (u.includes("?") ? "&" : "?") + "scaling=scale-down-width&content-scaling=fixed&hide-ui=1";
    const inner = u.replace(/^https?:\/\/(www\.)?figma\.com/, "https://embed.figma.com");
    return inner + (inner.includes("?") ? "&" : "?") + "embed-host=figma-to-react&footer=false";
  }

  if (!report) return <div className="shell"><p>Loading report…</p></div>;
  const m = report.metrics || {};

  return (
    <div className="shell wide">
      <div className="page-head">
        <h1>Accuracy — {report.name}</h1>
        <Link className="ghost btn-sm" to="/projects">← Projects</Link>
      </div>

      <div className="tab-row">
        {["structural", "behavioral", "visual"].map((t) => (
          <button key={t} className={`mode-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            <strong>{t[0].toUpperCase() + t.slice(1)}</strong>
            <span>
              {t === "structural" && `coverage ${m.screens?.recall != null ? Math.round(m.screens.recall * 100) + "%" : "n/a"}`}
              {t === "behavioral" && `flow ${report.behavioral?.score != null ? Math.round(report.behavioral.score * 100) + "%" : "n/a"}`}
              {t === "visual" && `SSIM ${m.visual?.avgSsim ?? "n/a"}`}
            </span>
          </button>
        ))}
      </div>

      {tab === "structural" && (
        <section className="result-card">
          <div className="metric-grid">
            <div className="metric"><span className="metric-label">Screen recall</span><Pct value={m.screens?.recall} /></div>
            <div className="metric"><span className="metric-label">Screen precision</span><Pct value={m.screens?.precision} /></div>
            <div className="metric"><span className="metric-label">Component coverage</span><Pct value={m.components?.coverage} /></div>
            <div className="metric"><span className="metric-label">Junk discarded</span><span className="metric-value">{m.curation?.discardedNodes ?? "n/a"}</span></div>
          </div>
          {m.screens?.missedFigmaScreens?.length > 0 && (
            <p className="metric-list bad-text">Missed screens: {m.screens.missedFigmaScreens.join(", ")}</p>
          )}
          {m.components?.missing?.length > 0 && (
            <p className="metric-list">Components not found in output: {m.components.missing.join(", ")}</p>
          )}
        </section>
      )}

      {tab === "behavioral" && (
        <section className="result-card">
          <p><strong>{report.behavioral.implemented}/{report.behavioral.total}</strong> prototype flow edges implemented in code</p>
          <ul className="screens">
            {report.behavioral.edges.map((e, i) => (
              <li key={i}>
                <span className={e.implemented ? "flow-ok" : "flow-bad"}>{e.implemented ? "✓" : "✗"}</span>
                <span className="screen-name">{e.from}</span>
                <span className="arrow">→ {e.to} ({e.route})</span>
                {e.sourceFile && <code>{e.sourceFile}</code>}
              </li>
            ))}
            {report.behavioral.edges.length === 0 && <li>No flow edges in this design's data (ZIP exports lack interactions — use URL/combined mode).</li>}
          </ul>
        </section>
      )}

      {tab === "visual" && (
        <>
          <div className="compare-toolbar">
            <select value={screen?.name || ""} onChange={(e) => setScreen(report.screens.find((s) => s.name === e.target.value))}>
              {report.screens.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            {!previewUrl && <button className="primary btn-sm" onClick={startPreview}>Load generated app →</button>}
            {status && <span className="hint">{status}</span>}
            {screen?.visual && (
              <span className="hint">
                SSIM <strong>{screen.visual.ssim ?? "n/a"}</strong>
                {screen.visual.textGeometry && <> · text {screen.visual.textGeometry.found}/{screen.visual.textGeometry.total} found, {screen.visual.textGeometry.within5pct} within 5%</>}
              </span>
            )}
          </div>
          <div className="compare-cols">
            <div className="compare-col">
              <h3>
                Figma design
                <label style={{ float: "right", fontSize: 12, fontWeight: 400 }}>
                  <input type="checkbox" checked={liveFigma} onChange={(e) => setLiveFigma(e.target.checked)}
                         disabled={!figmaUrl} style={{ marginRight: 5 }} />
                  live prototype
                </label>
              </h3>
              {!figmaUrl && (
                <div className="figma-url-row">
                  <input placeholder="Paste the Figma prototype URL to enable live mode…"
                         value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} />
                  <button className="ghost btn-sm" onClick={saveFigmaUrl} disabled={!figmaUrl.trim()}>Save</button>
                </div>
              )}
              {liveFigma && figmaUrl
                ? <div className="fixed-view"><iframe title="figma" src={embedUrl()} allowFullScreen
                        style={{ width: "100%", height: "100%", border: "none" }} /></div>
                : screen?.renderUrl
                  ? <div className="fixed-view"><img src={screen.renderUrl} alt={screen.name} /></div>
                  : <p className="hint">No render available for this screen.</p>}
            </div>
            <div className="compare-col">
              <h3>Generated app {screen?.route && <code>{screen.route}</code>}</h3>
              {previewUrl
                ? <ScaledFrame url={previewUrl} route={screen?.route} width={screen?.width || 1440} height={screen?.height || 900} />
                : <p className="hint">Click "Load generated app" to start the preview server.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
