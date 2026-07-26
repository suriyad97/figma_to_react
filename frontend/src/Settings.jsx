import React, { useEffect, useRef, useState } from "react";

const FALLBACK_MODELS = [{ id: "auto", name: "Auto (Copilot picks)" }];

export default function SettingsModal({ settings, onSave, onClose }) {
  const [figmaToken, setFigmaToken] = useState(settings.figmaToken || "");
  const [githubPat, setGithubPat] = useState(settings.githubPat || "");
  const [model, setModel] = useState(settings.model || "auto");
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const debounceRef = useRef(null);

  function fetchModels(pat) {
    if (!pat) return;
    setLoadingModels(true);
    setModelError(null);
    fetch("/api/models", { headers: { "x-github-pat": pat } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (data.auth) setAuthInfo(data.auth);
        if (data.warning) setModelError(data.warning);
        if (data.error) {
          setModelError(`Couldn't fetch models for this token: ${data.error}`);
          setModels(FALLBACK_MODELS);
          return;
        }
        const list = (data.models || []).map((m) => {
          const bits = [];
          if (m.multiplier != null) bits.push(m.multiplier === 0 ? "free" : `${m.multiplier}x quota`);
          if (m.vision) bits.push("vision");
          return { id: m.id, name: (m.name || m.id) + (bits.length ? ` — ${bits.join(", ")}` : "") };
        });
        if (list.length) {
          setModels(list);
          setModelError(null);
          if (!list.some((m) => m.id === model)) setModel(list[0].id);
        } else {
          setModelError("Token returned no models.");
          setModels(FALLBACK_MODELS);
        }
      })
      .catch((e) => {
        setModelError(`Couldn't fetch models: ${e.message}`);
        setModels(FALLBACK_MODELS);
      })
      .finally(() => setLoadingModels(false));
  }

  // debounce: fetch 800ms after the user stops typing the PAT
  useEffect(() => {
    if (!githubPat) {
      setModels(FALLBACK_MODELS);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchModels(githubPat), 800);
    return () => clearTimeout(debounceRef.current);
  }, [githubPat]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <label>
          Figma personal access token
          <input
            type="password"
            placeholder="figd_…"
            value={figmaToken}
            onChange={(e) => setFigmaToken(e.target.value)}
          />
          <span className="field-hint">Figma → Settings → Security → Personal access tokens</span>
        </label>

        <label>
          GitHub PAT (Copilot access)
          <input
            type="password"
            placeholder="github_pat_… (fine-grained, Copilot Requests permission)"
            value={githubPat}
            onChange={(e) => setGithubPat(e.target.value)}
          />
          <span className="field-hint">Fine-grained PAT with "Copilot Requests" permission — classic ghp_ tokens don't work</span>
        </label>

        <label>
          Model {loadingModels && <em>(fetching models for this token…)</em>}
          <span style={{ display: "flex", gap: 8 }}>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ flex: 1 }} disabled={loadingModels}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ghost"
              onClick={() => fetchModels(githubPat)}
              disabled={!githubPat || loadingModels}
              title="Refresh model list"
            >
              ↻
            </button>
          </span>
          {authInfo && <span className="field-hint">Auth: {authInfo.statusMessage || (authInfo.isAuthenticated ? authInfo.login : "not authenticated")} ({authInfo.authType || "none"})</span>}
          {modelError && <span className="field-hint bad-text">{modelError}</span>}
          {!modelError && models.length > 1 && (
            <span className="field-hint">{models.length} models available on this token</span>
          )}
        </label>

        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={() => onSave({ figmaToken, githubPat, model })}
            disabled={!figmaToken || !githubPat}
          >
            Save
          </button>
        </div>
        <p className="privacy-note">Tokens are stored only in your browser's localStorage and sent to your local server per request.</p>
      </div>
    </div>
  );
}

