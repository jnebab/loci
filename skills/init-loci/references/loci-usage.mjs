#!/usr/bin/env node
/**
 * loci-usage — a zero-dependency Stop hook that reports session token usage.
 *
 * loci-flow's optional usage meter. Runs after every assistant turn, reads the
 * session transcript JSONL (path supplied by Claude Code on stdin), and prints
 * one line: current context depth in tokens + cumulative session cost in
 * dollars. If CONTEXT_BUDGET_TOKENS is set and the context crosses it, the line
 * gains a wrap-up warning. It never blocks, never stops — display only.
 *
 * Two numbers, on purpose:
 *   - context depth = the latest turn's total input (input + cache read + cache
 *     creation). "How deep is the context right now" — this is what the budget
 *     checks, because it's the number that makes "start a fresh session" the
 *     right remedy when it gets large.
 *   - session cost = cumulative across every turn, priced per-model with cache
 *     multipliers. "What this session has cost so far."
 *
 * Install: copied to <project>/.claude/hooks/ by /init-loci; a Stop hook in
 * .claude/settings.json runs it. Zero npm dependencies — Node built-ins only.
 */

import fs from "node:fs";

/* ===========================================================================
   CONFIG — edit these three. Everything below is machinery.
   =========================================================================== */

// Warn when the context reaches this many tokens. 0 disables the warning
// entirely (pure display). Set to e.g. 100000 to be warned at 100k.
const CONTEXT_BUDGET_TOKENS = 0;

// What the warning tells you to do when you're over budget. The default is
// loci-flow's own close-the-loop guidance — safe because the memory persists.
const ACTION_HINT =
  "wrap up: /handoff (+ /compound if unsaved), then start a fresh session";

// Per-model rates in USD per 1M tokens: [input, output]. Cache is derived from
// the input rate: read = 0.1x, 5-minute cache write = 1.25x, 1-hour = 2x.
// DATED 2026-07-22 — update when Anthropic pricing or model names change.
// An unknown model is shown in tokens with "(price n/a: <model>)" rather than
// a wrong dollar figure.
const PRICES = {
  "claude-fable-5": [10, 50],
  "claude-mythos-5": [10, 50],
  "claude-opus-4-8": [5, 25],
  "claude-opus-4-7": [5, 25],
  "claude-opus-4-6": [5, 25],
  "claude-sonnet-5": [2, 10], // intro pricing through 2026-08-31; then [3, 15]
  "claude-sonnet-4-6": [3, 15],
  "claude-haiku-4-5": [1, 5],
};

/* ===========================================================================
   MACHINERY
   =========================================================================== */

// Never break the session: any failure exits 0 with no output.
function bail() {
  process.exit(0);
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function fmtTokens(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
}

function main() {
  const raw = readStdin();
  if (!raw) bail();

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    bail();
  }

  const transcriptPath = input && input.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) bail();

  let contents;
  try {
    contents = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    bail();
  }

  // One API response is written as one JSONL line PER CONTENT BLOCK, each line
  // repeating the same message.id and usage. Keep only the last line per id —
  // summing per-line overcounts (measured 1.53x on a real session).
  const byId = new Map();
  let lineNo = 0;
  for (const line of contents.split("\n")) {
    lineNo++;
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (!ev || ev.type !== "assistant" || !ev.message || !ev.message.usage) continue;
    byId.set(ev.message.id || ev.uuid || `line-${lineNo}`, ev.message);
  }

  let costUsd = 0; // cumulative, across every turn
  let contextTokens = 0; // latest assistant turn's total input (context depth)
  let sawUnknownModel = null; // remember one unknown model id, if any
  let sawAnyUsage = false;

  for (const msg of byId.values()) {
    const u = msg.usage;
    const model = msg.model || "unknown";
    const inTok = u.input_tokens || 0;
    const cacheRead = u.cache_read_input_tokens || 0;
    const cacheCreate = u.cache_creation_input_tokens || 0;
    // Prefer the 5m/1h breakdown when present (they're priced differently).
    const cw5m = u.cache_creation ? u.cache_creation.ephemeral_5m_input_tokens || 0 : cacheCreate;
    const cw1h = u.cache_creation ? u.cache_creation.ephemeral_1h_input_tokens || 0 : 0;
    const outTok = u.output_tokens || 0;

    sawAnyUsage = true;

    // Context depth = the latest turn's total input side. Overwriting each turn
    // leaves the last (current) turn's value — correct after compaction too.
    contextTokens = inTok + cacheRead + cacheCreate;

    // Cumulative cost, priced per-model.
    const rate = PRICES[model];
    if (!rate) {
      sawUnknownModel = model;
      continue; // count context, but can't price this turn
    }
    const [inRate, outRate] = rate;
    costUsd +=
      (inTok * inRate +
        cacheRead * inRate * 0.1 +
        cw5m * inRate * 1.25 +
        cw1h * inRate * 2.0 +
        outTok * outRate) /
      1e6;
  }

  if (!sawAnyUsage) bail();

  const costStr = sawUnknownModel
    ? `~$${costUsd.toFixed(2)} (price n/a: ${sawUnknownModel})`
    : `~$${costUsd.toFixed(2)}`;

  let message = `loci · context: ${fmtTokens(contextTokens)} tokens · spent ${costStr}`;

  if (CONTEXT_BUDGET_TOKENS > 0 && contextTokens > CONTEXT_BUDGET_TOKENS) {
    message += `\n⚠ over ${fmtTokens(CONTEXT_BUDGET_TOKENS)} budget — ${ACTION_HINT}`;
  }

  // systemMessage surfaces the line to you. continue:true, no decision → the
  // stop proceeds normally; this only displays.
  process.stdout.write(
    JSON.stringify({ continue: true, suppressOutput: false, systemMessage: message }),
  );
  process.exit(0);
}

main();
