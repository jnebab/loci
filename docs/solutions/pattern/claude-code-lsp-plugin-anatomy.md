---
title: Claude Code LSP plugins — lspServers lives in the marketplace entry, not the plugin dir
date: 2026-07-22
category: pattern
tags: [lsp, lspServers, plugin, marketplace, strict-false, claude-code]
---
**Problem:** Needed to ship a custom LSP server as a Claude Code plugin
(native TS 7, see [[typescript-7-breaks-typescript-language-server]]), but
the plugin-dev skills document commands/agents/skills/hooks/MCP only — no
`lspServers` anywhere.

**Root cause / rationale:** LSP config is carried by the *marketplace
entry*, not plugin content. Dissecting the official `typescript-lsp`
(claude-plugins-official): its cache dir contains only a README — the whole
server definition sits inline in the marketplace.json plugin entry with
`strict: false`: `lspServers.<name> = { command, args, extensionToLanguage
}`. The command resolves from PATH; nothing is bundled.

**Fix / outcome:** Mirrored that shape for a local plugin: marketplace root
`~/Documents/git/local-claude-plugins/` with
`.claude-plugin/marketplace.json` (entry `ts7-lsp`, `strict: false`,
`lspServers` running `tsc --lsp --stdio`) + `plugins/ts7-lsp/README.md`.
Install: `/plugin marketplace add <path>` then `/plugin install
ts7-lsp@local`. Disable a broken LSP plugin via `enabledPlugins:
{"name@marketplace": false}` in `~/.claude/settings.json`.

**Verification:** Official pattern read from disk
(`~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json`
+ cache dir listing = README only); disable flag confirmed by
/reload-plugins dropping "1 plugin LSP server" → 0. End-to-end load of
ts7-lsp itself still pending its `/plugin install` + session restart.
