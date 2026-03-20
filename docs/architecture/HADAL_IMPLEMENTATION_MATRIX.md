# HADAL Implementation Matrix

**Status:** Active — execution mapping document
**Created:** 2026-03-18
**Last synced:** 2026-03-18 (v0.5.2, commit `3cb8bf8`)
**Grounded in:** Commit `fbe42f1` (reference hierarchy) and commit `15535cc` (platform plan)
**Reads with:** [HADAL_PLATFORM_PLAN.md](HADAL_PLATFORM_PLAN.md), [HADAL_REFERENCE_HIERARCHY.md](HADAL_REFERENCE_HIERARCHY.md), [HADAL_PAGE_ARCHITECTURE.md](HADAL_PAGE_ARCHITECTURE.md)

This document maps the current runtime codebase against the established HADAL architecture. It is not another architecture document. It is an execution matrix: what exists, what it actually does, what data backs it, and what happens to it next.

---

## 1. Executive Summary

The HADAL frontend has **56 runtime files** (26 components, 9 data files, 8 hooks, 7 canvas hooks, 6 lib/utils).

Of these:

- **6 components** consume live Gulf Watch pipeline data (incidents.json, prices.json, airspace.json, regional_stats.json)
- **15 components** display hardcoded numbers presented as operational intelligence
- **7 hooks/canvas** generate procedural data (random signals, simulated tracking, noise) with no real source

The core problem: **the majority of the app's visual authority comes from hardcoded or procedural data, not from Gulf Watch's pipeline.** The pipeline produces real, verified incident data — but most of the terminal's impressive-looking surfaces ignore it in favor of inline constants.

### Data Authority Breakdown

| Data Type | Component Count | Examples |
|-----------|:-:|---------|
| **Gulf Watch live** | 6 | ThreatFeed, EconomicSection, AnalysisSection, PredictorEngine, RegionalPanel, AirspaceTab |
| **Gulf Watch fallback** | 4 | ThreatFeed (feedData), AnalysisSection (demoIncidents), PredictorEngine (demoIncidents), EconomicSection (static prices) |
| **Hardcoded as live** | 15 | MissileDefenseStrip, CasualtiesTab, LeftRail, KillChainTracker, SepBand, IwlLeftPanel, IwlRightPanel, class-banner |
| **Procedural/simulated** | 7 | useTracking, useSignalMonitor, useSonar, useWaterfall, usePressureGauge |
| **Pure aesthetic** | 5 | useNoiseCanvas, useSepStatic, useDrawMark, SonarParticles, useGlobe |

---

## 2. Full Implementation Matrix

### 2.1 Shell & Navigation

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `App.tsx` | 3-lane router shell | Composition + hash routing | Real (structure) | Gulf Watch | **Done** | Shell | — | Router shell with lane-routing, lazy-loaded Operations/Analysis. Login gate → NucleusTransition → terminal reveal. |
| `LoginPage.tsx` | Decorative keypad gate | Hardcoded (code='0000') | Fake | — | **Keep temp** | Shell | P3 | Decorative auth. Real auth is Phase 6 per platform plan. Keep as atmospheric gate until then. |
| `SonarParticles.tsx` | Three.js login background | Procedural | Aesthetic | — | **Keep** | Shell | — | Pure atmosphere. No data claims. |
| `Topbar.tsx` | Top nav bar | Computed (clock, pressure) | Mixed | Ground Station | **Adapt** | Shell (global) | P1 | Clock is real (UTC). Pressure gauge is aesthetic. "OP. EPIC FURY" is hardcoded. Stats (DEPTH: 10,924M) are cosplay. See §3.1. |
| Class banner (in App.tsx) | Classification strip + threat gauge | Hardcoded (91%) | **Fake** | — | **Connect** | Shell | P1 | Threat level 91% is hardcoded inline. Must connect to prediction engine's `theatreThreatLevel` output. See §4.1. |

### 2.2 Hero Section (Overview)

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `HeroGrid.tsx` | Layout container | Composition | Real | — | **Keep** | Overview | — | Pure layout. |
| `LeftRail.tsx` | Branding + threat index + SPECIAL stats + system status | Hardcoded | **Fake** | Ground Station (cosplay) | **Adapt** | Overview | P1 | Threat index 91 = hardcoded. SPECIAL stats (S:09, P:07...) = Fallout RPG reference with no data source. System status dots = hardcoded on/off. See §3.2. |
| `GlobeView.tsx` | 3D globe with Iran highlight | Static (continents, markers) | Aesthetic | — | **Keep** | Overview | — | Visual identity piece. Markers are static but serve orientation, not intelligence claims. |
| `RightRail.tsx` | Sonar + signal monitor + waterfall + GCC intercepts | Mixed | **Mostly fake** | Shadowbroker (cosplay) | **Adapt** | Overview | P2 | Sonar/signal/waterfall are procedural noise. GCC intercepts from gcc-data.ts are static. See §3.3. |

### 2.3 Missile / Kinetic Section (Overview)

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `MissileDefenseStrip.tsx` | 5-card kinetic summary | Hardcoded inline | **Fake** | Gulf Watch (concept) | **Connect** | Overview | P1 | UAE 165, Kuwait 97, Qatar 18, Bahrain 45 — all hardcoded. Aggregate row (325 ballistic, 833 drones) — hardcoded. Must derive from incidents.json or be labeled DEMO. See §4.2. |
| `MissileCard.tsx` | Individual country kinetic card | Props (from Strip) | **Fake** | MIT (kage pattern) | **Adapt** | Overview | P1 | Card component is well-built. Problem is data, not UI. |
| `KillChainTracker.tsx` | 5 engagement records | Hardcoded inline | **Fake** | Ground Station (cosplay) | **Postpone** | Operations (future) | P3 | 5 hardcoded kill chains (KC-0041 etc). Impressive UI but zero data pipeline behind it. Move to Operations when real engagement tracking exists. Not imported in App.tsx currently — already dormant. |
| `WeaponIcon.tsx` | SVG weapon icons | None | Real (utility) | — | **Keep** | — | — | Pure SVG rendering. |

### 2.4 Separator

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `SepBand.tsx` | Grey noise separator with pipeline stats | Live (incidents) | **Real** | — | **Done** | Overview | — | Redesigned in v0.5.2. Uses `useNoiseCanvas` (grayscale). Shows live intercept count, tracked events, countries from pipeline. Falls back to "AWAITING FEED" when no data. Old decorative layers (birdmissile SVG, jp-depth, gradients) removed. |

### 2.5 Feed Section (Overview)

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `ThreatFeed.tsx` | Incident feed table | **Live** (incidents) + static fallback (feedData) | **Real** | Gulf Watch | **Keep** | Overview (condensed) + Operations (full) | P0 | Core Gulf Watch surface. Live incidents from pipeline. Static feedData (14 items) used as supplement. Region tabs work. This is the strongest real component. |

### 2.6 Intel / Operations Section

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `IntelWireSection.tsx` | Operations workspace container | Composition + state | Real (structure) | Gulf Watch | **Move** | Operations | P0 | Already functions as a page. Must become the Operations page per HADAL_PAGE_ARCHITECTURE. |
| `IwlNav.tsx` | Intel section nav | None | Real (UI) | MIT | **Keep** | Operations | — | Tab navigation. "MARIANA TRENCH VIEWER" title should update. |
| `IwlLeftPanel.tsx` | Layer toggles | Static (map-events.ts counts) | **Static** | Shadowbroker (aspiration) | **Adapt** | Operations | P2 | Toggle UI is real. Dead icon field removed in v0.5.2. Layer counts derive from static data arrays. Should derive from live incidents. |
| `IwlRightPanel.tsx` | Casualties + feed + telemetry | Live (incidents) + static fallback | **Mixed** | Ground Station | **Improved** | Operations | P2 | Casualty stats now derived from live incidents via useMemo. Feed uses live incidents (top 20) with static iwlFeedSeed fallback. Telemetry derives active events, kinetic events, sources from incidents. Entities tab filter fixed. Box-shadow removed. Still falls back to static when no pipeline data. |
| `IwlBottom.tsx` | Datalink status bar | Hardcoded | Aesthetic | — | **Done** | Operations | — | Rewritten in v0.5.2 to status-only bar. Dead buttons (SHARE MAP, EXPORT SITREP) removed. |
| `LeafletMap.tsx` | Interactive map | Static (68 events from map-events.ts) + live incident count | **Mostly static** | Shadowbroker (benchmark) | **Connect** | Operations | P1 | Map renders. But 68 events are hardcoded in map-events.ts. Live incidents are counted but not plotted as markers. Trajectory arcs and THAAD sites are static. IranWarLive fetch likely fails (CORS). See §4.3. |
| `AirspaceTab.tsx` | Airspace closure table | **Live** (airspace) + static fallback | **Real** | Gulf Watch | **Keep** | Operations | — | One of the better components. Uses live airspace data with clean static fallback. |
| `CasualtiesTab.tsx` | Participants & casualties | Live (incidents) + static scenario table | **Mixed** | — | **Improved** | Operations | P2 | Top 4 stat boxes now derive from live incidents (military KIA, civilian KIA, intercepts, total tracked). Scenario reference table below remains hardcoded but is labeled STATIC. Inline styles extracted to CSS classes. Panels stack on mobile. |
| `PosturingTab.tsx` | Diplomatic posturing | Static (postures.ts) | **Static** | — | **Improved** | Operations | P3 | Data from postures.ts. Labeled with SCENARIO badges. Inline styles extracted to shared CSS classes (`.iwl-sub-h`, `.iwl-data-row`, `.iwl-data-entry`). Panels stack on mobile. |

### 2.7 Regional Section

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `RegionalPanel.tsx` | Regional overview with country filter | **Live** (regional_stats.json, 5min refresh) | **Real** | Gulf Watch | **Keep** | Overview or Operations | P0 | Fetches real regional data. Country breakdown works. One of the strongest real components. Target page TBD — could serve Overview (summary) or Operations (detail). |

### 2.8 Predictor Section (Analysis)

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `PredictorEngine.tsx` | Threat prediction with scenario builder | **Live** (incidents/airspace/prices) + demo fallback | **Real** | MIT (math) + Gulf Watch (data) | **Move** | Analysis | P1 | Strongest analytical surface. Uses real incidents through a real local prediction engine. Falls back to demo data if <5 incidents. Scenario builder works. This is the MIT pattern applied correctly — local math on Gulf Watch data. |

### 2.9 Analysis Section

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `AnalysisSection.tsx` | Incident analytics (4 tabs) | **Live** (incidents) + demo fallback | **Real** | Gulf Watch | **Move** | Analysis | P1 | Live incident analytics with timeline, heatmap, intensity, sources. Falls back to demoIncidents (15 items). Real Gulf Watch data analysis. |

### 2.10 Economic Section (Analysis)

| Component | Current Role | Data Source | Real or Fake | Reference Source | Action | Target Page | Priority | Notes |
|-----------|-------------|-------------|:---:|--------|--------|-------------|:---:|-------|
| `EconomicSection.tsx` | Commodity prices + currencies + Dubai RE | **Live** (prices) + static | **Mixed** | Gulf Watch (prices) | **Move** | Analysis | P1 | Prices (Brent, gold, gas, BTC) are live from pipeline. Currencies and Dubai RE are static from gulf-economic.ts. Should label static sections. |

### 2.11 Data Files

| File | Content | Items | Live or Static | Action | Notes |
|------|---------|:---:|:---:|--------|-------|
| `feed-data.ts` | Seed feed items | 14 | Static | **Keep as fallback** | Supplements live feed when pipeline has gaps. Appropriate fallback. |
| `gcc-data.ts` | GCC intercept counts | 4 | Static | **Label or derive** | UAE 165, Kuwait 97 etc. Should match MissileDefenseStrip or be removed as duplicate hardcoded source. |
| `gulf-economic.ts` | Currencies + Dubai RE | 10 | Static | **Label** | Static reference data. Not from pipeline. Should carry STATIC label in UI. |
| `thaad-sites.ts` | THAAD battery locations | 5 | Static | **Keep** | Reference positions. Static by nature (physical installations). Appropriate as static. |
| `airspace-zones.ts` | Airspace closure polygons | 6 | Static | **Connect** | Should derive from airspace.json NOTAMs. Currently hardcoded polygons. |
| `map-events.ts` | Map markers (6 categories) | 68 | Static | **Connect** | 68 hardcoded events plotted on map. Should derive from incidents.json. Highest-value connection target. See §4.3. |
| `postures.ts` | Diplomatic postures | 16 | Static | **Label** | Not derivable from pipeline. Requires editorial input. Label as ANALYST ASSESSMENT. |
| `demo-incidents.ts` | Fallback incidents | 15 | Static | **Keep as fallback** | Used when pipeline returns <5 incidents. Appropriate demo data pattern. |
| `continents.ts` | ~~Globe continent polygons~~ | 26 | Static | **Dead code** | Not imported anywhere. Globe uses `land-110m.ts` instead. Can be deleted. |
| `globe-markers.ts` | Globe markers | 10 | Static | **Keep or derive** | 10 hardcoded theatre markers. Could derive from live incidents but low priority. |

### 2.12 Hooks

| Hook | Purpose | Data Type | Action | Notes |
|------|---------|-----------|--------|-------|
| `useDataPipeline.ts` | Fetch live JSON | **Live** | **Keep** | Core data hook. 60s refresh. Fallback pattern. This is the Gulf Watch backbone in the frontend. |
| `useUtcClock.ts` | UTC time + mission elapsed | Computed | **Keep** | Real time. Mission start Feb 28 2026 is a design choice. |
| `usePressureGauge.ts` | Pressure fluctuation | Computed (random) | **Adapt** | Random ±1 fluctuation. Not real pressure. Either connect to prediction threat level or label as aesthetic. |
| `useC2Type.ts` | Number scramble animation | Animation | **Keep** | Pure visual effect. No data claims. |
| `useCasualtyCounter.ts` | Counter animation | Animation | **Keep** | Pure animation. Problem is the numbers it animates, not the animation. |
| `useTracking.ts` | Simulated aircraft/sat/maritime | **Procedural** | **Label** | Generates 17 fake tracked objects. Used by sonar and signal monitor. No real tracking data. See §3.6. |
| `useSignalMonitor.ts` | Random signal frequency | **Procedural** | **Label** | Displays fake kHz/dB readings. Cycles through useTracking objects. See §3.6. |
| `usePrediction.ts` | Prediction wrapper | Computed (real math) | **Keep** | Runs real local prediction engine on real incidents. MIT math applied to Gulf Watch data. Correct pattern. |
| `useOpenSky.ts` | Live aircraft tracking | **Live** (OpenSky proxy) | **Keep** | Added in v0.5.0. Consumes upstream OpenSky proxy for real Gulf airspace aircraft data. Replaces the need for procedural `useTracking` in FlightTracker. |

### 2.13 Canvas Hooks

| Hook | Purpose | Data Type | Action | Notes |
|------|---------|-----------|--------|-------|
| `useGlobe.ts` | 3D globe | Static + interactive | **Keep** | Visual identity. No false data claims. |
| `useSonar.ts` | Sonar sweep | Procedural (useTracking) | **Label** | Plots procedural tracking objects. Looks like real radar. See §3.6. |
| `useNoiseCanvas.ts` | CRT noise | Procedural | **Keep** | Pure aesthetic. |
| `useWaterfall.ts` | Spectrogram | Procedural | **Label** | Looks like real signal analysis. Is random noise. See §3.6. |
| `useSepStatic.ts` | ~~Separator noise~~ | ~~Procedural~~ | **Dead code** | Unused since v0.5.2 — SepBand switched to `useNoiseCanvas`. Can be deleted. |
| `useDrawMark.ts` | HADAL reticle | Animation | **Keep** | Brand element. |
| `usePizzaSlice.ts` | ~~3D pizza slice~~ | ~~Procedural~~ | **Removed** | Deleted in v0.4.0 (3-lane shell extraction). |

### 2.14 Lib / Utils

| File | Purpose | Action | Notes |
|------|---------|--------|-------|
| `utils.ts` | cn() class merger | **Keep** | Standard utility. |
| `threat-calc.ts` | Threat report text | **Adapt** | If no incidents, generates random threat 88-95. Should always use incident data. |
| `sparkline.ts` | SVG sparklines | **Keep** | Clean utility. |
| `sitrep-export.ts` | SITREP download | **Adapt** | Strike counts are hardcoded in export template. Should derive from incident data. |
| `prediction/` (5 files) | Local prediction engine | **Keep** | 4-stage pipeline: normalize → profile → sequence → build. Real math. MIT-adapted. Gulf Watch data. Correct reference usage per hierarchy. |

---

## 3. Critical Fake-Authority Components

These components present hardcoded or procedural data as operational intelligence. Per the reference hierarchy anti-patterns (§7.5 Fake Intelligence Density, §7.6 Unsourced Operational Metrics), they must be connected to real data, honestly labeled, or stripped of authority claims.

### 3.1 Topbar — Unsourced Metrics

**File:** `src/components/topbar/Topbar.tsx` + App.tsx class-banner

| Metric | Current Value | Source | Problem |
|--------|--------------|--------|---------|
| DEPTH: 10,924M | Hardcoded | None | Satellite-console cosplay. No depth data exists. |
| PRESSURE: ~10,924 BAR | usePressureGauge (random ±1) | Procedural | Random fluctuation. Not pressure. |
| THREAT LEVEL 91% | Hardcoded in App.tsx | None | Most prominent metric on the page. Zero computation behind it. |
| OP. EPIC FURY | Hardcoded | None | Scenario label with no backing. |

**Fix:** Connect threat gauge to `prediction.theatreThreatLevel`. Replace DEPTH/PRESSURE with a real metric (incident velocity, pipeline freshness, or remove). Label OP. EPIC FURY as scenario context or remove.

### 3.2 LeftRail — Fallout RPG Stats as Intelligence

**File:** `src/components/hero/LeftRail.tsx`

| Element | Current | Problem |
|---------|---------|---------|
| Threat index "91 / CRITICAL" | Hardcoded | Same as class banner. No computation. |
| SPECIAL stats (S:09, P:07, E:04, C:08, I:06, A:09, L:03) | Hardcoded | Fallout Pip-Boy reference. Seven meaningless numbers displayed as intelligence metrics. |
| System status (OSINT ENGINE: ON, LEAFLET MAP: ON, etc.) | Hardcoded dots | Status indicators that never change. If THAAD NETWORK is "WARN," what triggers it? Nothing. |

**Fix:** Remove SPECIAL stats entirely (they are Fallout cosplay, not threat intelligence). Connect threat index to prediction engine. System status dots should reflect actual hook/fetch state (is useDataPipeline returning data? is Leaflet mounted? is airspace.json fresh?).

### 3.3 RightRail — Procedural SIGINT Theater

**File:** `src/components/hero/RightRail.tsx`

| Element | Current | Problem |
|---------|---------|---------|
| Sonar sweep | useSonar (procedural objects) | Plots fake aircraft/satellites. Looks like real radar. |
| Signal monitor (4.2 kHz, 89 dB) | useSignalMonitor (random) | Random frequency/strength. Not a real signal. |
| Waterfall spectrogram | useWaterfall (procedural) | Random noise displayed as signal analysis. |
| GCC intercepts (UAE 38%, Kuwait 28%, etc.) | gcc-data.ts (static) | Static percentages. Never update. |

**Fix:** Label sonar/signal/waterfall cluster as "SIMULATED" or connect to real tracking data (Phase 4+ per platform plan). GCC intercepts should derive from incidents.json country breakdown or be labeled STATIC.

### 3.4 IwlRightPanel — PARTIALLY FIXED (v0.5.2)

**File:** `src/components/intel/IwlRightPanel.tsx`

| Element | Current | Status |
|---------|---------|--------|
| MILITARY casualties | Derived from live `incidents.casualties.military` | **Fixed** — shows live sum with NO DATA badge when offline |
| CIVILIAN casualties | Derived from live `incidents.casualties.civilian` | **Fixed** |
| ENTITIES / SOURCES | Derived from unique `incident.source` values | **Fixed** |
| Intel feed | Uses live incidents (top 20) with static fallback | **Fixed** — Military/Civilian/Entities tabs filter correctly |
| Tactical telemetry | Derives active events, kinetic events, sources, last strike from incidents | **Fixed** — values are live, fall back to "—" when no data |

**Remaining:** All data still falls back to static `iwlFeedSeed` when pipeline returns zero incidents. This is acceptable fallback behavior.

### 3.5 CasualtiesTab — PARTIALLY FIXED (v0.5.2)

**File:** `src/components/intel/CasualtiesTab.tsx`

**Fixed:** Top 4 stat boxes now derive from live pipeline:
- Military KIA — summed from `incidents.casualties.military` (labeled PIPELINE)
- Civilian KIA — summed from `incidents.casualties.civilian` (labeled PIPELINE)
- Intercept events — counted from incident titles (labeled PIPELINE)
- Total tracked events — live count (labeled LIVE)

**Still static:** 7-row participant table (IRAN, USA, UAE, Saudi, Israel, Houthi, Hezbollah) with troops/aircraft/armor/casualties. Labeled STATIC with provenance badge. This is editorial scenario reference data, not live intelligence.

**Remaining:** The scenario table should either be removed or gated behind sandbox toggle if it creates confusion.

### 3.6 Tracking / SIGINT Cluster — Simulated Surveillance

**Files:** `useTracking.ts`, `useSignalMonitor.ts`, `useSonar.ts`, `useWaterfall.ts`

These four files create the illusion of real-time surveillance:

- 17 procedurally generated aircraft, satellites, and maritime vessels
- Random callsigns, altitudes, speeds
- Position drift every 10 seconds
- Signal frequency cycling
- Sonar plotting of fake objects
- Waterfall spectrogram of noise

None of this is connected to any data source. The original Gulf Watch did attempt OpenSky API for aircraft tracking (visible in README: "OpenSky API authenticated, 30s update"). That capability was lost in the React migration.

**Upstream update (2026-03):** Nikola has since hardened the OpenSky proxy with auth handling, response caching, and rate-limit management. This makes reconnection more viable than when the original Gulf Watch integration was attempted. See §4A (Active Upstream Adaptation Queue) for the full adaptation plan.

**Fix:** Either:
1. **Reconnect** to OpenSky API via upstream's hardened proxy — real aircraft in Gulf airspace (preferred path, see §4A)
2. **Label** the entire cluster as "SIMULATED — DEMO MODE"
3. **Gate** behind sandbox toggle

---

## 4. Immediate Connect-to-Gulf-Watch Targets

These components are structurally sound but fed static data that should come from the pipeline.

### 4.1 Threat Level → Prediction Engine

**Current:** Hardcoded `91` in App.tsx class-banner and LeftRail.
**Target:** `prediction.theatreThreatLevel` from `usePrediction()` hook.
**Effort:** Low — prediction engine already computes this. Wire the value up.
**Blocker:** None. The prediction hook runs in PredictorEngine but the value is not lifted to App.tsx. Either lift via context or compute in App.tsx directly.

### 4.2 MissileDefenseStrip → incidents.json

**Current:** 5 cards with hardcoded counts (UAE 165 intercepted, Kuwait 97, etc.).
**Target:** Derive from `incidents.json` — filter by country + event type (missile/drone/cruise), count by category.
**Effort:** Medium — need to parse incident titles/types for weapon system classification.
**Blocker:** incidents.json may not have granular weapon-type classification. May need pipeline enhancement or heuristic mapping from title keywords (similar to what `normalizePredictionInputs.ts` already does).

### 4.3 LeafletMap → incidents.json

**Current:** 68 hardcoded events from `map-events.ts` plotted as markers.
**Target:** Plot live incidents from `incidents.json` using their coordinates (the pipeline already extracts coordinates for every incident).
**Effort:** Medium — incidents have lat/lon. Need to map incident event types to marker styles (missile → ripple, airstrike → pyramid, etc.).
**Blocker:** None. The coordinate extractor in the pipeline guarantees every incident has coordinates. This is the highest-value connection: it turns a static map into a live map.
**Note:** Keep static map-events.ts as a DEMO/fallback layer.

### 4.4 Aggregate Stats → incidents.json

Several surfaces display aggregate numbers that should be computed from incidents:

| Surface | Current | Target Derivation |
|---------|---------|-------------------|
| MissileDefenseStrip totals | Hardcoded (325 ballistic, 833 drones, etc.) | Count incidents by type keyword |
| SepBand "1,160 INTERCEPTIONS" | Hardcoded | Count incidents with "intercept" in title |
| IwlLeftPanel layer counts | Hardcoded (Missile Strike 10, Air Strike 6, etc.) | Count incidents by type |
| IwlRightPanel casualties | Hardcoded (1847/423/11) | Sum incident casualty mentions (heuristic) |

### 4.5 Airspace Zones → airspace.json

**Current:** `airspace-zones.ts` has 6 hardcoded polygons.
**Target:** Derive from `airspace.json` NOTAMs — map NOTAM regions to zone polygons.
**Effort:** Medium — need a NOTAM-to-polygon lookup.
**Blocker:** Pipeline produces NOTAMs but not polygon geometries. May need a static lookup table (country → polygon) combined with live NOTAM status.

---

## 4A. Active Upstream Adaptation Queue

Gulf Watch is not a static reference. Nikola ships meaningful human commits upstream that HADAL must track and selectively adapt. Automated data-refresh commits (pipeline cron runs) are consumed automatically via `incidents.json` — they require no adaptation. Human logic/feature commits require explicit evaluation.

### Classification

| Commit Type | HADAL Response |
|-------------|---------------|
| Automated data refresh | No action — HADAL consumes the JSON output |
| Human logic/feature | Evaluate → classify by lane → add to adaptation queue |
| Human infrastructure | Ignore — HADAL has its own deploy/CI stack |
| Human data-model change | Mandatory — contract changes break the frontend |

### Current Queue (as of 2026-03-18)

#### Prediction Engine Enhancements
**Upstream:** 14-day focus window, trend analysis, escalation alert parameters
**Lane:** Analysis
**HADAL target:** `src/lib/prediction/` (4-stage pipeline) + `PredictorEngine.tsx`
**Priority:** High — HADAL already has working prediction math. Upstream improvements to focus windows and trend parameters are direct upgrades to existing local logic.
**Adaptation type:** Parameter/logic port. Not a rewrite — evaluate upstream changes to `sequenceModel` and `impactProfiler` equivalents, port improved thresholds and trend calculations.
**Risk if skipped:** HADAL's prediction engine stagnates on initial extraction while upstream prediction quality improves.

#### Aircraft/OpenSky Proxy Hardening — PARTIALLY DONE
**Upstream:** Auth handling, response caching, rate-limit management, error recovery
**Lane:** Operations
**HADAL target:** `FlightTracker.tsx` + `useOpenSky.ts` hook
**Status:** `useOpenSky.ts` hook created in v0.5.0. FlightTracker component updated. The hook and component exist but need verification against the live upstream proxy endpoint.
**Remaining:** Confirm the proxy endpoint is reachable from HADAL's deployment, verify auth token handling, test rate-limit behavior under real load.
**Note:** The upstream proxy runs as a serverless function. HADAL can consume it directly or deploy its own instance.

#### Mobile Country/Severity Filtering
**Upstream:** Improved country and severity filter UX on mobile viewports
**Lane:** Overview (condensed feed) + Operations (full feed)
**HADAL target:** `ThreatFeed.tsx` mobile breakpoints + filter interaction
**Priority:** Medium — HADAL already has region tabs on ThreatFeed. Upstream improvements are UX discipline refinements (filter accessibility, touch targets, filter persistence) rather than new capability.
**Adaptation type:** UX pattern port. Evaluate upstream filter behavior on small viewports, adapt into HADAL's existing feed filtering with Green Fallout styling.
**Risk if skipped:** HADAL's mobile feed experience falls behind upstream on a surface that matters for field analysts.

### Queue Maintenance Rules

1. **Check upstream monthly** for new human commits that affect prediction, tracking, filtering, or data models.
2. **Ignore** automated commits (pipeline runs, data refreshes, dependency bumps).
3. **Classify** every human feature commit by lane before deciding to adapt.
4. **Port logic, not code.** Gulf Watch is vanilla JS. HADAL is React + TypeScript. Extract the algorithm or parameter change, implement in HADAL's stack.
5. **Do not delay HADAL's own roadmap** for upstream adaptation. Queue items slot into existing phases — they do not create new phases.

### Upstream Watch — Next Audit Ready

**Target repo:** `nKOxxx/gulfwatch-testing`
**Last checked:** 2026-03-18 (data refresh commits only — no human logic changes since last audit)
**Next audit scope:** Look for human commits after 2026-03-18 that touch:
- `scripts/` (prediction, scoring, data model changes)
- `api/` (proxy endpoints, auth handling)
- `public/index.html` or main app logic (filter UX, mobile behavior)
- Any new data contract changes (JSON schema evolution in incidents/prices/airspace)

**Do not audit:** automated data refresh commits, dependency bumps, CI config.

---

## 5. Components Safe to Keep Temporarily

These components are not Gulf Watch-backed but serve legitimate purposes and do not create false authority.

| Component | Why It's Safe | Condition |
|-----------|--------------|-----------|
| `GlobeView.tsx` | Visual identity, not intelligence claim | Keep as-is |
| `useGlobe.ts` | Interactive brand element | Keep as-is |
| `useNoiseCanvas.ts` | CRT aesthetic overlay | Keep as-is |
| ~~`useSepStatic.ts`~~ | ~~Separator texture~~ | **Dead code — delete** |
| `useDrawMark.ts` | Brand reticle | Keep as-is |
| `useC2Type.ts` | Number animation effect | Keep as-is |
| `useCasualtyCounter.ts` | Counter animation utility | Keep — problem is the data, not the animation |
| `WeaponIcon.tsx` | SVG icon set | Keep as-is |
| `LoginPage.tsx` | Atmospheric gate | Keep until real auth (Phase 6) |
| `SonarParticles.tsx` | Login particle background | Keep as-is |
| `IwlBottom.tsx` | Status bar UI | Keep as-is |
| `feed-data.ts` | Feed fallback data | Keep — labeled as fallback in code |
| `demo-incidents.ts` | Prediction fallback data | Keep — used correctly as demo gate |
| `thaad-sites.ts` | Static reference positions | Keep — physical locations are inherently static |
| `postures.ts` | Editorial assessment data | Keep — but label as ANALYST ASSESSMENT in UI |
| ~~`continents.ts`~~ | ~~Globe geography~~ | **Dead code — delete** |

---

## 6. Components for Demo-Only / Test Fixtures

These should be gated behind the sandbox toggle or moved to a `_fixtures/` directory.

| Component/File | Reason | Recommended Action |
|----------------|--------|-------------------|
| `KillChainTracker.tsx` | Fully fabricated engagement records. Not imported in App.tsx (already dormant). | Move to `_fixtures/` or gate behind sandbox. Reintroduce when real engagement data exists. |
| ~~`usePizzaSlice.ts`~~ | ~~Unused 3D pizza slice.~~ | **Deleted** in v0.4.0. |
| `gcc-data.ts` | Duplicates MissileDefenseStrip hardcoded data. | Consolidate into MissileDefenseStrip or replace both with incident-derived data. |

---

## 7. Recommended Next Implementation Moves

Ordered by impact and dependency. Each move is self-contained and committable. Move 4 (router shell) was completed in v0.4.0.

### Move 1: Wire Threat Level to Prediction Engine

**What:** Connect the class-banner threat gauge (App.tsx line 51) and LeftRail threat index to `prediction.theatreThreatLevel`.
**Why:** The most visible metric on the page is hardcoded. The prediction engine already computes this value. This is a wiring fix, not new logic.
**Files:** `App.tsx`, `LeftRail.tsx`, possibly lift `usePrediction()` to App level or add a lightweight threat-level hook.
**Effort:** Small (1-2 hours).
**Anti-pattern fixed:** Unsourced operational metrics (§7.6).

### Move 2: Plot Live Incidents on LeafletMap

**What:** Map `incidents[]` (with their pipeline-extracted lat/lon) to Leaflet markers, styled by event type.
**Why:** Turns the static map into a live map. The pipeline already guarantees coordinates on every incident. The map component already receives incidents as a prop but only uses them for a count display.
**Files:** `LeafletMap.tsx`, potentially `map-events.ts` (keep as fallback layer).
**Effort:** Medium (3-4 hours). Marker style mapping (type → icon) can reuse `WeaponIcon.tsx` patterns.
**Anti-pattern fixed:** Fake intelligence density (§7.5) on the map surface.

### Move 3: Derive MissileDefenseStrip from Incidents

**What:** Replace hardcoded missile card numbers with incident-derived counts. Use the same keyword extraction logic from `normalizePredictionInputs.ts` (which already classifies events by type and country).
**Why:** The missile strip is the second-most prominent data surface after the threat gauge. All 9 numbers on it are hardcoded.
**Files:** `MissileDefenseStrip.tsx`, `MissileCard.tsx`. May extract a shared `useIncidentCounts(incidents)` hook.
**Effort:** Medium (3-4 hours).
**Anti-pattern fixed:** Fake intelligence density (§7.5).

### Move 4: Add Router Shell (3-Lane Pages) — DONE (v0.4.0)

**Completed** in commit `6a439eb`. Hash-based routing via `src/lib/lane-routing.ts` with `useSyncExternalStore`. Three page files: `OverviewPage.tsx`, `OperationsPage.tsx` (lazy, 200KB), `AnalysisPage.tsx` (lazy, 28KB). Initial bundle reduced from 1084KB to 857KB.
**Files changed:** `App.tsx`, `src/pages/OverviewPage.tsx`, `src/pages/OperationsPage.tsx`, `src/pages/AnalysisPage.tsx`, `src/lib/lane-routing.ts`.

### Move 5: Label or Gate Simulated Surfaces

**What:** Add visible "SIMULATED" labels to: sonar sweep, signal monitor, waterfall spectrogram, tracking objects, and any surface using `useTracking()` data. Alternatively, gate these behind the existing sandbox toggle.
**Why:** These surfaces create the strongest false authority impression. Users cannot distinguish procedural noise from real surveillance data.
**Files:** `RightRail.tsx`, `useSonar.ts`, `useSignalMonitor.ts`, `useWaterfall.ts`.
**Effort:** Small (1-2 hours).
**Anti-pattern fixed:** Satellite-console cosplay (§7.4), Fake intelligence density (§7.5).

### Upstream Adaptation Moves (post-Move 5)

These are not sequenced as Moves 6-8 because they slot into the existing phase plan rather than preceding it. They should be evaluated after the core 5 moves above.

**A. Port Upstream Prediction Enhancements → Analysis Lane**
Evaluate Nikola's 14-day focus window, trend analysis, and escalation alert parameters. Port improved thresholds into `src/lib/prediction/`. This upgrades existing working prediction math — it is not new capability.

**B. Reconnect FlightTracker via Upstream OpenSky Proxy → Operations Lane**
Replace `useTracking.ts` procedural simulation with a real OpenSky data hook that consumes the upstream proxy (now hardened with auth/cache/rate-limiting). This is the single highest-value fake-to-real conversion remaining.

**C. Adapt Upstream Mobile Filtering → Overview + Operations**
Port upstream country/severity filter UX improvements into `ThreatFeed.tsx` mobile breakpoints. Focus on filter accessibility and touch targets, not visual restyling.

---

## 8. Reference Compliance Check

Cross-checking current codebase against HADAL_REFERENCE_HIERARCHY.md rules:

| Rule | Status | Detail |
|------|--------|--------|
| Gulf Watch is the backbone | **Partial** | Pipeline is Gulf Watch. But most visible surfaces ignore it. |
| MIT provides patterns, not product | **Correct** | Prediction engine uses MIT math on Gulf Watch data. Kage aesthetic applied. No MIT product imports. |
| Every MIT-style panel traces to Gulf Watch data | **Failing** | MissileDefenseStrip, LeftRail SPECIAL stats, casualty panels have no Gulf Watch data source. |
| Shadowbroker sets bar, not blueprint | **Failing** | Map has 68 static events. Does not meet Shadowbroker's spatial intelligence bar. |
| Ground Station informs engineering, not aesthetics | **Failing** | DEPTH/PRESSURE/SIGINT displays are Ground Station aesthetics without the operational data. |
| No satellite-console cosplay | **Active** | Sonar, signal monitor, waterfall, pressure gauge, tracking system. |
| No fake intelligence density | **Active** | 15 components display hardcoded data as live intelligence. |
| No unsourced operational metrics | **Active** | Threat level 91%, casualties, intercept counts, layer counts. |
| Green Fallout is visual owner | **Correct** | Consistent aesthetic throughout. |

---

## 9. Document Hierarchy Update

This document sits in the stack as:

```
SYSTEM_BOUNDARIES.md           — who owns what
HADAL_REFERENCE_HIERARCHY.md   — what to take from each source
HADAL_PLATFORM_PLAN.md         — how to build it
HADAL_MACRO_PLAN.md            — delivery sequence
HADAL_PAGE_ARCHITECTURE.md     — 3-lane page structure
HADAL_BLUEPRINT.md             — 7-layer pipeline stack
HADAL_IMPLEMENTATION_MATRIX.md — what exists now and what to do with it (this document)
```

This is the bridge between architecture and code. The architecture docs say what HADAL should be. This document says what it currently is and what each file needs to become.
