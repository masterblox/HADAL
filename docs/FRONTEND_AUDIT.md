# FRONTEND AUDIT

## Active Shell Structure

- 3-lane shell is active.
- Routing is hash-based using `useSyncExternalStore` on `window.location.hash`.
- Valid lanes: `overview`, `operations`, `analysis`.
- No React Router.
- `?bypass` URL param skips the login gate.
- Operations and Analysis are `React.lazy()` loaded.
- Overview is inline in the main shell.

## Claimed Frontend Capabilities

- **4-endpoint data pipeline: REAL**
  - `useDataPipeline.ts` fetches incidents, verified incidents merge path, prices, airspace, and related fallbacks with 60s refresh and Zod validation.

- **OpenSky ADS-B aircraft tracking: REAL**
  - `useOpenSky.ts` fetches `/api/aircraft` every 30s.
  - Falls back to demo aircraft data when unavailable.

- **SGP4 satellite propagation: REAL**
  - `useSatellitePositions.ts` + `satellite-sgp4.ts` + TLE data are active.

- **Globe with incident markers: REAL**
  - Active runtime renders incident-driven markers on globe/canvas surfaces.

- **Leaflet tactical map: REAL**
  - Operations map renders live incidents plus static reference overlays.

- **Flight tracker with heading trails: REAL**
  - `FlightTracker.tsx` uses aircraft data and status badges.

- **Region-filtered threat feed: REAL**
  - Threat feed supports region filtering.
  - Verification/status display exists.
  - Static seed data is still mixed with live data.

- **Regional stats with country filter: REAL**
  - `RegionalPanel.tsx` fetches regional stats with its own refresh cycle and graceful fallback.

- **Analysis charts: REAL**
  - Recharts-based analysis/economic surfaces are active.

- **Prediction engine: PARTIAL**
  - Local heuristic prediction engine is active.
  - No external ML/service-backed intelligence layer.

- **SITREP export: REAL**
  - Runtime export/report generation exists in current app.

## Demo-Risk Surfaces

| Risk | Severity | Detail |
|---|---|---|
| Simulated tracking objects | **HIGH** | `useTracking` mixes simulated aircraft/maritime with real satellite-derived data. Biggest demo-risk surface if unlabeled in context. |
| OpenSky fallback to static/demo aircraft | **MEDIUM** | Honest status behavior exists, but map visuals can still look "real" to a casual viewer. |
| Casualties scenario table | **MEDIUM** | Static/scenario-heavy content remains visually strong even when labeled. |
| Static feed data mixed with live incidents | **MEDIUM** | Seed incidents and live incidents are not always visually separated. |
| Static reference overlays on map | **LOW** | Acceptable as reference data if understood as overlays. |
| Regional stats JSON freshness | **LOW** | Data freshness depends on last pushed JSON, not a live backend. |

## Production / Localhost Truth

- Dev server runs on `localhost:5174`.
- `/api/aircraft` is Vercel-serverless style and requires:
  - `OPENSKY_USERNAME`
  - `OPENSKY_PASSWORD`
- No CSP is configured in the active app runtime.
- Auth is client-side keypad only.
- `?bypass` skips the gate.
- Cache busting exists on pipeline fetches.
- Three.js is loaded for login/transition behavior.
- This is not production-hardened auth/security.

## Roadmap Alignment

**Present or partial now:**
- signal/data flow foundation
- confidence/trust-related display fields
- real-time feed + map integration
- local predictive flow
- partial reporting/export

**Not present yet:**
- unified Event → Signal → Entity model
- time replay
- watchlists / alerts
- actor fingerprinting
- causal graph
- intelligence compression
- formal escalation index
- anomaly detector
- analyst co-pilot
- decision mode

## Other-Repo Claim Alignment

- OpenSky/auth proxy: active in HADAL
- mobile country filter: partial / limited to specific surfaces
- mobile severity filter: missing
- layer toggle fixes: active
- prediction engine enhancements: active in local/front-end form
- VERIFIED government badges: active where verification metadata is rendered
- CSP removal: not a meaningful HADAL runtime item because CSP is not currently configured
- cache busting: active on pipeline fetches
- updated README: stale relative to active HADAL in places

## What Backend Should Assume Is Really Consumed

**Backend should assume the frontend currently consumes:**
- incidents
- verified incidents
- prices
- airspace
- regional stats
- aircraft proxy output
- existing verification/trust-related fields
- current static/live mixed tracking and map surfaces

**Backend should NOT assume the frontend currently consumes:**
- replay systems
- watchlists
- actor graph/fingerprinting
- decision mode
- co-pilot workflows
- anomaly detection
- unified event/signal/entity abstractions

## Final Verdict

The frontend is a real, functioning prototype with live data integration, not a pure mockup.

**What is solid:**
- active 3-lane shell
- real pipeline wiring
- real aircraft proxy integration
- real SGP4 satellite propagation
- real charting/prediction surfaces
- graceful degradation paths

**What is risky:**
- simulated tracking objects mixed with real context
- some static/live blending without strong visual separation
- stale README claims
- not production-hardened auth/security posture

**Most important demo caution:**
Do not let simulated tracking surfaces be described as fully real operational tracking without qualification.
