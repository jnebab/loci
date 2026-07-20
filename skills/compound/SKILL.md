---
name: compound
description: Use after solving a non-obvious bug, making an architectural decision, or discovering a project gotcha — triggers on "/compound", "log this learning", "remember this fix", "add to solutions", or during handoff when the session produced a reusable lesson. Appends a categorized entry to docs/solutions/ so future sessions start smarter instead of rediscovering the same fix.
license: MIT
metadata:
  author: jnebab
  version: "1.0"
---

# Compound

Every non-obvious fix contains knowledge that dies with the session unless
written down where the *next* session will look. This skill turns that
knowledge into a git-trackable, graph-queryable store.

## Where learnings live

`docs/solutions/<category>/<slug>.md` — categories: `bug/`, `decision/`,
`gotcha/`, `pattern/`. One file per learning, ≤30 lines.

## Workflow

1. **Dedup first.** Search `docs/solutions/` for the topic (via
   `graphify query` if a graph exists, else grep). If an entry exists,
   update it — never write a near-duplicate.
2. **Write the entry** with this frontmatter and shape:

```markdown
---
title: <one line — symptom or decision>
date: <YYYY-MM-DD>
category: bug | decision | gotcha | pattern
tags: [<searchable terms>]
---
**Problem:** <what broke / what was decided, one paragraph>
**Root cause / rationale:** <the actual why — not the symptom>
**Fix / outcome:** <what resolved it, with `file:line` refs>
**Verification:** <the real command + output that proved it>
```

Link related entries with `[[wikilinks]]` — graphify turns them into
graph edges.

3. **Make it discoverable.** Ensure the project's `CLAUDE.md` mentions
   `docs/solutions/` (one line: "Check docs/solutions/ for known fixes
   before debugging"). A store nobody reads compounds nothing.
4. **Map it.** If the workspace has a graphify graph, re-run the docs
   semantic pass and remerge (see the CLAUDE.md loop rules) so the entry
   is immediately query-retrievable.
5. **Report** the file path in one line. Don't paste the entry back into
   chat.

## Rules

- Only *verified* knowledge — the Verification line is mandatory; a guessed
  root cause poisons future sessions.
- Root cause, not symptom ("truncated Mach-O binary from interrupted
  unzip", not "render was broken").
- Skip trivia the codebase already documents. If it's derivable from the
  code in one look, it doesn't belong here.
