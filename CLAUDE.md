# loci-flow — project rules

## The compounding loop (every task)

1. **Recall first.** Before exploring code or docs for any non-trivial task,
   run `graphify query "<topic>" --budget 2000` from the workspace root.
   It searches past learnings (docs/solutions/) and the code graph in one
   budget-capped call. Only fall back to grep/Read exploration for what the
   query didn't answer.
2. **Think → plan → build** per your skill routing: brainstorming for
   features, systematic-debugging for bugs, writing-plans for multi-step
   work, and a visual review of plans before execution.
3. **Visual when visual.** Whenever the user asks to explain, visualize,
   compare, or walk through something — or the answer is easier grasped
   as a diagram/table/comparison than prose — ask one question: interactive
   HTML, or markdown? HTML → render via lavish (`npx -y lavish-axi <file>`),
   then poll for annotations. Markdown → apply the `i-have-adhd` skill if
   installed, plus `skills/init-loci/references/markdown-output.md`
   (its rules alone carry this path if `i-have-adhd` isn't installed).
   Applies to plan reviews (step 2) and standalone explanations alike;
   don't answer in prose what's clearer drawn or structured.
4. **Compound last.** After solving anything non-obvious, run /compound.
   Learnings live in docs/solutions/{bug,decision,gotcha,pattern}/ — check
   there before re-debugging anything.
5. **Map after compounding.** After /compound writes or updates an entry,
   re-run the docs semantic pass (extraction cache skips unchanged files;
   working dir graphify-out/targets/docs-solutions), then remerge:
   `graphify merge-graphs graphify-out/targets/*/graphify-out/graph.json --out graphify-out/graph.json`
   After code changes in a graphed repo: `graphify update <repo>` (free,
   no LLM), then the same remerge.
6. **Handoff closes the loop.** After a task or bugfix is verified
   complete (steps 4–5 done if the session produced a learning), run
   `/handoff` to record real gate output, real commit hash, and what's
   next for the following session. Also runnable manually anytime the
   user wants to wrap up or leave a note ("wrap up", "leave a note for
   next time") — it does not require compound/map to have run first.

## Workspace facts

- **No graph yet — store is small; recall = read docs/solutions/ directly**
  (steps 1 and 5 of the loop stay dormant until it grows). If/when graphing:
  semantic pass runs LOCALLY via Ollama (installed + approved 2026-07-22,
  superseding the earlier no-backend decision) —
  `OLLAMA_API_KEY=local OLLAMA_BASE_URL=http://localhost:11434/v1
  graphify extract docs/solutions --backend ollama --model qwen3:4b
  --max-concurrency 1` — the `/v1` suffix is required. NEVER bare
  `graphify extract`: its backend auto-detect silently grabs whatever API
  key is in the env.
- graphify-out/ is machine-generated (and deny-listed from reads in
  .claude/settings.json) — never read it directly; use `graphify query` /
  `graphify explain`.
- Visual graph map: `graphify tree` emits a local, collapsible-tree HTML
  view of a graphed target — offer it when the user asks to "see" the
  codebase structure or how things connect. No LLM involved. (The /viz
  command was removed 2026-07-22 with the no-graph decision.)

<!-- rtk-instructions v2 -->
## RTK (token-optimized command output)

A PreToolUse hook (.claude/settings.local.json) auto-rewrites Bash commands
through `rtk`, compressing git/test/lint/build output 60-90% — no action
needed. If the hook is unavailable, prefix commands with `rtk` manually
(safe passthrough for unknown commands). Meta: `rtk gain` (savings stats),
`rtk discover` (missed opportunities), `rtk proxy <cmd>` (bypass filter).
<!-- /rtk-instructions -->
