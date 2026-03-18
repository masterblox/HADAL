# HADAL Platform Plan

**Status:** Active — canonical macro architecture document
**Created:** 2026-03-18
**Supersedes:** None (extends HADAL_MACRO_PLAN.md and HADAL_BLUEPRINT.md)

This document defines the real platform architecture HADAL must grow into. It is grounded in the current repo state, not fantasy architecture.

Read this with:

- [SYSTEM_BOUNDARIES.md](SYSTEM_BOUNDARIES.md) — who owns what (Gulf Watch / HADAL / MIT)
- [HADAL_MACRO_PLAN.md](HADAL_MACRO_PLAN.md) — phase execution order
- [HADAL_BLUEPRINT.md](HADAL_BLUEPRINT.md) — 7-layer stack and pipeline principles

---

## Executive Summary

HADAL is a threat-intelligence terminal. It is not a dashboard. It is not a content site. It is an operational instrument for monitoring, analyzing, and predicting security events across the Middle East theatre.

The current repo has:

- A working React 19 frontend (~5,000 LOC) with a functional single-page terminal
- A 4-stage client-side prediction engine (pure math, no API)
- A Python ingestion pipeline (11 scripts, ~120K+ bytes) that produces JSON artifacts
- 2 serverless API endpoints (aircraft proxy, user reports)
- 224+ curated incidents with cross-source verification
- 8 Canvas 2D visualizations (globe, sonar, noise, etc.)
- Comprehensive architecture documentation (6 docs)

What is still prototype-level:

1. **Everything runs as one infinite scroll.** No routing. No page separation. No workspace isolation.
2. **Business logic lives in the browser.** The prediction engine, threat scoring, and normalization all run client-side. This is acceptable for v1 but blocks scale.
3. **Data contracts are implicit.** Types exist in TypeScript but there are no versioned schemas, no contract tests, no artifact validation.
4. **Static data masquerades as live data.** `gcc-data.ts`, `feed-data.ts`, `postures.ts`, `trajectories.ts` are hardcoded arrays that never update.
5. **No authentication, no roles, no audit trail.** Login is decorative. There is no concept of who sees what.
6. **No operational observability.** If a feed goes stale, if prices stop updating, if the circuit breaker produces bad output — nobody knows.

---

## 1. Product Architecture

### 1.1 Product Lanes

HADAL separates into three product lanes (confirmed from HADAL_MACRO_PLAN.md):

| Lane | Question | Owner |
|------|----------|-------|
| **Overview** | What is happening now? | Hero, MissileStrip, condensed Feed |
| **Operations** | Where is it and what is active? | Map workspace, Airspace, Casualties, Posturing |
| **Analysis** | What does it mean? What next? | Prediction, Economics, Reporting, Exports |

This is not a suggestion. This is the product model. All new work must land in one of these three lanes.

### 1.2 Shell vs Workspace

The **shell** is global. It owns:

- Topbar (brand, alerts, clock, pressure gauge, sandbox toggle)
- Navigation between lanes
- Global data fetching (useDataPipeline)
- Login/auth gate

The **workspace** is lane-specific. Each lane renders its own workspace inside the shell. Workspaces do not share DOM layout. They may share data through the shell's data context.

### 1.3 Future Surfaces

These surfaces do not exist yet. They are planned slots, not speculative features.

| Surface | Lane | Purpose | Dependency |
|---------|------|---------|------------|
| **Alert Rules** | Operations | User-defined thresholds and notifications | Requires auth + persistence |
| **Report Builder** | Analysis | Structured SITREP generation and export | Requires artifact contracts |
| **Historical Archive** | Analysis | Search and trend analysis on past data | Requires backend time-series |
| **Admin/Config** | Shell | User management, source management, pipeline health | Requires auth + roles |
| **Co-Pilot** | Shell | Contextual AI assistant (MIT pattern) | Requires API key management |

Do not build these before the 3-lane routing exists.

---

## 2. Data Architecture

### 2.1 Current Pipeline

```
Sources (48+)
  → fetch_rss.py (RSS ingestion)
  → fetch_prices.py (commodity prices)
  → fetch_airspace.py (NOTAMs)
  → coordinate_extractor.py (geocoding)
  → circuit_breaker.py (deduplication)
  → cross_source_verification.py (confidence scoring)
  → generate_regional_stats.py (aggregation)
  → public/*.json (artifact output)
  → HADAL React frontend (rendering client)
```

This pipeline exists and works. It produces `incidents.json`, `prices.json`, `airspace.json`, and `data/regional_stats.json`.

### 2.2 Pipeline Stages (Canonical)

| Stage | Script(s) | Input | Output | Runs |
|-------|-----------|-------|--------|------|
| **Ingestion** | `fetch_rss.py`, `fetch_prices.py`, `fetch_airspace.py` | External RSS/API | Raw records | Cron / GitHub Actions |
| **Normalization** | Built into `fetch_rss.py` | Raw records | Typed event objects | Same run |
| **Deduplication** | `circuit_breaker.py` | All events | Unique events + report_status.json | Same run |
| **Verification** | `cross_source_verification.py` | Unique events | Events with confidence/badges | Same run |
| **Enrichment** | `coordinate_extractor.py` | Verified events | Events with lat/lon + precision | Same run |
| **Aggregation** | `generate_regional_stats.py` | Enriched events | Per-country rollups | Same run |
| **Export** | End of pipeline | All processed data | public/*.json files | Same run |

### 2.3 What Must NOT Be in the Browser

| Logic | Current Location | Correct Location | Why |
|-------|-----------------|-------------------|-----|
| Incident normalization | `src/lib/prediction/normalizePredictionInputs.ts` (140 LOC) | Pipeline (scripts/) | Normalization rules should be authoritative, not duplicated |
| Severity scoring | `src/lib/threat-calc.ts` (18 LOC) | Pipeline output field | Score once, serve everywhere |
| Cascade risk clustering | `src/lib/prediction/impactProfiler.ts` (215 LOC) | Pipeline or API | Expensive computation, deterministic — should not re-run per page load |
| Scenario generation | `src/lib/prediction/sequenceModel.ts` (192 LOC) | Acceptable in browser for v1 | Low-frequency user action, not a pipeline concern yet |

**Rule:** If a computation produces the same result for all users viewing the same data, it belongs in the pipeline, not the browser.

### 2.4 Artifact Contracts

Every JSON artifact is a contract. Breaking a contract breaks the frontend.

#### incidents.json

```typescript
interface IncidentArtifact {
  version: 1
  generated: string           // ISO 8601
  pipeline_run: string        // Run ID for traceability
  count: number
  incidents: Incident[]
}

interface Incident {
  id: string                  // Stable, deterministic
  title: string
  type: 'missile' | 'airstrike' | 'drone' | 'ground' | 'naval' | 'security' | 'alert' | 'general'
  source: string
  source_url?: string
  credibility: number         // 0-100
  verification: 'verified' | 'likely' | 'partial' | 'unconfirmed'
  status: string
  is_government: boolean
  published: string           // ISO 8601
  severity: 'critical' | 'high' | 'medium' | 'low'
  severity_score: number      // 0-100 (computed by pipeline)
  location: {
    lat: number
    lng: number
    country: string
    label?: string
    precision: 'exact' | 'city' | 'region' | 'country' | 'fallback'
  }
  casualties?: {
    military: number
    civilian: number
  }
}
```

#### prices.json

```typescript
interface PricesArtifact {
  version: 1
  generated: string
  brent: { price: number; change: number; change_pct: number; updated_at: string }
  gold: { price: number; change: number; change_pct: number; updated_at: string }
  gas: { price: number; change: number; change_pct: number; updated_at: string }
  bitcoin: { price: number; change: number; change_pct: number; updated_at: string }
}
```

#### airspace.json

```typescript
interface AirspaceArtifact {
  version: 1
  generated: string
  total_notams: number
  severity_counts: Record<string, number>
  airports_tracked: number
  notams: Array<{
    country: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    type: string
    valid_until?: string
    description?: string
  }>
}
```

**Rule:** All artifacts include `version` and `generated` fields. If a field is added, `version` increments. If a field changes type or is removed, `version` increments and the frontend migration is documented.

### 2.5 Static Data Inventory

These files are hardcoded TypeScript arrays in `src/data/`. They do not update at runtime.

| File | Records | Status | Path Forward |
|------|---------|--------|-------------|
| `feed-data.ts` | 30 incidents | **STALE** — Feb 28 era | Should be removed once live pipeline is stable. Keep only as unit test fixtures. |
| `gcc-data.ts` | 4 countries | **STALE** — hardcoded casualty counts | Should be derived from `regional_stats.json` pipeline output |
| `thaad-sites.ts` | 5 sites | **STATIC** — reference data | Acceptable as reference. Could move to `public/data/thaad.json` |
| `trajectories.ts` | 8 paths | **STATIC** — display geometry | Acceptable. Visual reference, not intelligence. |
| `airspace-zones.ts` | 6 polygons | **STATIC** — display geometry | Acceptable. Map overlay geometry, not live status. |
| `gulf-economic.ts` | 15 data points | **STALE** — should come from prices pipeline | Should be replaced by `prices.json` consumption |
| `postures.ts` | 16 entries | **STALE** — manual entries | Should eventually come from an ingestion source or operator input |
| `demo-incidents.ts` | Array | **TEST** — predictor stub | Keep for testing only |
| `map-events.ts` | Handlers | **ACTIVE** — used by LeafletMap | Code, not data. Fine where it is. |

**Rule:** No static data file should be the source of truth for anything that has a pipeline equivalent. When the pipeline produces a replacement, delete the static file.

---

## 3. Frontend Architecture

### 3.1 Current Shape

```
App.tsx (orchestrator)
  ├── LoginPage (decorative auth)
  └── terminal-root
      ├── Topbar
      └── terminal (linear scroll)
          ├── HeroGrid (resizable 3-panel)
          ├── MissileDefenseStrip (resizable 5-panel)
          ├── SepBand
          ├── ThreatFeed
          ├── IntelWireSection (resizable 3-panel + 4 tabs)
          ├── RegionalPanel
          ├── PredictorEngine
          ├── AnalysisSection
          └── EconomicSection
```

**Problems:**

1. No routing — everything is one scroll.
2. `App.tsx` passes props manually through the entire tree. No context, no store.
3. `useDataPipeline` fires in `App.tsx` and results flow down through 3+ levels of props.
4. `IntelWireSection` is already a full application page crammed inside a section.
5. `PredictorEngine` runs a 400+ LOC math engine on every render cycle.

### 3.2 Target Shape

```
App.tsx (shell)
  ├── DataProvider (context: incidents, prices, airspace)
  ├── AuthGate (login / bypass)
  ├── Shell
  │   ├── Topbar
  │   └── Router
  │       ├── /overview → OverviewPage
  │       │   ├── HeroGrid
  │       │   ├── MissileDefenseStrip
  │       │   ├── SepBand
  │       │   └── ThreatFeed (condensed)
  │       │
  │       ├── /operations → OperationsPage
  │       │   └── IntelWireSection (full workspace)
  │       │       ├── Map tab
  │       │       ├── Airspace tab
  │       │       ├── Casualties tab
  │       │       └── Posturing tab
  │       │
  │       └── /analysis → AnalysisPage
  │           ├── PredictorEngine
  │           ├── RegionalPanel
  │           ├── AnalysisSection
  │           └── EconomicSection
  │
  └── CoPilot (future — sticky widget)
```

### 3.3 Module Ownership Rules

| Module | Page | Can be shared? | Reason |
|--------|------|----------------|--------|
| `Topbar` | Shell | Yes — always visible | Global navigation, alerts, clock |
| `HeroGrid` | Overview | No | Overview-specific orientation |
| `MissileDefenseStrip` | Overview | Summary on Overview, drill-down on Operations | Two rendering modes |
| `ThreatFeed` | Overview (condensed), Operations (full) | Yes — two render modes | Core surface, used in two contexts |
| `IntelWireSection` | Operations | No — full workspace | Too complex for embedding |
| `PredictorEngine` | Analysis | No | Heavy computation, dedicated page |
| `EconomicSection` | Analysis | No | Secondary context, not overview material |
| `RegionalPanel` | Analysis | No | Per-country drill-down |
| `AnalysisSection` | Analysis | No | Charts and trend analysis |

### 3.4 What Logic Stays in the Browser

| Logic | Browser? | Reason |
|-------|----------|--------|
| Map rendering (Leaflet) | Yes | Interactive visualization |
| Canvas rendering (Globe, Sonar) | Yes | Animation, interaction |
| Feed filtering (region, type) | Yes | UI-local, instant feedback |
| Tab switching | Yes | Navigation state |
| Resizable panel layout | Yes | User preference |
| Scenario builder UI | Yes | Input form state |
| Sparkline generation | Yes | Simple derived visual |
| UTC clock | Yes | Browser timer |

### 3.5 What Logic Must Move Out

| Logic | Current | Target | When |
|-------|---------|--------|------|
| Incident normalization | Browser (normalizePredictionInputs.ts) | Pipeline (scripts/) | Phase 3 |
| Severity scoring | Browser (threat-calc.ts) | Pipeline output field | Phase 3 |
| Bootstrap statistics (percentiles) | Browser (impactProfiler.ts) | Pipeline or API | Phase 4 |
| Cascade risk detection | Browser (impactProfiler.ts) | Pipeline or API | Phase 4 |
| Full prediction generation | Browser (buildPrediction.ts + sequenceModel.ts) | API endpoint | Phase 5 |

### 3.6 State Management

**Current:** Props drilling from `App.tsx` through 3+ levels.

**Target:** React context for data, local state for UI.

```typescript
// DataContext provides pipeline artifacts
interface DataContextValue {
  incidents: Incident[]
  prices: PricesArtifact | null
  airspace: AirspaceArtifact | null
  lastFetch: number
  isStale: boolean               // true if last fetch > 120s ago
  error: string | null
}

// PredictionContext provides computed predictions (Analysis page only)
interface PredictionContextValue {
  result: PredictionResult | null
  isComputing: boolean
  lastComputed: number
}
```

UI-local state (not context):
- Active tab, selected country, map layer visibility
- Scenario builder form values
- Sandbox mode toggle
- Panel resize positions

---

## 4. Operational Architecture

### 4.1 Data Refresh Cadence

| Data | Source | Cadence | Stale After |
|------|--------|---------|-------------|
| Incidents | Pipeline → `incidents.json` | Every 60s (client poll) | 120s |
| Prices | Pipeline → `prices.json` | Every 60s (client poll) | 300s (5min) |
| Airspace | Pipeline → `airspace.json` | Every 60s (client poll) | 600s (10min) |
| Regional stats | Pipeline → `regional_stats.json` | On demand | 3600s (1hr) |
| Pipeline run | GitHub Actions / cron | Every 15 min | N/A |

### 4.2 Stale Data Behavior

The UI must indicate when data is stale.

| Condition | Indicator | Location |
|-----------|-----------|----------|
| Last fetch > 120s | `STALE` badge on Topbar | Topbar status area |
| Fetch error | `OFFLINE` badge + last-known timestamp | Topbar status area |
| Pipeline generated > 30min ago | `DELAYED` badge on feed | ThreatFeed header |
| Prices older than 5min | Dim the price values | EconomicSection |

**Rule:** If data is stale, show last-known data with a visible stale indicator. Never show empty state unless there has never been a successful fetch.

### 4.3 Fallback Hierarchy

```
1. Fresh fetch from public/*.json     → LIVE state
2. Previous fetch still in memory     → STALE state (show indicator)
3. No previous fetch available        → FALLBACK state (show static data + warning)
4. Static data files (src/data/)      → DEMO state (explicit "DEMO MODE" label)
```

### 4.4 Failure Modes

| Failure | Impact | Response |
|---------|--------|----------|
| CDN down | No data refresh | Retain last fetch, show STALE |
| Pipeline crash | Stale JSON on CDN | Stale indicator after timestamp check |
| Bad JSON response | Parse error | Retain last fetch, log error |
| Leaflet tiles fail | Grey map | Show fallback message in map area |
| Canvas crash | Blank canvas area | Error boundary, render placeholder |
| Browser tab inactive | setInterval paused | Resume fetch on focus |

### 4.5 Auditability

Every data surface must be traceable:

| Field | Purpose | Location |
|-------|---------|----------|
| `generated` timestamp | When pipeline produced this data | Every artifact |
| `pipeline_run` ID | Which run produced this data | `incidents.json` header |
| `source` per incident | Where each incident came from | Incident object |
| `verification` status | How confident we are | Incident object |
| `precision` level | How exact the coordinates are | Location object |
| `lastFetch` timestamp | When the browser last fetched | DataContext |

---

## 5. Governance Architecture

### 5.1 Data Trust Tiers

| Tier | Label | Meaning | UI Treatment |
|------|-------|---------|-------------|
| **Verified** | `VERIFIED` | Multiple independent sources confirm | Full opacity, green confidence badge |
| **Likely** | `LIKELY` | Two sources agree OR official + news | Full opacity, blue badge |
| **Partial** | `PARTIAL` | Single source OR minor discrepancies | Reduced opacity, yellow badge |
| **Unconfirmed** | `UNCONFIRMED` | Single unverified source | Reduced opacity, grey badge |
| **Inferred** | `INFERRED` | Model-derived (prediction output) | Dashed border, italic label, explicit "MODEL" tag |
| **Operator** | `OPERATOR` | Manually entered by an operator | Distinct icon, operator attribution |

**Rule:** Verified intelligence and model-derived predictions must never look the same in the UI. An analyst must be able to tell at a glance whether something is confirmed or inferred.

### 5.2 Data Sensitivity

| Category | Visibility | Example |
|----------|-----------|---------|
| **Public** | All users | Published incidents, commodity prices |
| **Restricted** | Authenticated users | Full incident detail, coordinates, source URLs |
| **Internal** | Operators only | Pipeline health, circuit breaker stats, raw source data |
| **Admin** | System admin | User management, API keys, source configuration |

**Current state:** Everything is public. There is no auth, no roles, no access control.

**Phase 2 target:** Auth gate with bypass for development. Public/Restricted split.

**Phase 5 target:** Full role matrix with Internal/Admin separation.

### 5.3 Prediction Governance

Predictions are not intelligence. They are model outputs.

**Rules:**

1. All prediction outputs must carry `generated` timestamp and `model_version`.
2. All prediction outputs must be labeled `MODEL-DERIVED` in the UI.
3. Prediction confidence must never use the same visual language as source verification confidence.
4. Prediction scenarios must show their input data window (e.g., "based on 224 events, Feb 28 – Mar 18").
5. No prediction should be exportable in the same format as verified intelligence without an explicit distinction field.

### 5.4 Review and Logging

| Event | Log? | Where |
|-------|------|-------|
| Pipeline run | Yes | Pipeline output metadata |
| Fetch error | Yes | Browser console + future telemetry |
| Prediction computation | Yes | Browser console (dev), future API log |
| User report submission | Yes | `api/report.py` |
| Login / bypass | Yes | Future auth system |
| Export / download | Yes | Future audit trail |

---

## 6. Phased Implementation Sequence

### Phase 0: Stabilize (Current)

**Status:** In progress.

- [x] Font system consolidated (3 body tiers)
- [x] JP aesthetic toolkit integrated
- [x] Responsive breakpoints added
- [x] Architecture docs written
- [ ] Stop adding sections to the scroll

**Exit:** No more linear scroll additions. App.tsx is frozen until routing exists.

### Phase 1: Page Shell + Routing

**Dependency:** Phase 0 complete.

Tasks:

1. Add `react-router-dom` (or hash-based routing for static deploy)
2. Create `ShellLayout` component (Topbar + content area)
3. Create 3 page components: `OverviewPage`, `OperationsPage`, `AnalysisPage`
4. Move `useDataPipeline` into a `DataProvider` context
5. Update Topbar with lane navigation (3 nav items, active state)
6. Default route: `/overview`
7. `?bypass` still works for auth skip

Files created:

```
src/
  pages/
    OverviewPage.tsx
    OperationsPage.tsx
    AnalysisPage.tsx
  contexts/
    DataContext.tsx
  layouts/
    ShellLayout.tsx
```

Files modified:

```
src/App.tsx          — becomes shell + router
src/components/topbar/Topbar.tsx  — adds nav items
```

**Exit:** HADAL has 3 URL-addressable pages with shared shell. All existing functionality preserved.

### Phase 2: Extract Operations

**Dependency:** Phase 1 complete.

Tasks:

1. Move `IntelWireSection` + all intel/ components to `OperationsPage`
2. Remove `IntelWireSection` from the overview scroll
3. Add `RegionalPanel` to `OperationsPage` as a secondary panel (or keep on Analysis)
4. Test: Operations page loads independently, map works, tabs work, layers work

**Exit:** The map workspace has its own page. Overview is shorter and cleaner.

### Phase 3: Artifact Contracts + Pipeline Hardening

**Dependency:** Phase 1 complete. Can run parallel to Phase 2.

Tasks:

1. Add `version` and `generated` fields to all pipeline JSON outputs
2. Define TypeScript artifact interfaces in `src/types/artifacts.ts`
3. Add `severity_score` as a pipeline-computed field on incidents (move from browser)
4. Remove browser-side severity scoring (`threat-calc.ts` → consume pipeline field)
5. Add artifact freshness check to `useDataPipeline` → expose `isStale` flag
6. Add `STALE` / `OFFLINE` indicators to Topbar

Files created:

```
src/types/
  artifacts.ts       — canonical artifact interfaces
  enums.ts           — severity, event_type, verification enums
```

Files modified:

```
scripts/fetch_rss.py                — add version/generated to output
scripts/fetch_prices.py             — add version/generated to output
scripts/fetch_airspace.py           — add version/generated to output
src/hooks/useDataPipeline.ts        — add staleness detection
src/components/topbar/Topbar.tsx    — add stale indicator
```

**Exit:** Artifact contracts are explicit. Freshness is visible. Browser no longer duplicates pipeline logic.

### Phase 4: Prediction Foundation (Server-Ready)

**Dependency:** Phase 3 complete.

Tasks:

1. Extract normalization logic from browser to pipeline (or new API endpoint)
2. Move bootstrap statistics (percentiles, cascade risk) to pipeline output
3. Create `public/data/prediction_inputs.json` artifact:
   - Pre-computed normalized events
   - Pre-computed bootstrap profile
   - Pre-computed cascade risk score
4. Simplify browser prediction to: read pre-computed inputs → run scenario model only
5. Wire prediction inputs into `AnalysisPage`

**Exit:** Prediction engine is lighter in the browser. Heavy computation runs in the pipeline.

### Phase 5: Auth + Roles + Reporting

**Dependency:** Phase 2 + Phase 3 complete.

Tasks:

1. Replace decorative login with real auth (Supabase / Clerk / custom)
2. Define roles: `public`, `analyst`, `operator`, `admin`
3. Gate restricted data behind auth
4. Build report/export workflow in Analysis page
5. Add audit logging for exports and predictions

**Exit:** HADAL has real authentication and role-based data access.

### Phase 6: Advanced Systems

**Dependency:** Phase 4 + Phase 5 complete.

Tasks:

1. Move full prediction engine to API endpoint
2. Add alert rules system (user-defined thresholds)
3. Add historical archive / time-series queries
4. Add Co-Pilot widget (MIT pattern, Anthropic API)
5. Add admin surface for pipeline health monitoring

**Exit:** HADAL is a full platform, not a prototype.

---

## 7. Anti-Patterns — Do Not Do This

### Do not add more sections to the scroll

The current `App.tsx` is a linear stack of 9 sections. Adding a 10th, 11th, or 12th section without routing makes the problem worse. Stop.

### Do not build backend services before artifact contracts exist

If the JSON output shape is not documented and versioned, adding a "real API" just moves the chaos to a different layer.

### Do not duplicate pipeline logic in the browser

If `severity_score` is computed in the pipeline AND re-computed in the browser, they will diverge. One source of truth per computation.

### Do not use model output as intelligence

Prediction scenarios are not verified events. They must never share the same UI card design, color coding, or export format as confirmed incidents.

### Do not build auth as decoration

The current login page accepts `0000` and has a `?bypass` param. If auth is added, it must be real. Decorative auth is worse than no auth because it creates false security assumptions.

### Do not create "enterprise architecture" abstractions ahead of need

No event bus. No state machine library. No GraphQL. No monorepo tooling. Use React context, plain fetch, and file-based routing until the actual complexity demands more.

### Do not split globals.css into CSS modules

The 1,600-line globals.css is the design system. Splitting it into per-component CSS modules would destroy the token system and create 44 files of duplicated custom properties. Keep it global. Organize it by section comments.

### Do not introduce Three.js for new visualizations

Three.js is in `package.json` as a legacy dependency from MIT. HADAL uses Canvas 2D exclusively. New visualizations use `src/canvas/use*.ts` hooks. Remove Three.js when cleaning up dependencies.

---

## 8. Dependency Map

```
Phase 0 (Stabilize)
  ↓
Phase 1 (Page Shell + Routing)
  ↓                        ↓
Phase 2 (Extract Ops)    Phase 3 (Artifact Contracts)
  ↓                        ↓
  ↓← ← ← ← ← ← ← ← ← ← ↓
  ↓
Phase 4 (Prediction Foundation)
  ↓
Phase 5 (Auth + Roles)
  ↓
Phase 6 (Advanced Systems)
```

Phases 2 and 3 can run in parallel. Everything else is sequential.

---

## 9. File Inventory — What Exists vs What Is Needed

### Exists (Keep)

| Path | Purpose | Status |
|------|---------|--------|
| `src/components/` (44 files) | Domain-grouped UI components | Production |
| `src/canvas/` (8 files) | Canvas 2D visualizations | Production |
| `src/hooks/` (8 files) | Data fetching + UI hooks | Production (some theatrical) |
| `src/lib/prediction/` (6 files) | 4-stage prediction engine | Production (browser-side, needs extraction) |
| `src/globals.css` | Complete design system | Production |
| `scripts/` (11 files) | Python ingestion pipeline | Production |
| `api/` (2 files) | Serverless endpoints | Production |
| `public/*.json` | Runtime data artifacts | Production |
| `docs/architecture/` (6 files) | Architecture documentation | Active |

### Exists (Phase Out)

| Path | Reason | Replace With |
|------|--------|-------------|
| `src/data/feed-data.ts` | Stale hardcoded incidents | Pipeline output |
| `src/data/gcc-data.ts` | Stale hardcoded missile stats | `regional_stats.json` |
| `src/data/gulf-economic.ts` | Stale hardcoded economic data | `prices.json` |
| `src/data/postures.ts` | Stale manual entries | Future ingestion source |
| `src/lib/threat-calc.ts` | Duplicates pipeline scoring | Pipeline `severity_score` field |
| `three` (package.json) | Unused legacy dependency | Remove |
| `lucide-react` (package.json) | Unused icon library | Remove |

### Does Not Exist (Create)

| Path | Purpose | Phase |
|------|---------|-------|
| `src/pages/OverviewPage.tsx` | Overview lane | 1 |
| `src/pages/OperationsPage.tsx` | Operations lane | 1 |
| `src/pages/AnalysisPage.tsx` | Analysis lane | 1 |
| `src/contexts/DataContext.tsx` | Shared data provider | 1 |
| `src/layouts/ShellLayout.tsx` | Global shell wrapper | 1 |
| `src/types/artifacts.ts` | Artifact type contracts | 3 |
| `src/types/enums.ts` | Canonical enum definitions | 3 |

---

## 10. Success Criteria

HADAL is a platform, not a prototype, when:

1. An analyst can open `/operations` and immediately see the map workspace without scrolling past the hero section.
2. A prediction output is visually distinct from verified intelligence at a glance.
3. The frontend never re-computes something the pipeline already computed.
4. Every data value on screen can be traced to a source, a pipeline run, and a freshness timestamp.
5. An engineer can add a new data source without touching the React frontend.
6. A page can crash without taking down the other two pages.
7. Stale data is visible. Missing data is visible. Demo data is labeled.

---

## Appendix: Canonical Reference

| Document | Role |
|----------|------|
| **HADAL_PLATFORM_PLAN.md** (this file) | Macro architecture and implementation sequence |
| **SYSTEM_BOUNDARIES.md** | Gulf Watch / HADAL / MIT ownership model |
| **HADAL_MACRO_PLAN.md** | Phase execution order (aligned with this plan) |
| **HADAL_BLUEPRINT.md** | 7-layer pipeline stack and principles |
| **HADAL_PAGE_ARCHITECTURE.md** | 3-page product model and extraction map |
