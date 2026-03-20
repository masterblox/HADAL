# Repo Map

## Runtime Areas

- `src/` — React 19 + TypeScript + Vite application. 3-lane shell (Overview / Operations / Analysis) with hash-based routing.

- `src/pages/` — Lane page components: `OverviewPage.tsx`, `OperationsPage.tsx` (lazy), `AnalysisPage.tsx` (lazy).

- `src/components/` — Domain-grouped UI: `hero/`, `missile/`, `feed/`, `intel/`, `economic/`, `sep/`, `topbar/`, `login/`, `predictor/`, `analysis/`, `flight/`, `shared/`.

- `src/canvas/` — Custom Canvas 2D hooks: `useGlobe`, `useSonar`, `useNoiseCanvas`, `useSepStatic`, `useDrawMark`, `useWaterfall`.

- `src/hooks/` — Logic hooks: `useDataPipeline`, `usePrediction`, `useUtcClock`, `useOpenSky`, `useTracking`, `useSignalMonitor`, `usePressureGauge`.

- `src/lib/` — Utilities + prediction engine (4-stage pipeline) + lane routing.

- `src/data/` — Static data: feed fallback, demo incidents, GCC data, gulf economics, THAAD sites, map events, postures, globe markers.

- `api/` — Serverless endpoints and proxies (aircraft.js).

- `scripts/` — Data generation tooling (generate-land.mjs).

- `public/` — Runtime data artifacts (incidents.json, prices.json, airspace.json, regional_stats.json) and static assets (audio, logo).

## Archive Areas

- `legacy/` — Archived Gulf Watch vanilla JS frontend. Behavioral reference only.

- `hadal.html` — Standalone visual prototype. Design reference, not active architecture.

## Project Entry Files

- `README.md` — Project overview.
- `package.json` — Frontend scripts and dependencies.
- `index.html` — Vite app entry.
- `vercel.json` — Deployment headers and hosting config.
- `CLAUDE.md` — Agent behavior instructions and design system tokens.

## Documentation

- `docs/` — Architecture, references, prompts, and handoff docs.
- `docs/handoff/ENGINEERING_JOURNAL.md` — Environment failures, repo issues, recovery notes.
- `docs/handoff/VERSION_LINEAGE.md` — Maturity markers and checkpoint history. Current: `v0.5.0`.
- `docs/architecture/HADAL_PLATFORM_PLAN.md` — Macro platform architecture and 7-phase sequence.
- `docs/architecture/HADAL_REFERENCE_HIERARCHY.md` — Source hierarchy (Gulf Watch, MIT, Shadowbroker, Ground Station).
- `docs/architecture/HADAL_IMPLEMENTATION_MATRIX.md` — Runtime file mapping against architecture. Real vs fake, connect targets, next moves.
- `docs/architecture/HADAL_PAGE_ARCHITECTURE.md` — 3-lane page structure (implemented).
- `docs/architecture/HADAL_MACRO_PLAN.md` — Delivery sequence.
- `docs/architecture/SYSTEM_BOUNDARIES.md` — System ownership boundaries.

## Working Rules

- Add new non-runtime documents under `docs/`, not the repo root.
- Keep runtime code in `src/`, `api/`, `scripts/`, and `public/`.
- Keep old frontend work in `legacy/`; do not mix it back into the active app.
- Keep machine-local review artifacts, screenshots, scratch HTML, and helper scripts under `_local/`, not the repo root.
- Do not commit `.env` files, credentials, or API keys.
