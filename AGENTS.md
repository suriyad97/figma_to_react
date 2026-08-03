# Copilot instructions — figma-to-react

Applies to every Copilot request in this workspace.

## 1. Before writing code

Do not assume. If the request is ambiguous, ask one question instead of guessing.
If a simpler approach exists than the one requested, say so in one line, then do
what was asked. If you are confused, name what is unclear — do not invent a
plausible answer.

## 2. Write the least code that works

Walk this ladder and stop at the first rung that holds:

1. Does this need to exist at all? → if no, skip it
2. Does the stdlib do it? → use it
3. Does the platform/browser/framework already do it? → use it
4. Does an installed dependency do it? → use it
5. Can it be one line? → one line
6. Only then: the minimum that works

Never on the chopping block: input validation at trust boundaries, data-loss
handling, security, accessibility.

Banned unless explicitly requested: new dependencies, abstractions for
single-use code, configuration/flexibility nobody asked for, error handling for
impossible states, "future-proofing", `utils.py`.

If 200 lines could be 50, write 50.

## 3. Surgical changes only

- Every changed line must trace to the request. No drive-by refactors, no
  reformatting, no "while I was here" fixes, no comment rewrites.
- Match the existing style even where you would do it differently.
- Remove imports/variables your own change orphaned. Leave pre-existing dead
  code alone — mention it instead.
- Spotted an unrelated bug? Say one sentence about it. Do not fix it.

## 4. Verifiable goals

Prefer a checkable success criterion over an imperative. When the task allows it:
write or name the check first, then make it pass. State a two-or-three step plan
with a verification per step for anything non-trivial — then execute without
narrating each step.

## 5. Response format

- Code and diffs only. No summary of what you just wrote, no restating my code
  back to me, no "here's what I changed" recap, no bullet-point explanation
  unless I ask why.
- One sentence maximum of prose before a code block.
- No emoji, no headers in chat replies.
- If nothing needs changing, say so in one line.

## 6. This repo specifically

- **Layout:** `src/figma_to_react/{core,agent,sources,qa,api}`. Deterministic
  logic (`core/`, `qa/`) is unit-tested; model-touching code (`agent/`) is
  verified at runtime by the pipeline's own enforcement stages. Keep that
  boundary — do not put model calls in `core/`.
- **Prompts and agent behaviour live in `.github/`**, never inlined in Python.
- **Artifacts** (`generated/`, `designs/`, `data/`) are never imported from
  `src/`.
- **Config** goes in `src/figma_to_react/config.py`. No magic numbers in
  pipeline code.
- **Observability** is vendor-isolated in `observability.py`. Never import
  `opik` anywhere else.
- The 8 pipeline stages and their enforcement loops are load-bearing. Do not
  restructure them to "simplify" — fix the specific stage that is wrong.
- Tests must run with no network and no model calls. If a change needs an API
  key to test, it belongs behind the `agent/` boundary instead.
- Run `pytest -q` after changes to `core/`, `qa/`, or `api/`.

## 7. Cost discipline

Each chat turn costs a premium request. Deliver the complete change in one
response rather than in increments. Do not re-read files you have already been
shown in this conversation. Do not run exploratory commands when the answer is
already in the context.
