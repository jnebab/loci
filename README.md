# 🏛 loci-flow

**A complete, token-efficient engineering workflow for Claude Code** — one
loop that carries every task from **recall** (what do we already know?)
through **analysis** (brainstorm features, root-cause bugs), **planning**,
**interactive visual review**, **execution** (TDD + verification), to
**knowledge capture and sharing** — with compressed shell output the whole
way through.

The *loci* half of the name is the ancient *method of loci* — the memory palace — because
that's the mechanic that makes the loop compound: every verified learning is
placed at a node in a knowledge graph, and every new task starts by walking
it. But the memory is one stage of six; the product is the whole loop.

| Stage | What happens | Powered by |
|---|---|---|
| 1 · Recall | One budget-capped graph query answers "have we seen this before, and what code is involved?" | graphify |
| 2 · Think | Features get brainstormed to an approved design; bugs get root-caused before any fix | your process skills (e.g. superpowers) |
| 3 · Plan + Review | Written plan, rendered as an interactive HTML artifact you annotate; feedback flows back automatically | writing-plans + lavish (axi) |
| 4 · Build | TDD, verification-before-completion, model routing | your process skills |
| 5 · Compound | Verified learnings (root cause + proof) captured to `docs/solutions/` | `/compound` (bundled) |
| 6 · Map | Learnings + code folded into the graph the next task recalls from | graphify |
| ⚡ everywhere | Shell output compressed 60–90%, losslessly | rtk |
| 👁 on demand | "Explain / visualize / compare this" → interactive annotatable artifact | lavish (axi) |

```mermaid
flowchart TD
    T(["Task arrives<br/>(feature or bug)"]) --> R["1 · RECALL<br/>graphify query — budget-capped<br/>walk of past learnings + code map"]
    R --> TH["2 · THINK<br/>brainstorm features /<br/>root-cause bugs"]
    TH --> P["3 · PLAN + REVIEW<br/>written plan,<br/>visually reviewed"]
    P --> E["4 · BUILD<br/>TDD + verification<br/>(rtk compresses every shell call)"]
    E --> C["5 · COMPOUND<br/>/compound → docs/solutions/*.md<br/>(verified lessons only)"]
    C --> G["6 · MAP<br/>semantic pass + merge-graphs<br/>→ a new room in the palace"]
    G -.->|"next task starts smarter"| R
    R -. "user asks to explain /<br/>visualize / compare anything" .-> V["VISUAL EXPLAIN<br/>lavish (axi) — interactive HTML<br/>artifact, annotate + feedback loop"]
    V -.-> C
```

Two cross-cutting branches ride alongside the numbered loop: **rtk**
compresses every shell call in every stage, and **lavish** fires whenever
something is easier shown than told — plan reviews at stage 3, but equally a
mid-task "explain this architecture to me" — rendering an interactive,
annotatable HTML artifact whose feedback flows straight back into the session.

## Why

Token efficiency has two time horizons, and most tools only address one:

| Horizon | Mechanism | Tool |
|---|---|---|
| **Within a session** | Deterministic, lossless compression of shell output (60–90% on git/test/lint) | [rtk](https://github.com/rtk-ai/rtk) |
| **Across sessions** | Learnings + code mapped into a graph; recall is one budget-capped query instead of re-grepping and re-reading | [graphify](https://github.com/Graphify-Labs/graphify) |

loci-flow wires both into one loop, with two hard rules that keep it honest:

- **No lossy compression, no per-turn context taxes.** rtk is rule-based
  (never an ML model rewriting your context); graph recall has a hard token
  budget; learning capture is a single pass. Tools that inject rulesets
  every turn or semantically compress your history are deliberately excluded.
- **Only verified knowledge enters the palace.** Every captured learning
  requires a root cause and a Verification line with the real command +
  output. A guessed fix poisons every future session that recalls it.

## Install

```
/plugin marketplace add jnebab/loci-flow
/plugin install loci-flow@loci-flow
```

Then, in any project or workspace you want the loop:

```
/workflow-init
```

The skill checks prerequisites, asks which code targets to graph, and wires
everything project-scoped — it never touches your global `~/.claude` config.

## Prerequisites

| Tool | macOS | Windows / Linux |
|---|---|---|
| [rtk](https://github.com/rtk-ai/rtk) | `brew install rtk` | prebuilt binary from releases, or `cargo install rtk` |
| [graphify](https://github.com/Graphify-Labs/graphify) | `pip install graphifyy` | `py -m pip install graphifyy` (Windows) |

Optional but recommended: the [superpowers](https://github.com/obra/superpowers)
plugin (brainstorming, systematic-debugging, writing-plans, TDD, verification)
for the think/plan/build stages, and a visual plan-review tool such as
[lavish-axi](https://github.com/kunchenguid/lavish-axi).

## What's in the box

- **`/workflow-init`** — builds the palace in a project/workspace: loop rules
  in CLAUDE.md, `docs/solutions/` learning store, `.claudeignore`
  (prompt-cache protection), project-scoped rtk hook, per-target graphify
  graphs merged into one queryable workspace graph, and an end-to-end
  verification gate.
- **`/compound`** — captures a verified learning (bug / decision / gotcha /
  pattern) as a ≤30-line markdown entry with mandatory root cause and
  verification, then places it in the graph.
- **Reference templates** — CLAUDE.md loop-rules block, solutions README,
  rtk hook JSON.

## Design notes

- **Code graphs are free.** graphify parses code with tree-sitter locally —
  zero LLM tokens. Only `docs/solutions/` markdown needs a semantic pass
  (Gemini key if available, otherwise the session model — never blocked on
  an API key).
- **Graphs live under `graphify-out/targets/<name>` and merge** via
  `graphify merge-graphs` into one workspace graph — repos stay clean of
  generated files.
- **`.claudeignore` must contain `graphify-out/` before the first extract**,
  or every rebuild invalidates Claude Code's prompt cache and silently eats
  the savings.
- **Installer overreach is reverted by design.** Both rtk's and graphify's
  installers default to mutating global config; `/workflow-init` keeps
  everything project-scoped and undoes what the installers globalize.
- **Small fresh repos:** skip the graph until learnings accumulate
  (graphify's own benchmarks show ~1x payoff on tiny corpora) — the loop
  rules, learning store, and rtk still pay off from day one.

## Measuring it

- `rtk gain` — real measured token savings from shell compression.
- `graphify query "<topic>" --budget 2000` — recall in one capped call;
  compare against what the equivalent grep + file-reading spree would cost.

## License

MIT
