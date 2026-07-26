import React, { useEffect, useRef, useState } from "react";
import SettingsModal from "./Settings.jsx";

const SETTINGS_KEY = "figma2app.settings";

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}
export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function Pct({ value }) {
  if (value === null || value === undefined) return <span className="pct">n/a</span>;
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? "good" : pct >= 50 ? "mid" : "bad";
  return (
    <span className={`pct ${cls}`}>
      {pct}%
      <span className="bar"><span style={{ width: `${pct}%` }} /></span>
    </span>
  );
}

function MetricsCard({ m }) {
  return (
    <section className="result-card">
      <h2>📊 Pipeline metrics</h2>

      <div className="metric-grid">
        <div className="metric">
          <span className="metric-label">Figma nodes total</span>
          <span className="metric-value">{m.figma.totalNodes.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Nodes passed to agent</span>
          <span className="metric-value">{m.prompt.nodesPassedToAgent.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Components + instances</span>
          <span className="metric-value">{m.figma.components + m.figma.instances}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Prompt size</span>
          <span className="metric-value">{(m.prompt.promptChars / 1000).toFixed(1)}k chars</span>
        </div>
      </div>

      <h3>Screens (Figma frames → generated components)</h3>
      <div className="metric-grid">
        <div className="metric"><span className="metric-label">Recall — Figma screens implemented</span><Pct value={m.screens.recall} /></div>
        <div className="metric"><span className="metric-label">Precision — generated screens that map to Figma</span><Pct value={m.screens.precision} /></div>
        <div className="metric"><span className="metric-label">Matched</span><span className="metric-value">{m.screens.matched} / {m.screens.figmaTotal} figma · {m.screens.generatedTotal} generated</span></div>
      </div>
      {m.screens.missedFigmaScreens.length > 0 && (
        <p className="metric-list bad-text">Missed: {m.screens.missedFigmaScreens.join(", ")}</p>
      )}
      {m.screens.extraGeneratedScreens.length > 0 && (
        <p className="metric-list">Extra (no Figma match): {m.screens.extraGeneratedScreens.join(", ")}</p>
      )}

      {m.curation && (
        <>
          <h3>Curation (ground-truth manifest)</h3>
          <div className="metric-grid">
            <div className="metric"><span className="metric-label">Junk nodes discarded</span><span className="metric-value">{m.curation.discardedNodes}</span></div>
            <div className="metric"><span className="metric-label">Design tokens</span><span className="metric-value">{m.curation.colorTokens} colors / {m.curation.typeStyles} type</span></div>
            <div className="metric"><span className="metric-label">Lists detected</span><span className="metric-value">{m.curation.listsDetected} ({m.curation.nodesCollapsedInLists} nodes collapsed)</span></div>
          </div>
        </>
      )}

      <h3>Component coverage</h3>
      <div className="metric-grid">
        <div className="metric"><span className="metric-label">Component names in output</span><Pct value={m.components.coverage} /></div>
        <div className="metric"><span className="metric-label">Found</span><span className="metric-value">{m.components.foundInOutput} / {m.components.passedToAgent}</span></div>
      </div>
      {m.components.missing.length > 0 && (
        <p className="metric-list">Not found in output: {m.components.missing.join(", ")}</p>
      )}

      {m.visual && (
        <>
          <h3>Visual accuracy (Figma render vs app screenshot)</h3>
          <div className="metric-grid">
            <div className="metric"><span className="metric-label">Avg SSIM similarity</span><Pct value={m.visual.avgSsim} /></div>
          </div>
          {m.visual.perScreen.map((v) => (
            <p className="metric-list" key={v.route}>
              <strong>{v.name}</strong> ({v.route}): {"ssim" in v ? `SSIM ${v.ssim}` : `error: ${v.error}`}
              {v.textGeometry && v.textGeometry.total > 0 && ` - text placement: ${v.textGeometry.found}/${v.textGeometry.total} found, ${v.textGeometry.within5pct} within 5%${v.textGeometry.meanOffsetPct != null ? `, mean offset ${v.textGeometry.meanOffsetPct}%` : ""}`}
            </p>
          ))}
        </>
      )}

      <h3>Timings</h3>
      <p className="metric-list">
        fetch {m.timings.fetch_s}s · extract {m.timings.extract_s}s · generate {m.timings.generate_s}s
        {m.prompt.screensExcluded.length > 0 && <> · <span className="bad-text">excluded over budget: {m.prompt.screensExcluded.join(", ")}</span></>}
      </p>
      <p className="hint">Full details saved to <code>conversion-report.json</code> in the output folder.</p>
    </section>
  );
}

export default function App() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [exportFile, setExportFile] = useState(null);
  const [mode, setMode] = useState("url");
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const configured = settings.figmaToken && settings.githubPat;

  function appendLog(entry) {
    setLog((l) => [...l, entry]);
  }

  async function convert() {
    const needUrl = mode === "url" || mode === "combined";
    const needZip = mode === "zip" || mode === "combined";
    if (needUrl && !figmaUrl.trim()) return;
    if (needZip && !exportFile) return;
    if (!settings.githubPat || (needUrl && !settings.figmaToken)) {
      setShowSettings(true);
      return;
    }
    setRunning(true);
    setLog([]);
    setResult(null);
    setMetrics(null);
    try {
      let res;
      if (mode === "zip") {
        const fd = new FormData();
        fd.append("export", exportFile);
        fd.append("githubPat", settings.githubPat);
        fd.append("model", settings.model || "auto");
        res = await fetch("/api/convert-local", { method: "POST", body: fd });
      } else if (mode === "combined") {
        const fd = new FormData();
        fd.append("export", exportFile);
        fd.append("figmaUrl", figmaUrl);
        fd.append("figmaToken", settings.figmaToken);
        fd.append("githubPat", settings.githubPat);
        fd.append("model", settings.model || "auto");
        res = await fetch("/api/convert-combined", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            figmaUrl,
            figmaToken: settings.figmaToken,
            githubPat: settings.githubPat,
            model: settings.model || "auto"
          })
        });
      }
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `Server error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          const evt = JSON.parse(line);
          if (evt.type === "log") appendLog({ level: evt.level || "info", msg: evt.message });
          if (evt.type === "metrics") setMetrics(evt.metrics);
          if (evt.type === "done") setResult(evt);
          if (evt.type === "error") appendLog({ level: "error", msg: evt.message });
        }
      }
    } catch (e) {
      appendLog({ level: "error", msg: e.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="shell">
      <header>
        <div className="brand">
          <span className="logo">◧</span>
          <div>
            <h1>Figma → App</h1>
            <p>Paste a Figma URL, get a working React app — flow and screens intact.</p>
          </div>
        </div>
        <button className="ghost" onClick={() => setShowSettings(true)} title="Settings">
          ⚙ Settings
        </button>
      </header>

      {!configured && (
        <div className="banner warn">
          Add your Figma token and GitHub PAT in <button className="link" onClick={() => setShowSettings(true)}>Settings</button> before converting.
        </div>
      )}

      <section className="mode-row">
        {[
          { id: "url", label: "Figma URL", hint: "Framelink MCP - exact flow, uses API quota" },
          { id: "zip", label: "ZIP export", hint: "figma-local MCP - zero API calls" },
          { id: "combined", label: "URL + ZIP", hint: "flow from API, visuals from ZIP" }
        ].map((m) => (
          <button key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`}
            onClick={() => setMode(m.id)} disabled={running}>
            <strong>{m.label}</strong>
            <span>{m.hint}</span>
          </button>
        ))}
      </section>

      <section className="input-card">
        <input
          type="url"
          placeholder="https://www.figma.com/design/FILE_KEY/My-Design…"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !running && convert()}
          disabled={running}
        />
        <button className="primary" onClick={convert}
          disabled={running
            || ((mode === "url" || mode === "combined") && !figmaUrl.trim())
            || ((mode === "zip" || mode === "combined") && !exportFile)}>
          {running ? "Converting…" : "Convert"}
        </button>
      </section>

      <section className="upload-row">
        <label className="upload-label">
          Offline mode (no Figma API / no rate limits): upload a "Framelink Exporter" plugin ZIP
          <input
            type="file"
            accept=".zip,.json"
            onChange={(e) => {
              const f = e.target.files[0] || null;
              setExportFile(f);
              if (f) setMode(figmaUrl.trim() ? "combined" : "zip");
            }}
            disabled={running}
          />
        </label>
        {exportFile && (
          <span className="upload-name">
            using <strong>{exportFile.name}</strong>{" "}
            <button className="link" onClick={() => setExportFile(null)}>clear</button>
          </span>
        )}
      </section>

      {(log.length > 0 || running) && (
        <section className="log-card">
          <h2>Pipeline</h2>
          <div className="log">
            {log.map((l, i) => (
              <div key={i} className={`log-line ${l.level}`}>
                <span className="dot" /> {l.msg}
              </div>
            ))}
            {running && <div className="log-line pending"><span className="spinner" /> working…</div>}
            <div ref={logEndRef} />
          </div>
        </section>
      )}

      {metrics && <MetricsCard m={metrics} />}

      {result && (
        <section className="result-card">
          <h2>✅ App generated</h2>
          <p>
            <strong>{result.screens?.length ?? 0} screens</strong> · <strong>{result.flows ?? 0} flow connections</strong> · model <code>{result.model}</code>{result.buildStatus && <> · build <strong>{result.buildStatus}</strong></>}{result.repairRounds > 0 && <> · {result.repairRounds} repair round(s)</>}
          </p>
          {result.screens?.length > 0 && (
            <ul className="screens">
              {result.screens.map((s) => (
                <li key={s.id}>
                  <span className="screen-name">{s.name}</span>
                  {s.goesTo?.length > 0 && <span className="arrow">→ {s.goesTo.join(", ")}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="output-path">
            Output: <code>{result.outputDir}</code>
          </div>
          <p className="hint">cd into the folder, then <code>npm install && npm run dev</code>.</p>
        </section>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

