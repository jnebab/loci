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
   For `docs/solutions/` markdown (needs a semantic LLM pass): with
   `GEMINI_API_KEY` set use `graphify extract docs/solutions --backend gemini
   --out graphify-out/targets/docs-solutions`; without a key, run the
   graphify skill's subagent extraction with the session model — never block
   on an API key.
   Merge everything into the default query graph:
   `graphify merge-graphs graphify-out/targets/*/graphify-out/graph.json --out graphify-out/graph.json`
6. **Verify end-to-end (the pass/fail gate)** — write or copy one learning
   into `docs/solutions/`, map it (step 5's semantic pass + remerge), then
   `graphify query "<its topic>" --budget 1000` must retrieve its root
   cause/fix. Not verified = not done.

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
