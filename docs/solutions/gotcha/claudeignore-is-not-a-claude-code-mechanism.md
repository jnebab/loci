---
title: .claudeignore is not a Claude Code mechanism — use permissions.deny
date: 2026-07-22
category: gotcha
tags: [claudeignore, permissions, deny, settings, prompt-cache, graphify-out]
---
**Problem:** init-loci step 3 made `.claudeignore` (containing
`graphify-out/`) a MUST, claiming skipping it invalidates the prompt cache
on every graph rebuild. The step protected nothing.

**Root cause:** `.claudeignore` is a community-imagined convention
(pattern-matched from `.gitignore`/`.cursorignore`) that Claude Code never
implemented — a long-open feature request (claude-code #579, #29455); the
settings docs list only `permissions.deny` rules as the exclusion
mechanism. It only works in third-party tools (ClaudeSync, claude-ignore
hook). The cache rationale was also wrong: files that never enter context
can't invalidate the prompt cache — the real risk is Claude wastefully
reading generated graph JSON.

**Fix:** Step 3 now merges
`{"permissions": {"deny": ["Read(./graphify-out/**)"]}}` into
`.claude/settings.json` — `skills/init-loci/SKILL.md:47`, README design
notes, and `claude-md-template.md:42` rewritten to match.

**Verification:** `code.claude.com/docs/en/settings` fetched 2026-07-22:
no `.claudeignore`; deny rules documented as the exclusion mechanism.
`grep -rni claudeignore` post-rewrite: only the two deliberate warnings
remain.
