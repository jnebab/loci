---
title: Usage meter double-counted cost — transcript repeats usage per content block
date: 2026-07-22
category: bug
tags: [loci-usage, stop-hook, transcript, jsonl, token-cost, dedupe]
---
**Problem:** The optional session usage meter (`loci-usage.mjs`) reported
inflated session cost — ~$0.95 vs a true ~$0.51 on a real session (1.86×).

**Root cause:** Claude Code writes one transcript JSONL line *per content
block* of an assistant message; every line of a multi-block turn (text +
tool_use is the normal case) repeats the same `message.id` and the same
full `usage` object. The meter summed usage per line, so an N-block turn
was priced N times. Cache-write lines amplified it (1.25×/2× multipliers).

**Fix:** Dedupe by API message id before pricing — collect lines into a
`Map` keyed by `message.id` (fallback `uuid`/line no), keep the last line
per id, price unique messages only. Also corrected Sonnet 5 to its $2/$10
intro rate (through 2026-08-31, then $3/$15).
`skills/init-loci/references/loci-usage.mjs:98-115` (byId map), `:49` (rate).

**Verification:** Failing-first test (fixture: one message id across 3
lines) — pre-fix `~$0.18`, post-fix `~$0.11` = hand-computed truth; A/B on
a real transcript via `git stash`: old `~$0.95`, fixed `~$0.51`, context
depth unchanged at 41k. Any tool aggregating transcript `usage` needs this
dedupe (ccusage does the same).
