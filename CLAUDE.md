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

| Token       | Value                        | Usage                         |
|-------------|------------------------------|-------------------------------|
| `--g`       | `#C4FF2C`                    | Primary lemon-green           |
| `--warn`    | `rgba(255,140,0,.9)`         | Alerts, Iran highlight        |
| `--bg`      | `#060800`                    | Background                    |
| `--TITLE`   | `UnifrakturMaguntia`         | Old English section headings  |
| `--HEAD`    | `Rajdhani`                   | Sub-labels/nav                |
| `--C2`      | `Inter`                      | Data numbers                  |
| `--MONO`    | `Share Tech Mono`            | Code/data                     |

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
