# ══════════════════════════════════════════
# WINDOW 1 · HADAL BRANCH
# Paste this into Claude Code CLI (left VS Code)
# ══════════════════════════════════════════

Read the full codebase carefully before touching anything. This is a fork of nKOxxx/gulfwatch-testing (GulfWatch). You are transforming it into HADAL, a tactical threat intelligence terminal.

Read these files FIRST in this exact order:
1. CLAUDE.md (project rules, sacred rules, known pitfalls)
2. .impeccable.md (design DNA — colors, fonts, principles)
3. .codex/skills/frontend-design/SKILL.md + all files in reference/
4. docs/hadal-reference.html (the mock-up — this is visual truth)
5. public/ (current GulfWatch frontend you're replacing)

## MISSION

You are replacing the GulfWatch frontend with the HADAL tactical UI. The backend (Supabase, Edge Functions, data pipeline) is being handled separately. Your job is frontend only.

## STEP 1: SCAFFOLD

```bash
cd /path/to/hadal
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init -d
```

When shadcn asks:
- Template: vite
- Base color: Zinc (we override everything anyway)
- CSS variables: yes

Then install components:
```bash
npx shadcn@latest add tabs table card badge scroll-area toggle toggle-group tooltip sheet dialog button separator skeleton
```

## STEP 2: HADAL DESIGN TOKENS

Create `frontend/tailwind.config.ts` with these HADAL tokens:

Colors:
- hadal-green: #C4FF2C (and opacities at .95, .7, .5, .3, .15, .07)
- hadal-warn: rgba(255,140,0,.9) (and opacities at .5, .2, .1)
- hadal-bg: #060800

Fonts:
- font-mono: Share Tech Mono (data/feeds)
- font-head: Rajdhani (headers/labels)
- font-num: Teko (big numbers)
- font-tag: Cormorant Garamond (tagline only)

Override shadcn CSS variables in index.css:
- --radius: 0px (NO rounded corners anywhere)
- --background: #060800
- --primary: #C4FF2C
- --accent: rgba(255,140,0) (amber for warnings only)
- Add scanlines overlay on body::after
- Add film grain on body::before
- Add Leaflet dark overrides

Reference: docs/hadal-reference.html lines 10-456 for exact values.

## STEP 3: BUILD LAYOUT SHELL

Create these layout components matching the mock-up exactly:

`src/components/layout/topbar.tsx`
- Sticky top, 46px height, border-bottom green-30
- Left: DEPTH / PRESSURE / UTC stats
- Center: "HADAL" in Inter 200, stroke-only #C4FF2C + subtitle "THREAT INTELLIGENCE TERMINAL"
- Right: Alert banner (amber, blinking ⚠, "DAY 10 · OP. EPIC FURY · GULF ACTIVE")
- Clock ticks every second (UTC ISO format)

`src/components/layout/hero-grid.tsx`
- CSS Grid: 240px | 1fr | 240px (desktop), stacks on mobile
- Height: calc(100vh - 46px)
- Left column: brand plate, threat index, SPECIAL stats, system status dots
- Center: Leaflet map (full height)
- Right column: signal bars, sonar, GCC tracker

`src/components/layout/sep-band.tsx`
- 72px separator between hero and missile section
- Canvas static noise (green tint)
- Center: crosshair SVG + warning text

## STEP 4: BUILD MAP COMPONENTS

`src/components/map/map-container.tsx`
- Init Leaflet in useEffect with useRef
- CARTO Dark Matter tiles
- Center: [28, 46], zoom 5
- 7 layer groups: missile, airstrike, ground, intercept, combatants, diplomatic, airspace
- Call map.invalidateSize() at 200ms, 600ms, 1200ms after mount

`src/components/map/marker-factories.tsx`
- Port ALL 7 marker factories from docs/hadal-reference.html (lines 1654-1780+)
- mkMissile: orange burst + double ripple ring
- mkAirstrike: orange triangle + pulse
- mkIntercept: green diamond + X
- mkGround, mkCombatants, mkDiplomatic, mkAirspace
- Each factory creates L.divIcon with inline SVG + CSS animations
- Each binds popup (mkPopup function) and tooltip

`src/components/map/map-layers.tsx`
- Layer toggle controls that show/hide layer groups
- Uses shadcn Toggle components styled with HADAL colors

## STEP 5: BUILD INTEL WIRE LIVE

`src/components/intel/iwl-feed.tsx`
- The green-tinted feed panel from the mock-up (lines 260-360 CSS, lines 1890-1980 JS)
- Background: rgba(6,9,6,.94), border: rgba(140,160,140,.18)
- Header with "HADAL INTELLIGENCE" title + live dot
- Casualty counters (animated count-up)
- Tab bar: LIVE FEED | THREAT TABLE | ANALYTICS (use shadcn Tabs)
- Feed scroll area (use shadcn ScrollArea)
- Each event: dot + time + ID + title + tags
- Layer toggles (missile/airstrike/intercept/etc)
- Telemetry block at bottom
- Datalink status bar with blinking text

## STEP 6: BUILD REMAINING SECTIONS

Port each section from the mock-up. Match visually pixel-for-pixel:

- Missile cards grid (5 cards: UAE/Kuwait/Qatar/Bahrain/THAAD)
- Aggregate bar below missiles
- Threat feed table with severity badges
- Economic section (amber theme: currencies, sparklines, commodities, Dubai RE)
- Posturing + diplomatic panels
- Pentagon Pizza Index widget (the 3D rotating pizza slice)

## STEP 7: CANVAS ANIMATIONS

`src/components/canvas/noise-canvas.tsx`
- Reusable component accepting: interval, tint color, opacity
- Green noise by default (R: 56-156, G: 80-240, B: 8-26)
- Halved alpha for subtlety
- Disable on mobile via window.matchMedia

`src/components/canvas/sonar-canvas.tsx`
- Rotating sweep line with contact blips
- Slow rotation (0.012 per frame)
- Contacts light up when sweep passes, fade out over time

`src/components/canvas/depth-line.tsx`
- Horizontal pressure waveform

## STEP 8: RECEIVE EXTRACTED COMPONENTS

I will be handing you components extracted from MIT (another project). When I paste them:
1. Read the component code
2. Reskin: all amber (#f59e0b) → HADAL green (#C4FF2C)
3. Port from vanilla JS → React + TypeScript
4. Place in the correct location per the component architecture
5. Wire into the app

Expected components coming from MIT:
- Co-Pilot widget (chat widget, fixed bottom-right) → src/components/shared/copilot.tsx
- Logo system (3-function pattern) → src/components/layout/hadal-logo.tsx
- Supabase client patterns → src/data/supabase-client.ts

## RULES

- NEVER change the GulfWatch data pipeline (scripts/, .github/workflows/)
- NEVER use react-leaflet — use vanilla Leaflet in useEffect
- NEVER use rounded corners — --radius: 0px everywhere
- NEVER use colors outside green/amber — no blue, purple, red in UI
- Every component must visually match its section in docs/hadal-reference.html
- Canvas animations disabled on mobile
- Feature branch: work on feat/hadal-frontend
- Commit convention: feat:, fix:, chore:

git config user.email "cprada@masterblox.io" && git config user.name "masterblox"

Start with Step 1. Show me the scaffold output before proceeding.
