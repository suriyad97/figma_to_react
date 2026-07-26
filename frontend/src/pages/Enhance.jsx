import React, { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadSettings } from "../App.jsx";

export default function Enhance() {
  const { slug } = useParams();
  const [messages, setMessages] = useState([
    { role: "system", text: `Enhancing project: ${slug}. Describe a change — e.g. "make the navbar sticky", "change the primary color to green", "add a footer with social links".` }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  function push(msg) {
    setMessages((m) => [...m, msg]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const settings = loadSettings();
    if (!settings.githubPat) {
      push({ role: "system", text: "Set your GitHub PAT in Settings on the Convert page first." });
      return;
    }
    setInput("");
    push({ role: "user", text });
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("message", text);
      fd.append("githubPat", settings.githubPat);
      fd.append("model", settings.model || "auto");
      const res = await fetch(`/api/projects/${slug}/enhance`, { method: "POST", body: fd });
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
          if (evt.type === "log") push({ role: "status", text: evt.message });
          if (evt.type === "changes") push({ role: "status", text: evt.files.length ? `Edited: ${evt.files.join(", ")}` : "No files changed." });
          if (evt.type === "build") push({ role: "status", text: evt.ok ? "✓ Build passed" : `✗ Build failed: ${evt.output}` });
          if (evt.type === "reply") push({ role: "assistant", text: evt.message });
          if (evt.type === "error") push({ role: "system", text: `Error: ${evt.message}` });
        }
      }
    } catch (e) {
      push({ role: "system", text: `Error: ${e.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <div className="page-head">
        <h1>Enhance — {slug}</h1>
        <Link className="ghost btn-sm" to="/projects">← Projects</Link>
      </div>
      <section className="chat-card">
        <div className="chat-log">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
          ))}
          {busy && <div className="chat-msg status"><span className="spinner" /> working…</div>}
          <div ref={endRef} />
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Describe the change you want…"
            disabled={busy}
          />
          <button className="primary" onClick={send} disabled={busy || !input.trim()}>Send</button>
        </div>
      </section>
    </div>
  );
}
