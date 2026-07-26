import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [previewLog, setPreviewLog] = useState(null);

  function load() {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }
  useEffect(load, []);

  async function preview(slug) {
    setPreviewLog(`Starting preview for ${slug}…`);
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
        if (evt.type === "log") setPreviewLog(evt.message);
        if (evt.type === "ready") {
          setPreviewLog(null);
          window.open(evt.url, "_blank");
        }
        if (evt.type === "error") setPreviewLog(`Preview failed: ${evt.message}`);
      }
    }
  }

  async function remove(slug) {
    if (!confirm(`Delete ${slug}?`)) return;
    await fetch(`/api/projects/${slug}`, { method: "DELETE" });
    load();
  }

  if (projects === null) return <div className="shell"><p>Loading…</p></div>;

  return (
    <div className="shell">
      <h1>Projects</h1>
      {previewLog && <div className="banner warn">{previewLog}</div>}
      {projects.length === 0 && <p className="hint">No conversions yet — run one from the Convert page.</p>}
      <div className="project-grid">
        {projects.map((p) => (
          <div className="project-card" key={p.slug}>
            <h3>{p.name} {/\d+$/.test(p.slug.split("-v").pop()) && p.slug.includes("-v") ? <span className="ver-badge">v{p.slug.split("-v").pop()}</span> : <span className="ver-badge">v1</span>}</h3>
            <p className="hint" style={{ fontSize: 11, opacity: 0.7 }}>{p.slug}</p>
            <p className="hint">
              {p.screens ?? "?"} screens
              {p.buildStatus && <> · build <strong>{p.buildStatus}</strong></>}
              {p.coverage != null && <> · coverage <strong>{Math.round(p.coverage * 100)}%</strong></>}
              {p.avgSsim != null && <> · SSIM <strong>{p.avgSsim}</strong></>}
            </p>
            {p.health && !p.health.ok && (
              <p className="metric-list bad-text" title={p.health.missing.join("\n")}>
                ⚠ Broken: {p.health.missing.length} missing file{p.health.missing.length > 1 ? "s" : ""} — {p.health.missing[0]}
              </p>
            )}
            <div className="project-actions">
              <Link className="ghost btn-sm" to={`/accuracy/${p.slug}`}>Accuracy</Link>
              <button className="ghost btn-sm" onClick={() => preview(p.slug)} disabled={!p.hasApp || (p.health && !p.health.ok)}>Preview</button>
              <Link className="ghost btn-sm" to={`/enhance/${p.slug}`}>Enhance</Link>
              <a className="ghost btn-sm" href={`/api/projects/${p.slug}/download`}>Download</a>
              <button className="ghost btn-sm danger" onClick={() => remove(p.slug)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
