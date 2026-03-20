# HADAL — Full System Audit & Backend Handoff

**Date:** 2026-03-20
**Scope:** Complete frontend codebase audit, data pipeline architecture, backend integration points, and work log from 48-hour engineering session.

---

## 1. System Overview

HADAL is a military-grade threat intelligence terminal. React 19 + TypeScript + Vite + Tailwind 4 + Canvas 2D + Leaflet + Three.js. Green-on-black identity, zero decorative animation.

**3 Pages:**
- **Overview** — Threat index, globe, GCC intercepts, missile defense strip, threat feed
- **Operations** — Intel wire map (Leaflet) + flight tracker (OpenSky)
- **Analysis** — Charts (Recharts), prediction engine, regional panel, economic section

**Routing:** Hash-based lanes (`#overview`, `#operations`, `#analysis`). Operations and Analysis pages are lazy-loaded.

---

## 2. Data Pipeline Architecture

### 2.1 Core Pipeline (`useDataPipeline`)

Central data orchestrator. 60-second refresh cycle with health tracking.

| Endpoint | Payload | Schema Validated | Stale Threshold |
|----------|---------|-----------------|-----------------|
| `public/incidents.json` | Raw incidents array | Yes (Zod) | 5 min |
| `public/verified_incidents.json` | 187 verified groups with badges | Yes (Zod) | 5 min |
| `public/prices.json` | Brent, Gold, Gas, Bitcoin | Yes (Zod) | 5 min |
| `public/airspace.json` | NOTAMs, severity counts | Yes (Zod) | 5 min |

**Fetch pattern:** `fetch('public/x.json').catch(() => fetch('x.json'))` — dual-path for Vercel compatibility.

**Incident merge strategy:** Verified incidents take priority. Raw incidents deduplicated by title (case-insensitive). Verified groups are flattened — recap items (`is_recap: true`) are skipped.

**Health tracking:** Per-source status (`live` / `stale` / `offline`), consecutive failure counter, errors array, `lastSuccessfulFetch` timestamp.

**Zod schemas:** `src/lib/pipeline-schemas.ts` — runtime validation on all 4 endpoints. `safeParse()` logs failures and returns null gracefully.

### 2.2 Aircraft Tracking (`useOpenSky`)

| Field | Value |
|-------|-------|
| Proxy endpoint | `/api/aircraft` |
| Refresh | 30s |
| Staleness | 90s |
| Fallback | 17 demo flights (simulated drift) |
| Classification | Military/surveillance/cargo/commercial by callsign + ICAO category |

**Status:** `LIVE` → `STALE` → `OFFLINE` → `SIMULATED`

**Backend requirement:** The `/api/aircraft` proxy must exist. Currently expects OpenSky Network state vectors. If you're standing up the backend, this is the first endpoint to wire.

### 2.3 Satellite Tracking (`useSatellitePositions`)

SGP4 orbital propagation from TLE (Two-Line Element) data. **Zero external dependencies** — pure math engine.

| Field | Value |
|-------|-------|
| Refresh | 30s |
| Satellites tracked | 10 (NOAA-20, NOAA-21, METOP-B, ISS, Tianzhou-7, GPS BIIRM-7, BeiDou-3M3, Starlink-1007, Starlink-1008, USA-224) |
| Observer position | Gulf centre (lat 25, lon 54) |
| Min elevation | 5° above horizon |
| Engine | Simplified Keplerian (Newton-Raphson Kepler solver, 12 iterations, 1e-10 tolerance) |

**Pipeline:** TLE database → `parseTLE()` → `solveKepler()` → orbital plane → ECI → ECEF (via GMST) → geodetic lat/lng/alt → visibility filter → `TrackedObject` merge

**Files:**
- `src/data/satellite-tle.ts` — TLE database (10 real NORAD entries)
- `src/lib/satellite-sgp4.ts` — SGP4 engine (~200 lines)
- `src/hooks/useSatellitePositions.ts` — React hook (30s recomputation)

**Backend opportunity:** TLE data goes stale. A backend job fetching fresh TLEs from CelesTrak every 24h and serving them via `/api/tle.json` would keep orbital positions accurate.

### 2.4 Regional Stats

| Field | Value |
|-------|-------|
| Endpoint | `/data/regional_stats.json` |
| Refresh | 5 min |
| Fallback | "LOADING REGIONAL DATA..." |

### 2.5 Prediction Engine (Local)

Runs entirely client-side. No API dependency.

**4-stage pipeline:**
1. `normalizePredictionInputs` — Actor/target extraction, type weighting, 14-day window
2. `impactProfiler` — Bootstrap resampling (5000 iterations, xorshift128+ PRNG), severity percentiles, cascade risk
3. `sequenceModel` — Follow-on predictions, doctrine patterns, regional response
4. `buildPrediction` — Theatre threat level (weighted: 0.4×severity + 0.2×probSevere + 0.15×cascade + 0.15×airspace + 0.1×priceSignal)

**Minimum data:** 5+ events in 14-day window for computation. Falls back to demo incidents below threshold.

---

## 3. Backend Integration Points

### 3.1 Required Endpoints (Currently Static JSON)

These endpoints are currently served as static files in `public/`. A backend should generate them:

```
POST/GET  /api/incidents      → incidents.json structure
POST/GET  /api/verified       → verified_incidents.json structure
POST/GET  /api/prices         → prices.json structure
POST/GET  /api/airspace       → airspace.json structure
GET       /api/aircraft       → OpenSky proxy (already expected)
GET       /api/regional       → regional_stats.json structure
GET       /api/tle            → fresh TLE data (new, for satellite accuracy)
```

### 3.2 JSON Schemas

**incidents.json:**
```json
{
  "generated_at": "2026-03-17T16:00:00Z",
  "total_incidents": 42,
  "circuit_breaker_stats": { "total_processed": 100, "blocked": 5 },
  "incidents": [
    {
      "title": "Ballistic missile launch detected",
      "type": "missile",
      "source": "CENTCOM",
      "credibility": 92,
      "location": { "country": "Iran", "city": "Isfahan" },
      "casualties": { "military": 0, "civilian": 0 },
      "timestamp": "2026-03-17T15:30:00Z"
    }
  ]
}
```

**verified_incidents.json:**
```json
{
  "generated_at": "2026-03-14T08:25:00Z",
  "total_groups": 187,
  "verification_summary": {
    "VERIFIED": 45,
    "LIKELY": 78,
    "PARTIAL": 40,
    "UNCONFIRMED": 24
  },
  "groups": [
    {
      "title": "Strike on Abu Dhabi port",
      "badge": "VERIFIED",
      "verification_score": 94,
      "num_sources": 6,
      "is_recap": false,
      "incidents": [...]
    }
  ]
}
```

**prices.json:**
```json
{
  "generated_at": "2026-03-17T16:00:00Z",
  "prices": {
    "brent": { "price": 87.42, "change": 2.1, "formatted_change": "+2.1%", "updated_at": "..." },
    "gold": { "price": 2145.30, "change": -0.3, "formatted_change": "-0.3%", "updated_at": "..." },
    "gas": { "price": 3.82, "change": 0.5, "formatted_change": "+0.5%", "updated_at": "..." },
    "bitcoin": { "price": 68500, "change": 1.2, "formatted_change": "+1.2%", "updated_at": "..." }
  }
}
```

**airspace.json:**
```json
{
  "generated_at": "2026-03-17T16:00:00Z",
  "total_notams": 23,
  "severity_counts": { "WARNING": 5, "CRITICAL": 2, "ELEVATED": 8, "INFORMATION": 8 },
  "airports_tracked": 14,
  "notams": [
    {
      "id": "A0123/26",
      "airport": "OMDB",
      "severity": "WARNING",
      "text": "RWY 12L/30R closed due to military activity",
      "effective": "2026-03-17T00:00:00Z",
      "expires": "2026-03-18T00:00:00Z"
    }
  ]
}
```

### 3.3 Zod Validation

All payloads are validated at runtime via Zod schemas in `src/lib/pipeline-schemas.ts`. If the backend changes the shape, the frontend will log validation errors and gracefully degrade (null data, "NO LIVE DATA" messages). Schemas are the contract.

### 3.4 CORS & Proxy Notes

- OpenSky proxy (`/api/aircraft`) must handle CORS — OpenSky blocks browser-direct requests
- All other endpoints can be same-origin (Vercel rewrites) or CORS-enabled
- Frontend uses `AbortController` on aircraft fetches — backend should handle connection drops gracefully
- Cache headers: Frontend checks `X-Cache: STALE` header on aircraft data

---

## 4. Work Log — 48-Hour Engineering Session

### Batch 1 (Fixes 1–15)

| # | Fix | File(s) |
|---|-----|---------|
| 1 | Threat calc scoring engine | `src/lib/threat-calc.ts` |
| 2 | Kill chain tracker component | `src/components/missile/KillChainTracker.tsx` |
| 3 | SITREP text export | `src/lib/sitrep-export.ts` |
| 4 | Pipeline health in LeftRail | `src/components/hero/LeftRail.tsx` |
| 5 | SepBand pipeline wiring | `src/components/sep/SepBand.tsx` |
| 6 | Prediction engine (4-stage) | `src/lib/prediction/*` (4 files) |
| 7 | PredictorEngine UI | `src/components/predictor/PredictorEngine.tsx` |
| 8 | Analysis charts (Recharts) | `src/components/analysis/AnalysisSection.tsx` |
| 9 | Regional panel + endpoint | `src/components/regional/RegionalPanel.tsx` |
| 10 | Economic section pipeline | `src/components/economic/EconomicSection.tsx` |
| 11 | Missile defense strip wiring | `src/components/missile/MissileDefenseStrip.tsx` |
| 12 | Intel wire right panel | `src/components/intel/IwlRightPanel.tsx` |
| 13 | Error boundary | `src/components/shared/ErrorBoundary.tsx` |
| 14 | Page routing (3 lanes) | `src/lib/lane-routing.ts`, `src/App.tsx`, pages |
| 15 | Lazy loading operations/analysis | `src/App.tsx` |

### Batch 2 (Fixes 16–26)

| # | Fix | File(s) |
|---|-----|---------|
| 16 | FlightTracker → useOpenSky | `src/components/flight/FlightTracker.tsx` |
| 17 | Word-boundary regex (missile classification) | `src/components/missile/MissileDefenseStrip.tsx` |
| 18 | Honest "NO LIVE DATA" in AirspaceTab | `src/components/intel/AirspaceTab.tsx` |
| 19 | Verified incidents merge + dedup | `src/hooks/useDataPipeline.ts` |
| 20 | GCC intercepts from pipeline (not static) | `src/components/hero/RightRail.tsx`, `HeroGrid.tsx`, `OverviewPage.tsx` |
| 21 | rgba → CSS tokens | `src/components/intel/PosturingTab.tsx` |
| 22 | Visibility-based RAF pause (3 canvases) | `src/canvas/useGlobe.ts`, `useDrawMark.ts`, `useWaterfall.ts` |
| 23 | Honest "REFERENCE DATA" labels | `src/components/economic/EconomicSection.tsx` |
| 24 | Zod runtime schema validation | `src/lib/pipeline-schemas.ts` (new), `useDataPipeline.ts` |
| 25 | Word-boundary regex (remaining) | `src/components/sep/SepBand.tsx`, `IwlRightPanel.tsx` |
| 26 | Verification badges in feed + casualties | `src/components/feed/ThreatFeed.tsx`, `CasualtiesTab.tsx` |

### Satellite Port (from Gulf Watch upstream)

| # | What | File |
|---|------|------|
| S1 | TLE database (10 NORAD sats) | `src/data/satellite-tle.ts` (new) |
| S2 | SGP4 propagation engine | `src/lib/satellite-sgp4.ts` (new) |
| S3 | Satellite positions hook | `src/hooks/useSatellitePositions.ts` (new) |
| S4 | Tracking integration (replace fake sats) | `src/hooks/useTracking.ts` (modified) |

---

## 5. File Inventory

### New Files Created
```
src/lib/pipeline-schemas.ts          — Zod validation schemas for all endpoints
src/lib/satellite-sgp4.ts            — SGP4 orbital propagation (pure math, zero deps)
src/lib/threat-calc.ts               — Theatre threat scoring
src/lib/sitrep-export.ts             — SITREP text export
src/lib/prediction/                  — 4-stage prediction engine (4 files + types)
src/data/satellite-tle.ts            — NORAD TLE database
src/hooks/useSatellitePositions.ts   — SGP4 React hook
src/components/shared/ErrorBoundary.tsx
src/components/analysis/AnalysisSection.tsx
src/components/regional/RegionalPanel.tsx
src/components/predictor/PredictorEngine.tsx
src/components/missile/KillChainTracker.tsx
src/components/missile/WeaponIcon.tsx
docs/HADAL-AUDIT-2026-03-20.md      — This document
```

### Modified Files (Major Changes)
```
src/hooks/useDataPipeline.ts         — Verified incidents, Zod validation, health tracking
src/hooks/useTracking.ts             — SGP4 integration, removed fake satellites
src/components/flight/FlightTracker.tsx  — Wired to useOpenSky
src/components/hero/RightRail.tsx    — Pipeline-driven GCC intercepts
src/components/hero/LeftRail.tsx     — Verified intel status row
src/components/intel/AirspaceTab.tsx — Removed hardcoded data
src/components/economic/EconomicSection.tsx — Reference data labels
src/App.tsx                          — 3-lane routing, lazy loading, error boundary
```

---

## 6. Static Reference Data (in `src/data/`)

These files contain hardcoded scenario/reference data used for map overlays and fallbacks:

| File | Contents | Consumed By |
|------|----------|-------------|
| `map-events.ts` | Missile, intercept, airstrike, ground, combatant, diplomatic events | LeafletMap, IwlLeftPanel |
| `thaad-sites.ts` | THAAD battery positions & status | MissileCard, LeafletMap |
| `trajectories.ts` | Missile trajectory polylines | LeafletMap |
| `airspace-zones.ts` | Airspace polygons (open/closed) | LeafletMap |
| `postures.ts` | Escalation postures + diplomatic signals | PosturingTab |
| `gulf-economic.ts` | FX pairs + Dubai RE data | EconomicSection |
| `feed-data.ts` | Static threat feed entries | ThreatFeed (fallback) |
| `demo-flights.ts` | 17 simulated aircraft | useOpenSky (fallback) |
| `demo-incidents.ts` | Demo incidents | PredictorEngine, AnalysisSection (fallback) |
| `satellite-tle.ts` | 10 NORAD TLE sets | useSatellitePositions |

---

## 7. Refresh Intervals & Performance

| Source | Interval | Notes |
|--------|----------|-------|
| Data pipeline (incidents, prices, airspace, verified) | 60s | 4 parallel fetches |
| Aircraft (OpenSky) | 30s | Single fetch + abort controller |
| Satellites (SGP4) | 30s | Local computation only |
| Tracking sim (aircraft/maritime drift) | 10s | Client-side drift |
| Regional stats | 5min | Single fetch |
| UTC clock | 1s | Local |
| Signal monitor ticker | 3s | Local |

**Canvas performance:** Globe, DrawMark, and Waterfall hooks pause RAF when tab is hidden (Page Visibility API).

---

## 8. Remaining Work (Lower Priority)

1. **Leaflet marker clustering** — At scale (100+ incidents), markers will overlap. `leaflet.markercluster` would help.
2. **Hardcoded rgba cleanup** — 8 component files still use `rgba(196,255,44,...)` instead of CSS tokens.
3. **Threshold externalization** — Magic numbers (credibility thresholds, scoring weights) could move to a config file.
4. **Playwright tests** — Installed but unconfigured. E2E tests for critical paths (login, page navigation, data loading) would be valuable.
5. **TLE refresh endpoint** — Satellite TLEs go stale. Backend should serve fresh TLEs from CelesTrak.

---

## 9. Deployment

**Platform:** Vercel
**Build:** `tsc -b && vite build`
**Output:** `dist/`
**Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection (via `vercel.json`)
**Port (dev):** 5174

**Environment variables:** None required. All configuration is in-code.

---

## 10. Quick Start for Backend Engineer

```bash
# Clone & install
git clone https://github.com/masterblox/HADAL.git
cd HADAL
npm install

# Dev server
npm run dev
# → http://localhost:5174

# Type check
npx tsc --noEmit

# Production build
npm run build

# Access code (login gate): 0000
```

**Your first task:** Stand up the `/api/aircraft` proxy endpoint. The frontend already expects it at that path with OpenSky state vector format. Everything else falls back to static JSON gracefully.

**Contract:** All endpoint shapes are defined in `src/lib/pipeline-schemas.ts` (Zod schemas). Match those schemas and the frontend will consume your data automatically.
