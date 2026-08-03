"""Observability — all Opik wiring lives here.

The pipeline talks only to this module, never to the vendor SDK, so swapping
Opik for Phoenix/Langfuse is a one-file change. Everything degrades to a no-op
when tracing is disabled or the SDK is missing: the pipeline must never fail
because telemetry failed.

Enable with:
    OPIK_ENABLED=true
    OPIK_API_KEY=...        (cloud) or OPIK_URL_OVERRIDE=http://localhost:5173/api (self-hosted)
    OPIK_WORKSPACE=...
"""
import hashlib
import os
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Optional

from figma_to_react.config import AGENT_FILE

PROJECT_NAME = os.getenv("OPIK_PROJECT_NAME", "figma-to-react")


def enabled() -> bool:
    return os.getenv("OPIK_ENABLED", "").lower() in ("1", "true", "yes")


def agent_version() -> dict:
    """Hash the agent definition + prompt template so every run is attributable."""
    out = {}
    for label, path in (("agent", AGENT_FILE),
                        ("promptTemplate", Path(".github/prompts/figma-context.prompt.md"))):
        try:
            raw = path.read_bytes()
            out[f"{label}Sha"] = hashlib.sha256(raw).hexdigest()[:12]
            out[f"{label}Chars"] = len(raw)
        except OSError:
            out[f"{label}Sha"] = None
    return out


class _NullSpan:
    """No-op span so call sites never branch on whether tracing is on."""

    def set(self, **_kwargs) -> None: ...
    def end(self, **_kwargs) -> None: ...


class RunTracer:
    """One tracer per conversion run. Wraps an Opik trace + its spans."""

    def __init__(self, name: str, metadata: dict):
        self._trace = None
        self._client = None
        self._started = time.time()
        self.tool_calls: dict[str, int] = {}
        self.model_turns = 0

        if not enabled():
            return
        try:
            from opik import Opik

            self._client = Opik(project_name=PROJECT_NAME)
            self._trace = self._client.trace(
                name=name,
                input={k: v for k, v in metadata.items() if k != "secrets"},
                metadata={**metadata, **agent_version()},
                tags=[metadata.get("source", "unknown"), metadata.get("model", "auto")],
            )
        except Exception:
            self._trace = None  # telemetry must never break the pipeline

    # -- spans ---------------------------------------------------------------

    @contextmanager
    def stage(self, name: str, span_type: str = "general", **inputs):
        """Time one pipeline stage. Usage: `with tracer.stage("curate", nodes=389) as s: ...`"""
        span = self._span(name, span_type, inputs)
        t0 = time.time()
        try:
            yield span
        except Exception as e:
            span.end(output={"error": str(e)[:500]}, metadata={"failed": True})
            raise
        else:
            span.end(metadata={"durationSeconds": round(time.time() - t0, 2)})

    def stage_event(self, name: str, data: dict) -> None:
        """Record a completed pipeline stage as a single span (generator-safe)."""
        if self._trace is None:
            return
        try:
            span = self._trace.span(name=name, type="general", input=data or None)
            span.end(output=data or None)
        except Exception:
            pass

    def _span(self, name: str, span_type: str, inputs: dict):
        if self._trace is None:
            return _NullSpan()
        try:
            return self._trace.span(name=name, type=span_type, input=inputs or None)
        except Exception:
            return _NullSpan()

    # -- model + tool events -------------------------------------------------

    def model_turn(self, name: str, prompt: str, response: str, model: str,
                   attachments: int = 0, duration: Optional[float] = None) -> None:
        """Record one agent turn as an llm span."""
        self.model_turns += 1
        if self._trace is None:
            return
        try:
            span = self._trace.span(
                name=name, type="llm",
                input={"prompt": prompt[:8000], "attachments": attachments},
                metadata={"model": model, "promptChars": len(prompt),
                          "durationSeconds": round(duration, 2) if duration else None},
            )
            span.end(output={"response": (response or "")[:8000],
                             "responseChars": len(response or "")})
        except Exception:
            pass

    def tool_call(self, tool: str, detail: Any = None) -> None:
        """Record an MCP/agent tool invocation — answers 'which tools did it actually use?'"""
        self.tool_calls[tool] = self.tool_calls.get(tool, 0) + 1
        if self._trace is None:
            return
        try:
            span = self._trace.span(name=tool, type="tool",
                                    input={"detail": str(detail)[:2000]} if detail else None)
            span.end()
        except Exception:
            pass

    def tool_usage(self, available: list[str]) -> dict:
        """Compare tools offered vs tools used."""
        used = sorted(self.tool_calls)
        return {"available": available, "used": used,
                "unused": [t for t in available if t not in used],
                "callCounts": dict(self.tool_calls)}

    # -- close ---------------------------------------------------------------

    def finish(self, metrics: dict, output_dir: str) -> None:
        """Attach the run's closing-condition metrics as feedback scores + end the trace."""
        if self._trace is None:
            return
        try:
            screens = metrics.get("screens", {})
            enforcement = metrics.get("enforcement", {})
            visual = metrics.get("visual") or {}
            scores = []
            if screens.get("recall") is not None:
                scores.append({"name": "screen_coverage", "value": float(screens["recall"])})
            if visual.get("avgSsim") is not None:
                scores.append({"name": "visual_ssim", "value": float(visual["avgSsim"])})
            scores.append({"name": "build_passed",
                           "value": 1.0 if enforcement.get("buildStatus") == "passed" else 0.0})

            self._trace.end(
                output={"outputDir": output_dir,
                        "screens": screens.get("figmaTotal"),
                        "buildStatus": enforcement.get("buildStatus")},
                metadata={"metrics": metrics,
                          "modelTurns": self.model_turns,
                          "toolCalls": dict(self.tool_calls),
                          "wallSeconds": round(time.time() - self._started, 1)},
                feedback_scores=scores,
            )
            if self._client:
                self._client.flush()
        except Exception:
            pass

    def fail(self, error: str) -> None:
        if self._trace is None:
            return
        try:
            self._trace.end(output={"error": error[:1000]}, metadata={"failed": True})
            if self._client:
                self._client.flush()
        except Exception:
            pass
