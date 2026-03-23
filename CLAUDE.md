# HADAL — Claude Code Instructions

> Military-grade threat intelligence terminal. Green-on-black identity, zero decorative animation.
> Stack: React 19 + TypeScript + Vite + Tailwind 4 + Canvas 2D + Leaflet

---

## Project Structure

```
src/
├── App.tsx              — Main orchestrator (Topbar → Hero → Missile → Sep → Feed → Intel → Economic)
├── main.tsx             — React entry
├── globals.css          — Full design system (surface tokens, text hierarchy, structural layout)
├── components/          — Domain-grouped UI (hero/, missile/, feed/, intel/, economic/, sep/, topbar/, ui/)
├── canvas/              — Custom Canvas 2D hooks (useGlobe, useSonar, useNoiseCanvas, useSepStatic, useDrawMark)
├── data/                — Static data (feed-data, gcc-data, gulf-economic, airspace-zones, thaad-sites, trajectories)
├── hooks/               — Logic hooks (useDataPipeline, usePressureGauge, useUtcClock, useSignalMonitor)
└── lib/                 — Utilities
public/                  — Static JSON endpoints (incidents.json, prices.json, airspace.json)
```

## Design System Tokens

| Token       | Value                        | Usage                  |
|-------------|------------------------------|------------------------|
| `--g`       | `#DAFF4A`                    | Primary lemon-green    |
| `--warn`    | `rgba(255,152,20,.92)`       | Alerts, Iran highlight |
| `--bg`      | `#060800`                    | Background             |
| `--HEAD`    | `Rajdhani`                   | Headers/labels         |
| `--C2`      | `Teko`                       | Large numbers          |
| `--MONO`    | `Share Tech Mono`            | Code/data              |

All border-radius: 0px. Zero decorative animation. Zero glows/box-shadows. No CRT effects.

---

## Agent Behavior

### 1. Respect the Aesthetic
- Every UI element must reinforce the green-on-black HADAL identity
- No rounded corners, no glows, no decorative animations, no CRT effects
- When in doubt: sharp edges, structural borders, static indicators (no blink/pulse)

### 2. Canvas First for Visualizations
- Custom visualizations use Canvas 2D API (not SVG, not charting libraries)
- Follow the hook pattern: `useGlobe`, `useSonar`, `useNoiseCanvas` etc.
- Canvas hooks live in `src/canvas/`, not in component files

### 3. Data Pipeline Conventions
- Remote data fetched via `useDataPipeline` hook with 60s refresh
- Fallback pattern: `fetch('public/x.json').catch(() => fetch('x.json'))`
- Static reference data lives in `src/data/` as typed TypeScript arrays
- Types: `Incident`, `PriceData`, `AirspaceData`

### 4. Component Organization
- Components are domain-grouped: `hero/`, `missile/`, `feed/`, `intel/`, `economic/`, `sep/`, `topbar/`
- shadcn/ui primitives live in `components/ui/` — use them for base elements
- New sections get their own directory under `src/components/`

### 5. CSS & Styling Rules
- All styling lives in `globals.css` — no CSS modules, no styled-components
- Use CSS custom properties (`--g`, `--bg`, `--MONO`, etc.) for theming
- Tailwind 4 utilities are available but project leans on custom CSS classes
- No CRT effects (scanlines, grain, vignette have been removed)
- No box-shadow glows, no text-shadow, no decorative keyframe animations
- Status indicators are static colored dots — no blink/pulse animations

### 6. Autonomous Bug Fixing
- When a build or runtime error is encountered, attempt to fix it before reporting
- Read the error, trace to source, apply minimal fix, verify the build passes
- If a fix requires architectural changes, stop and describe the approach first
- Never suppress errors with `@ts-ignore` or `any` casts as a first resort

### 7. Wireframe Before Production UI
- Never build production UI directly. Run a wireframe pass first.
- Before any UI component prompt, write a 3-line layout spec: structure only, no color, no glow, no polish
- Text spec format counts as wireframe in CLI workflows:
  pill button / left: icon (+) / right: label text / no color, no animation — structure only
- If you skip this step, you will spend 2x the time on corrections instead of directing
- Only proceed to production UI after the structure is confirmed

---

## Design Context

### Users
Intelligence analysts and military operators monitoring Gulf theatre threats in real time. They're under pressure, scanning multiple data streams simultaneously, making decisions where misreads have real consequences. They expect the system to be dense, honest, and fast — not friendly.

### Brand Personality
**Brutal · Classified · Alive.** Harsh edges, redacted institutional feel, but the data underneath is living and breathing. Nothing decorative exists — every pixel either conveys information or reinforces the system's authority.

### Emotional Target
**Urgent vigilance.** The operator should feel that everything on screen is live and consequential. The interface creates controlled tension — not panic, but the sustained awareness that this data matters right now.

### Aesthetic Direction
- **Green-on-black military terminal** — not retro-nostalgic, not sci-fi futuristic. Contemporary classified infrastructure.
- **Canvas-rendered visualizations** with pixel-level noise, static grain, structural borders. The screen should feel like it has texture — like looking at a real monitor in a SCIF.
- **Typography is hierarchical and functional**: Rajdhani for headers (authority), Teko for large data (impact), Share Tech Mono for streams (machine truth).
- **Color is rationed**: green (`#DAFF4A`) is the primary signal. Amber (`--warn`) is reserved for genuine alerts. Everything else is near-black with opacity variations.
- **References**: Real C2 systems, SIGINT terminals, satellite ground stations, drone operator consoles. The aesthetic of systems that exist but aren't designed to be seen.

### Anti-References
- **Not cartoonish** — nothing playful, whimsical, or exaggerated
- **Not sci-fi movie UI** — no glowing holograms, no Tron lines, no floating transparent panels
- **Not corporate dashboard** — no clean minimalism, no friendly cards, no pleasant whitespace
- **Not gaming HUD** — no health bars, no neon cyberpunk, no RGB energy
- **Not AI slop** — no animated scan lines sweeping across tiles, no pulsing dots, no gratuitous particle effects. If an animation doesn't represent real data movement, it doesn't exist.

### Design Principles

1. **Information density over comfort.** Every tile should feel packed with real data. Whitespace is structural, never decorative. If there's room, fill it with useful context.

2. **Noise is texture, not decoration.** Canvas grain, rasterBase noise, and static are part of the material feel — like phosphor on a real screen. But animated sweep lines, glowing pulses, and traveling highlights are banned. They're AI slop.

3. **Structural borders, not decorative ones.** Borders exist to separate information zones. 1px solid `var(--g15)` or lower. No glows, no shadows, no rounded corners. Corner brackets (`┌ ┐ └ ┘`) are acceptable as framing devices.

4. **Static over animated.** Status indicators are static colored fills. Data updates replace values — they don't transition. The only permitted motion is real data flow (scrolling feeds, updating numbers). Everything else holds still.

5. **Earn every element.** Before adding any visual element, ask: does this help the operator make a decision? If not, delete it. The system's authority comes from restraint, not from looking busy.
