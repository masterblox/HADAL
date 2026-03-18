# UPGRADE.md
> Personal dev workflow upgrades. Stack-agnostic. Applies to MIT, Hadal, and any future build.

---

## 001 — Wireframe Before Production UI
**Source:** Wojciech Zieliński (@wojciech_ui) · 17/03/2026

Before touching production code on any UI component, run a wireframe pass first.

**Rule:**
- No Claude Code prompt for UI without a 3-line layout spec first
- Wireframe = structure only. No color, no glow, no polish
- For CLI workflows, a text layout spec counts as your wireframe

**Example spec format:**
```
pill button
left: icon (+)
right: label text
no color, no animation — structure only
```

**Why it matters:**
Prompting straight to final UI hands visual decisions to the agent. You spend 2x the time correcting instead of directing.

---

## 002 — Use `/model opusplan` for Complex Tasks in Claude Code
**Source:** Twitter bookmark · 17/03/2026

`/model opusplan` is a hybrid alias in Claude Code that runs Opus in plan mode for reasoning, then switches to Sonnet for execution.

**Rule:**
- Default = Sonnet (fast, efficient, good enough for most tasks)
- Switch to `/model opusplan` when the task requires real architectural thinking — new feature design, refactors, debugging complex regressions
- Don't use full Opus for execution — it's slow and expensive for what Sonnet handles fine

**When to trigger it:**
- Starting a new feature from scratch
- Debugging a regression you can't immediately trace
- Designing a schema, data model, or multi-file architecture
- Any prompt where you'd normally write "ultrathink"

**Why it matters:**
Opus thinks at a different level but burns time and tokens on execution. This alias gives you the reasoning quality where it counts without the cost overhead on the build.

---

## 003 — Particle Animation Reference Tool
**Source:** particles.casberry.in · 17/03/2026

Interactive particle simulation playground with exportable presets (CUBE, and others navigable via arrows). Use for designing animated background elements, hero sections, and signature UI moments before implementing in code.

**Rule:**
- Use as a visual reference / configuration layer before prompting any particle implementation
- Define: shape preset → color → density → interaction behavior → then build
- Can simulate equivalent behavior directly in Claude.ai artifacts for rapid prototyping before committing to production

**Use cases per project:**
- MIT: force-directed node fields, FUD constellation background, ambient scanline effects
- Hadal: TBD based on brand direction
- Any project: hero section depth, loading states, interactive cursor effects

**Implementation paths:**
- `tsparticles` / `particles.js` for React/vanilla JS
- Pure canvas API for zero-dependency builds
- CSS-only for lightweight ambient effects (no interaction needed)

**Why it matters:**
Particle elements are high-signal visual moments — they signal craft. Designing them visually first prevents over-engineering and locks the feeling before the code.

---

## 004 — TLA+ for Agentic State Verification
**Source:** @KingBootoshi · 14/03/2026 · 268K views

TLA+ is a formal specification language that mathematically exhausts every possible state in a system design to find bugs *before* they exist in code. When paired with agentic coding, the agent gets instant feedback from the model checker and loops until all specs pass.

**What it does:**
- You write a spec of your system's state machine (not code — logic)
- The TLA+ model checker runs every possible scenario combinatorially
- Failures surface as design bugs, not runtime crashes
- Agents can auto-fix and re-check in a loop until all specs pass

**Scorecard example (from tweet):**
| Spec | States Checked | Time | Result |
|---|---|---|---|
| AgentRuns | 29,747,089 | 2m 44s | PASSED |
| Strategy | 46,927 | 7s | PASSED |
| Compaction | 920,871 | 6s | PASSED |

**When to use it:**
- Before building any system with complex state (auth flows, multi-agent coordination, real-time sync, financial logic)
- MIT: multi-agent bridge (Claude.ai ↔ Codex inbox/outbox), scoring model state transitions
- Hadal: TBD — any feature with concurrent state or event-driven logic

**Rule:**
- On complex features, write the TLA+ spec first → verify → then prompt to code
- Treat passing specs as your green light to build, not tests after the fact

**Why it matters:**
You're not catching bugs — you're proving they can't exist. Different category entirely.

**Resources:**
- `tla+` / `TLC model checker` — the toolchain
- `PlusCal` — higher-level syntax that compiles to TLA+ (easier entry point)
- Used by: AWS (DynamoDB, S3), Azure Cosmos DB, Intel

---

## 005 — Logo Design Philosophy: Small Mark, Big World
**Source:** Twitter bookmark (ARK Studio / branding inspo grid) · 17/03/2026

Four logos. Same principle: minimal geometric mark, small in frame, dark environmental background, white only. The logo earns authority through restraint — not size, color, or complexity.

**The 4 rules extracted:**
1. **One shape** — if you can't describe the mark in 3 words, simplify
2. **Small in frame** — logo placed modestly, environment carries the weight
3. **Dark world, white mark** — no color hierarchy needed when contrast is absolute
4. **Negative space is the design** — what surrounds the mark is as intentional as the mark itself

**What this means for prompting logo/brand work:**
- Never ask for "a logo with gradient, color, and texture" — that's noise
- Prompt: mark shape → placement → background world → done
- The background IS part of the brand expression, not a backdrop

**Application:**
- Masterblox: wordmark already correct (white, Akira Expanded, amber stroke only on SVG logo)
- MIT: logo mark usage rules already enforced (`initLogoFull`, `initLogoHeader`, `initLogoMark`)
- Hadal: when defining visual identity, start here — one mark, one world
- Any project: before designing a logo, define the *world* it lives in first

**Why it matters:**
Most AI-generated logos are loud because the prompt is loud. This framework enforces silence. The brands that feel institutional never shout.

---

## 006 — Chrome DevTools MCP: Give Claude Code Eyes in the Browser
**Source:** @shawn_pana + @xpasky · 17/03/2026 · VERIFIED REAL

Connect Claude Code to a live Chrome session via MCP. Claude can navigate, click, fill forms, read console errors, monitor network requests, and debug in real-time — no screenshots, no manual testing loops.

**Setup (Mac):**
```bash
# Install Chrome Beta 146+
brew install --cask google-chrome-beta

# Enable remote debugging
# Open Chrome Beta → chrome://inspect/#remote-debugging → toggle ON

# Add to ~/.claude.json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect", "--channel=beta"]
    }
  }
}

# Verify in Claude Code
/doctor  # should show chrome-devtools with 26 tools
```

**What Claude can do with it:**
- Navigate to localhost and test UI changes live
- Read console errors and fix the actual cause (not a guess)
- Monitor every network request/response in real-time
- Fill forms, click buttons, follow complete user flows
- Access authenticated sessions (LinkedIn, GitHub, etc.) if using persistent profile
- Capture screenshots at any viewport
- Measure Core Web Vitals (INP, LCP, CLS)

**Security note:**
- Use Chrome Beta profile only — not your main browser
- Don't browse sensitive sites (banking, personal email) in the debug instance
- Remote debugging port 9222 exposes browser to any local process — close when done

**Why it matters:**
Eliminates the manual QA loop entirely. Claude writes code → opens browser → tests it → fixes what's actually broken → retests. You stop being the translator between the AI and reality.

---

<!-- Add next upgrade below -->
