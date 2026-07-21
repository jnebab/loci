---
name: init-loci
description: Use when the user asks to set up the compounding token-efficient workflow (rtk + graphify + docs/solutions + loop rules) in a directory or repo — triggers on "/init-loci", "set up the compound workflow here", "make this repo compound".
license: MIT
metadata:
  author: jnebab
  version: "1.0"
---

# Init Loci

Sets up the compounding loop in the current directory:

**recall → think → plan → review → build → compound → map**

Each task starts with a budget-capped knowledge-graph query (recall), ends by
capturing verified learnings (compound) and folding them into the graph (map),
so the next task starts smarter. rtk compresses all shell output in between.

Works on a single repo or a workspace folder containing multiple repos
(rules live at the top level and cover every session beneath it).

## Prerequisites (check, don't assume)

| Tool | Check | Install |
|---|---|---|
| rtk | `rtk --version` | macOS: `brew install rtk` · Windows/Linux: prebuilt binary from github.com/rtk-ai/rtk releases, or `cargo install rtk` |
| graphify | `graphify --version` | `pip install graphifyy` (double-y; the single-y PyPI package is unrelated). Windows: `py -m pip install graphifyy` |
| ollama (optional — semantic-pass default) | `ollama --version` | see "Ollama setup" section below |

Process skills (brainstorming, systematic-debugging, writing-plans, TDD,
verification) come from the superpowers plugin if installed; the loop rules
reference them but do not require them.

## Steps — confirm each with the user before writing

1. **CLAUDE.md** — append the loop rules from
   `${CLAUDE_PLUGIN_ROOT}/skills/init-loci/references/claude-md-template.md`
   (append if the file exists — NEVER overwrite). The template routes both
   plan reviews AND user-requested visual explanations (diagrams,
   comparisons, walkthroughs) through lavish (`npx -y lavish-axi`); if the
   user prefers a different visual tool, adjust the "Visual when visual"
   rule to it.
2. **docs/solutions/ scaffold** — create `{bug,decision,gotcha,pattern}/`
   subdirectories and copy
   `${CLAUDE_PLUGIN_ROOT}/skills/init-loci/references/solutions-readme.md`
   to `docs/solutions/README.md`.
3. **Deny-list graphify-out/ (project settings)** — merge
   `{"permissions": {"deny": ["Read(./graphify-out/**)"]}}` into
   `.claude/settings.json` (create it if absent; step 4 merges into the
   same file). Generated graph JSON is large and machine-readable only —
   the deny rule stops accidental greps/reads from dumping it into
   context; recall goes through `graphify query` instead. Do NOT use a
   `.claudeignore` file — it is not a Claude Code mechanism (permission
   deny rules are the official exclusion) and protects nothing.
4. **rtk hook (project-scoped, NOT global)** — merge the contents of
   `${CLAUDE_PLUGIN_ROOT}/skills/init-loci/references/settings-hook.json`
   into `.claude/settings.json` (create it if absent; if it exists, add the
   PreToolUse entry to the existing hooks). Do NOT run `rtk init -g` — it
   edits the user's global `~/.claude/settings.json`. Plain `rtk init` may
   also append a ~145-line command reference to CLAUDE.md; the template's
   compact RTK section replaces that, so skip `rtk init` entirely.
   Verify: run `rtk git status` inside a repo, then `rtk gain`.
4b. **Session usage meter (OPTIONAL — ask first, default no).** Ask: "add a
   per-turn session usage meter? (a Stop hook — shows context depth + cost
   after each turn)". Only if the user says yes: copy
   `${CLAUDE_PLUGIN_ROOT}/skills/init-loci/references/loci-usage.mjs` to
   `.claude/hooks/loci-usage.mjs`, and merge
   `${CLAUDE_PLUGIN_ROOT}/skills/init-loci/references/stop-hook.json` into
   `.claude/settings.json` (add the Stop entry to the existing hooks — never
   overwrite the rtk PreToolUse entry from step 4). The meter is display-only
   (never blocks); it reads the session transcript locally, zero dependencies.
   To set a warning threshold, the user edits `CONTEXT_BUDGET_TOKENS` at the
   top of the copied script (default 0 = pure display); `PRICES` there is a
   dated per-model rate table they update as pricing changes. Skipping this
   keeps the default install free of any per-turn hook.
5. **graphify graphs** — ask the user which code targets to graph (never
   extract everything unprompted). Then per target:
   `graphify extract <target> --code-only --out graphify-out/targets/<name>`
   — local tree-sitter AST, zero LLM tokens, so repos stay clean of
   generated files.
   For `docs/solutions/` markdown (needs a semantic LLM pass) — ALWAYS pass
   an explicit `--backend`; a bare `graphify extract` silently auto-detects
   whatever API key sits in the env and sends the corpus there.
   - **Default — Ollama, fully local** (free, nothing leaves the machine;
     setup below):
     `OLLAMA_API_KEY=local OLLAMA_BASE_URL=http://localhost:11434/v1 graphify extract docs/solutions --backend ollama --model qwen3:4b --max-concurrency 1 --out graphify-out/targets/docs-solutions`
     The `/v1` suffix is REQUIRED — without it every chunk fails with
     `404 page not found` (graphify speaks Ollama's OpenAI-compatible
     endpoint, not its native API).
   - **Alternative — Claude API:** `ANTHROPIC_API_KEY` set →
     `--backend claude --model claude-haiku-4-5` (pay-per-token; a ≤30-line
     entry costs a fraction of a cent; separate billing from a Claude
     subscription).
   - **Alternative — Gemini:** `GEMINI_API_KEY` set → `--backend gemini`
     (free-tier request data may be used by Google to improve products;
     paid tier is excluded — check which tier the key is on).
   Merge everything into the default query graph:
   `graphify merge-graphs graphify-out/targets/*/graphify-out/graph.json --out graphify-out/graph.json`
6. **Verify end-to-end (the pass/fail gate)** — write or copy one learning
   into `docs/solutions/`, map it (step 5's semantic pass + remerge), then
   `graphify query "<its topic>" --budget 1000` must retrieve its root
   cause/fix. Not verified = not done.

## Ollama setup (the semantic-pass default)

One-time, no account, no subscription, no per-token cost — the model runs
on the user's machine (~2 GB disk for the baseline model).

| OS | Install + start server | Then |
|---|---|---|
| macOS | `brew install ollama` then `brew services start ollama` (or the Ollama.app installer from ollama.com/download — the app runs the server itself) | `ollama pull qwen3:4b` |
| Linux | `curl -fsSL https://ollama.com/install.sh \| sh` (installs a systemd service; else run `ollama serve`) | `ollama pull qwen3:4b` |
| Windows | Installer from ollama.com/download/windows, or `winget install Ollama.Ollama` — the app auto-starts the server (tray icon) | `ollama pull qwen3:4b` in any terminal |

Verify: `curl http://localhost:11434/api/version` returns a version JSON.
Then extraction needs exactly two env vars on the command:
`OLLAMA_BASE_URL=http://localhost:11434/v1` (the `/v1` is mandatory) and
`OLLAMA_API_KEY=<any non-empty value>` (a formality — nothing checks it).
Keep `--max-concurrency 1` for local servers.

Quality note: `qwen3:4b` is the tested baseline and produces sparser
graphs than the cloud backends (fewer inferred conceptual edges). If the
machine has RAM to spare, `ollama pull qwen3:8b` and `--model qwen3:8b`
extracts richer graphs; the store's ≤30-line entries keep either fast.

## Keeping the graph current

- Code changed in a graphed repo: `graphify update <repo>` (free, no LLM),
  then remerge.
- Learning added/updated: re-run the docs semantic pass (the extraction
  cache skips unchanged files), then remerge.

## Rules

- Everything project-scoped: no edits to `~/.claude/CLAUDE.md` or
  `~/.claude/settings.json`. If `graphify install` is used for its query
  skill, move `~/.claude/skills/graphify` into `<project>/.claude/skills/`
  and revert the section the installer appends to `~/.claude/CLAUDE.md` —
  both rtk and graphify installers default to global mutation.
- Small fresh repos: skip graphify until learnings accumulate (its own
  benchmarks show ~1x payoff on tiny corpora); do steps 1-4 only.
- Do not add always-on context injectors (persona rulesets, per-turn style
  packs) or lossy ML compression proxies to this workflow — they either tax
  every turn or risk silently degrading answers. rtk is lossless-by-rule;
  graphify's recall is budget-capped; that is the whole point.
- Windows note: the hook command (`rtk hook claude`) is shell-agnostic as
  long as `rtk` is on PATH; paths in commands use forward slashes.
