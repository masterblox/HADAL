# HADAL · COMPONENT EXTRACTION PLAN
## MIT → HADAL · Element-by-Element Mapping

## Historical Status Note

This document is a donor-strategy reference from the extraction phase.

It does not override current product truth. Use this precedence order:
- repo/Obsidian handoff docs + current `main`
- `FEATURES.md`
- this extraction plan

Current lock for migration work:
- `GulfWatch V2` = canonical
- `AYN` = donor only
- lane model = `Overview / Maps / Console`
- no gate restore
- no lane-role reversal
- no broad donor migration until parity and landing are correct

---

## DUAL WORKSPACE SETUP

```
┌─────────────────────────────┬─────────────────────────────┐
│  WINDOW 1 (LEFT)            │  WINDOW 2 (RIGHT)           │
│  HADAL branch               │  MIT branch                 │
│  Fork of GulfWatch          │  www.masterblox.ai          │
│                             │                             │
│  UX tailoring:              │  Component source:          │
│  - Skin GulfWatch frontend  │  - Co-Pilot widget          │
│  - Apply HADAL design       │  - Supabase patterns        │
│  - Wire shadcn components   │  - Logo system method       │
│  - Integrate extracted      │  - Design system tokens     │
│    components               │  - Canvas animation utils   │
└─────────────────────────────┴─────────────────────────────┘
```

---

## EXTRACTION MAP: WHAT CROSSES OVER

### ✅ EXTRACT — Port from MIT to HADAL

| Component | MIT Location | HADAL Target | Changes Needed |
|-----------|-------------|-------------|----------------|
| **Co-Pilot Widget** | `app/copilot.js` + `api/copilot.js` | `frontend/src/components/shared/copilot.tsx` + `api/copilot.js` | Reskin: amber → green. Update system prompt from MIS context → HADAL context. Keep the brain SVG icon, hexagonal toggle, clip-path, 3-mode bar. Claude API stays claude-sonnet-4-5. |
| **Supabase Client Pattern** | `app/data/supabase.js` (if exists) | `frontend/src/data/supabase-client.ts` | Swap project URL + keys. Keep the realtime subscription pattern. Port to TypeScript. |
| **Logo Component Method** | `app/components/mit-logo.js` (initLogoFull, initLogoHeader, initLogoMark) | `frontend/src/components/layout/hadal-logo.tsx` | Replace MASTERBLOX SVG paths with HADAL wordmark. Keep the 3-function pattern (full/header/mark). Change stroke from #FFB300 → #C4FF2C. |
| **Share Tech Mono Setup** | Already shared | Already in HADAL | No change — same font, same import. |
| **Canvas Noise Utility** | If MIT has a reusable noise generator | `frontend/src/components/canvas/noise-canvas.tsx` | Both projects use similar canvas noise. If MIT's is cleaner/more configurable, use it. Change tint from amber → green. |
| **API Endpoint Pattern** | `api/copilot.js` (Vercel serverless) | `api/copilot.js` | Same pattern. The Anthropic API call structure is identical. Just update the system prompt. |
| **Env Var Convention** | `ANTHROPIC_API_KEY` in Vercel | Same env var name | Add to HADAL's Vercel project. Same key works for both. |

### ⚠️ ADAPT — Shared patterns, different implementation

| Pattern | MIT Version | HADAL Version | Notes |
|---------|------------|---------------|-------|
| **Color System** | Amber `#F59E0B` primary | Green `#C4FF2C` primary, Amber for warnings only | MIT = all amber. HADAL = green operational + amber threat. When porting, every `#f59e0b` → `#C4FF2C` for normal UI, keep amber only for warning/threat states. |
| **Scanlines/Grain** | Present in MIT | Present in HADAL mock-up | Both have them. Use HADAL's version (already tuned for the green palette). |
| **Font Stack** | Share Tech Mono + Rajdhani | Share Tech Mono + Rajdhani + Teko + Cormorant Garamond | HADAL has 4 fonts vs MIT's 2. The extra fonts (Teko for big numbers, Cormorant for tagline) are HADAL-only. |
| **Hover Widget Pattern** | Co-Pilot: fixed bottom-right, hexagonal toggle, panel opens upward | Same pattern, different context | The co-pilot widget UX is rated 10/10 on MIT. Preserve the interaction design exactly. Only change colors + system prompt. |

### ❌ DO NOT EXTRACT — MIT-only, no HADAL equivalent

| Component | Why Not |
|-----------|---------|
| COCKPIT / BOARD tab architecture | HADAL has a single-view dashboard, no tab switching |
| FUD constellation / Network Map | HADAL has Leaflet map with marker factories instead |
| Community Health Index treemap | Not applicable to conflict intelligence |
| GH Performance / Pay Slips / Bounties | MIT-specific business ops |
| MIS 4-pillar scoring model | HADAL uses GulfWatch's severity scoring (0-130) |
| Client scope / Account memory | HADAL is public-facing, no per-client views |
| Browser extension QA | Not applicable |

---

## ELEMENT-BY-ELEMENT EXTRACTION SEQUENCE

### Round 1: Co-Pilot Widget (highest value)

**From MIT (Window 2):**
1. Open `app/copilot.js` — copy the full component
2. Open `api/copilot.js` — copy the API endpoint
3. Note the system prompt, conversation management, typing indicator

**Into HADAL (Window 1):**
1. Create `frontend/src/components/shared/copilot.tsx`
2. Port to React + TypeScript
3. Color swap:
   - All `#f59e0b` → `var(--hadal-green)` or `#C4FF2C`
   - All `#f59e0b18` (bg tints) → `rgba(196,255,44,.1)`
   - All `#f59e0b44` (borders) → `rgba(196,255,44,.25)`
   - All `#fbbf24` (user text) → `rgba(196,255,44,.85)`
   - All `#d4a84b` (assistant text) → `rgba(196,255,44,.6)`
   - Keep amber ONLY for the ▸ CO-PILOT label if you want it to stand out
4. Update system prompt:

```
You are HADAL Co-Pilot, an embedded tactical AI assistant 
inside the HADAL Threat Intelligence Terminal — a real-time 
conflict monitoring dashboard tracking the Gulf theatre.

Your role:
- Help analysts navigate the intelligence terminal
- Explain threat data, missile interception stats, severity scores
- Answer questions about the GulfWatch data pipeline
- Guide users to map markers, feed filters, economic impact data
- Summarize the current threat posture on demand

Context:
- Theatre: Gulf / Middle East (Operation Epic Fury)
- Data sources: 48 RSS feeds, GulfWatch pipeline, OSINT
- Scoring: GulfWatch severity (0-130), HADAL threat index (0-100)
- Countries tracked: UAE, Kuwait, Qatar, Bahrain, Jordan, Iran, Israel

Be concise, tactical, direct. Terminal operator language.
No fluff. Short answers unless depth is needed.
Prefix all responses with ▸
```

5. Create `api/copilot.js` (Vercel serverless) — same Anthropic API call pattern from MIT

### Round 2: Logo System

**From MIT:**
1. Open `app/components/mit-logo.js` — study the 3-function pattern

**Into HADAL:**
1. Create `frontend/src/components/layout/hadal-logo.tsx`
2. Three exports: `HadalLogoFull`, `HadalLogoHeader`, `HadalLogoMark`
3. The HADAL wordmark is Inter font-weight-200, letter-spacing .06em, stroke-only (no fill), stroke color `#C4FF2C`
4. Subtitle: "THREAT INTELLIGENCE TERMINAL" in Rajdhani 700, 7.5px, tracking .28em
5. Keep MIT's animation patterns if any (fade-in, glow pulse)

### Round 3: Supabase Client

**From MIT:**
1. Check how MIT initializes Supabase and manages realtime subscriptions
2. Check if MIT has React hooks or vanilla JS patterns

**Into HADAL:**
1. Port the connection pattern to `frontend/src/data/supabase-client.ts`
2. Create React hooks: `useIncidents`, `useFinance`, `useDefense`, `useThreatIndex`
3. Keep MIT's reconnection/fallback logic if it exists

### Round 4: Design System Tokens

**From MIT:**
1. Document every shared token (font sizes, letter-spacings, border patterns)

**Into HADAL:**
1. Ensure `tailwind.config.ts` captures everything
2. Add any MIT patterns HADAL is missing (diagonal stripes, corner brackets, glow effects)

---

## BACKEND ENGINEER BRIEF

_Give this to your backend dev (Cisco or whoever is handling infra)_

---

### TO: Backend Engineer
### FROM: Carlos (Super Commander)
### RE: HADAL Backend Setup — What You Need to Know

**What is HADAL:**
HADAL is a new Masterblox product — a real-time threat intelligence terminal for the Gulf conflict. Think of it as MIT's cousin, but for OSINT conflict data instead of Web3 growth. It's a public-facing dashboard (no auth, no per-client views).

**The repo:**
Fork of `github.com/nKOxxx/gulfwatch-testing` by a dev called Ares. His repo has 339 commits, a working RSS data pipeline, and a Circuit Breaker dedup algorithm. We're layering Supabase on top of his flat-file system. The existing pipeline stays intact — we don't break his stuff.

**Stack:**
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui → Vercel
- Backend: Supabase (PostgreSQL + Realtime + Edge Functions)
- Data pipeline: GulfWatch's Python scripts + GitHub Actions crons → Supabase
- API: Vercel serverless functions

**What's already done (or being done):**
- Schema design: 7 Supabase tables (incidents, missile_defense, threat_index, finance_data, posturing, airspace, circuit_breaker_log). Full SQL migration is written.
- Edge Function specs: 3 functions (ingest-gulfwatch, fetch-finance, aggregate-defense)
- Seed data: Pre-populated for all tables
- Codex prompt: Ready to execute the full backend setup

**What you need to do:**
1. Create a Supabase project called `hadal-intel` (closest region to Dubai)
2. Run the schema migration SQL (provided in `supabase/migrations/001_hadal_schema.sql`)
3. Run seed data SQL (provided in `supabase/seed.sql`)
4. Deploy 3 Edge Functions (TypeScript/Deno — code is provided)
5. Set up GitHub Actions secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
6. Add Vercel env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
7. Verify realtime works (insert a test row, confirm subscription fires)

**What you DON'T touch:**
- Frontend (that's Carlos + Claude Code)
- The GulfWatch Python scripts in `scripts/` (those work, leave them)
- The Circuit Breaker threshold (92% — sacred number, do not change)

**Shared resource with MIT:**
- Same Anthropic API key (for the Co-Pilot widget)
- Different Supabase project (HADAL has its own)
- Different Vercel project (separate deployment)
- Same git config: `cprada@masterblox.io` / `masterblox`

**Files to read:**
- `CLAUDE.md` — Full project rules and conventions
- `supabase/migrations/001_hadal_schema.sql` — Everything about the database
- `ARCHITECTURE.md` — System diagram and data flow (created by Codex)

**Timeline:**
Week 1: Supabase live with seed data + Edge Functions deployed
Week 2: Crons running, API serving live data
Week 3: Frontend wired, staging deploy
Week 4: Production

**Questions? Ask Carlos or check the CLAUDE.md — it has every decision documented.**

---
