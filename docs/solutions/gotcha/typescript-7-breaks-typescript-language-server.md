---
title: TypeScript 7 ships no tsserver — typescript-language-server (and the official typescript-lsp plugin) can't use it
date: 2026-07-22
category: gotcha
tags: [typescript, lsp, tsgo, tsserver, typescript-language-server, claude-code-plugin]
---
**Problem:** Claude Code's official `typescript-lsp` plugin errored on every
JS/TS file (spawns `typescript-language-server --stdio`; binary absent on
this machine — no global typescript in homebrew node or any of 17 nvm
versions).

**Root cause:** Two layers. (1) The prerequisite was never installed — the
plugin bundles nothing. (2) The README's fix (`npm i -g
typescript-language-server typescript`) is now a trap: `typescript` resolves
to 7.0.2 (GA July 2026, Go-native), which no longer ships `tsserver.js` —
the exact thing typescript-language-server wraps. TS 7 speaks LSP natively
via `tsc --lsp --stdio` instead.

**Fix:** `npm i -g typescript` (7.0.2); local plugin `ts7-lsp` at
`~/Documents/git/local-claude-plugins` with lspServers `tsc --lsp --stdio`
(mirrors the official marketplace-entry pattern, `strict: false`);
`typescript-lsp@claude-plugins-official` set to `false` in
`~/.claude/settings.json` enabledPlugins. Stopgap — retire when the
official plugin supports TS 7. Legacy alternative if ever needed:
pin `typescript@6` (the pin is mandatory, not optional).

**Verification:** Raw LSP handshake: spawned `tsc --lsp --stdio`, sent
`initialize` → full capabilities response (completion, hover, definition)
from both the scratchpad install and global PATH `tsc` (7.0.2).
`ls node_modules/typescript/lib/tsserver.js` → No such file (TS 7.0.2).
