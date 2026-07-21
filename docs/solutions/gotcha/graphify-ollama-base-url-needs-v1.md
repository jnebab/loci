---
title: graphify --backend ollama 404s unless OLLAMA_BASE_URL ends in /v1
date: 2026-07-22
category: gotcha
tags: [graphify, ollama, semantic-pass, openai-compatible, 404, base-url]
---
**Problem:** `graphify extract docs/solutions --backend ollama` with
`OLLAMA_BASE_URL=http://localhost:11434` failed every chunk with
`404 page not found` — server up, model pulled, direct
`/api/generate` curl working.

**Root cause:** graphify's ollama backend speaks Ollama's
**OpenAI-compatible** endpoint (`/v1/chat/completions`), not the native
API (`/api/chat`, `/api/generate`). With the bare base URL it joins the
OpenAI path onto the wrong root → 404. Also: `OLLAMA_API_KEY` must be any
non-empty value (a formality; graphify warns if unset).

**Fix:** `OLLAMA_API_KEY=local OLLAMA_BASE_URL=http://localhost:11434/v1
graphify extract <docs> --backend ollama --model qwen3:4b
--max-concurrency 1` — chunk succeeded, graph written, cost $0.00.
Now baked into `skills/init-loci/SKILL.md` (Ollama setup section) and the
CLAUDE.md template's map step.

**Verification:** 2026-07-22 A/B on the same 5-file corpus: bare base URL
→ `chunk 1/1 failed: 404 page not found`; with `/v1` →
`chunk 1/1 done ... 5 nodes, 1 edges ... tokens: 2,927 in / 6,067 out,
est. cost (~ollama): $0.0000`. Related: [[claude-code-lsp-plugin-anatomy]]
(same day, same lesson shape: the working config lives one level below the
obvious one).
