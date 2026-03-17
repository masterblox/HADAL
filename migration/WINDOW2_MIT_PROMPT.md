# ══════════════════════════════════════════
# WINDOW 2 · MIT BRANCH
# Paste this into Claude Code CLI (right VS Code)
# ══════════════════════════════════════════

Read the full codebase. You are NOT modifying MIT. You are EXTRACTING components from it for a sibling project called HADAL.

Repo: /Users/carlosprada/Desktop/MIT
Live: www.masterblox.ai

## MISSION

Extract specific components from MIT and output them as clean, self-contained code blocks that can be handed to another Claude Code session working on the HADAL project. Do not modify any MIT files. Read-only operation.

## EXTRACTION 1: CO-PILOT WIDGET

Find the Co-Pilot / Live Agent widget. Check these locations:
- app/copilot.js
- app/components/copilot.js
- components/CoPilot.jsx
- Any file containing "copilot" or "co-pilot"

Also find the API endpoint:
- api/copilot.js
- Any file that calls the Anthropic /v1/messages API

Once found, output TWO things:

**A) The full component code** — copy it entirely, no modifications. I need:
- The toggle button (hexagonal/brain icon, stripe border, fixed bottom-right)
- The chat panel (header, messages area, input bar, typing indicator)
- The conversation state management (messages array, loading state)
- All CSS/styles (inline or separate)
- The send function that calls the API
- The system prompt

**B) A dependency report** listing:
- What API endpoint URL does it call?
- What env vars does it need? (ANTHROPIC_API_KEY?)
- Does it import anything from other MIT files?
- Does it use any MIT-specific context (client names, scoring model, etc)?
- What z-index does it use?
- What dimensions (width, height of expanded panel)?

Output both as a single code block I can copy-paste to Window 1.

## EXTRACTION 2: LOGO COMPONENT

Find the logo system:
- app/components/mit-logo.js
- Any file with initLogoFull, initLogoHeader, initLogoMark

Output:
- The full file
- The SVG path data for the MASTERBLOX wordmark
- How it's called/initialized in the main app
- Font used (should be Akira Expanded)
- Stroke color (#FFB300)

I need the PATTERN, not the specific SVG paths — HADAL will use a different wordmark but the same 3-function architecture (full/header/mark).

## EXTRACTION 3: SUPABASE CLIENT

Find how MIT connects to Supabase:
- Any file importing @supabase/supabase-js or supabase
- How realtime subscriptions are set up
- How the client is initialized
- Any reconnection or fallback logic

Output:
- The connection setup code
- Any subscription patterns
- How env vars are loaded (process.env? window? .env.local?)

## EXTRACTION 4: DESIGN SYSTEM AUDIT

Scan the entire codebase and output a reference table of:

**Colors used:**
| Token | Hex/RGBA | Where Used |
|-------|----------|------------|
| primary amber | ? | ? |
| bg dark | ? | ? |
| border | ? | ? |
| text bright | ? | ? |
| text dim | ? | ? |

**Font sizes used (list every unique size):**
| Size | Font Family | Where Used |
|------|-------------|------------|

**Letter-spacings used:**
| Value | Where Used |
|-------|------------|

**Animation keyframes defined:**
| Name | Duration | What It Does |
|------|----------|--------------|

**Shared patterns worth porting:**
- Diagonal stripe hazard border (the co-pilot toggle)
- Corner bracket pseudo-elements
- Scanline overlay
- Glow effects (box-shadow with primary color)
- Any hover state transitions

## EXTRACTION 5: CANVAS UTILITIES

Find any canvas-based animations:
- Noise generators
- Any requestAnimationFrame loops
- Particle effects

Output the code + parameters (colors, opacity, frame rate, pixel manipulation).

## OUTPUT FORMAT

For each extraction, output in this format:

```
═══ EXTRACTION [N]: [NAME] ═══
FILE: [original path in MIT]
LINES: [approximate line count]
DEPENDENCIES: [what it imports]
ENV VARS: [what it needs]

--- CODE START ---
[full code]
--- CODE END ---

NOTES FOR HADAL:
- [what to change when porting]
- [what to keep exactly as-is]
- [gotchas]
═══ END ═══
```

## RULES

- DO NOT modify any MIT files
- DO NOT push anything
- DO NOT delete anything
- Read-only operation — you are a scanner, not a builder
- Output everything to stdout so I can copy it to Window 1
- If a file doesn't exist where expected, search the full codebase for it
- If the co-pilot was lost in a rollback, check git log for the last commit that had it and show me the branch/commit hash

Start with Extraction 1 (Co-Pilot Widget). Show me what you find.
