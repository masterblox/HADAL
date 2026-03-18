# HADAL Reference Hierarchy

**Status:** Active — canonical reference classification document
**Created:** 2026-03-18
**Relates to:** [SYSTEM_BOUNDARIES.md](SYSTEM_BOUNDARIES.md), [HADAL_PLATFORM_PLAN.md](HADAL_PLATFORM_PLAN.md), [HADAL_BLUEPRINT.md](HADAL_BLUEPRINT.md)

This document defines what HADAL takes from each reference system, what it explicitly avoids, and where each source belongs in the architecture. Its purpose is to stop reference systems from being used interchangeably or aspirationally. Every external influence has a defined role, scope, and boundary.

If a future prompt, design decision, or implementation task mixes references without justification, this document is the tiebreaker.

---

## 1. Executive Summary

HADAL draws from two stacks:

**Core architecture donors** — systems that directly shape HADAL's product logic, visual language, or engineering patterns:

| System | Role |
|--------|------|
| Gulf Watch | Operational backbone — inherited capability and live data pipeline |
| MIT (IranWarLive) | Selective analytical and UI pattern donor |
| Shadowbroker | Geospatial OSINT benchmark — map workspace standard |
| Ground Station | Systems/workspace engineering reference — console UX patterns |

**External source stack** — systems that inform HADAL's position in the intelligence tooling landscape but do not donate architecture:

| System | Role |
|--------|------|
| LiveUAmap | Conflict mapping benchmark and potential future enrichment source |
| GDELT | Structured event taxonomy reference and potential future data enricher |
| WorldMonitor | Original product inspiration — UX benchmark for geopolitical monitoring |
| SOCRadar | Enterprise threat intelligence UX reference |
| Pizzint | OSINT methodology reference |

The hierarchy is strict:

```
Gulf Watch ──────── backbone (capability + pipeline + data)
  MIT ──────────── selective donor (analytical patterns + visual density)
  Shadowbroker ──── benchmark (geospatial standard)
  Ground Station ── reference (console engineering patterns)

External stack ──── context only (product positioning + future enrichment)
```

Gulf Watch is not one reference among equals. It is the foundation. Everything else plugs into or benchmarks against it.

---

## 2. Core Architecture Donors

---

### 2.1 Gulf Watch

**Classification:** Architecture backbone

**Role in HADAL:**
Gulf Watch is the source system. HADAL is an evolution of Gulf Watch, not a replacement and not a reskin. The incident pipeline, verification engine, coordinate enrichment, circuit breaker, and feed logic all originate here. The Gulf Watch data model is the default until explicitly superseded.

**What to keep:**

- Full incident ingestion pipeline (11 Python scripts)
- Circuit breaker deduplication algorithm
- Cross-source verification scoring (40% source quality, 35% cross-verification, 15% timeliness, 10% consistency)
- Coordinate extraction with precision tiers (extracted → city → region → country → fallback)
- Finance and airspace fetchers
- Severity scoring formula (Critical 90-130, High 60-89, Medium 30-59, Low 0-29)
- Source reliability tiers (Official 100%, News 70-95%, Social 40-60%)
- User report system
- JSON artifact output format (`incidents.json`, `prices.json`, `airspace.json`)

**What to adapt:**

- Frontend presentation — Gulf Watch's vanilla HTML/CSS/JS frontend becomes HADAL's React terminal shell. The capability stays, the delivery layer changes.
- Single-page scroll layout — Gulf Watch presented everything linearly. HADAL separates into Overview / Operations / Analysis lanes.
- Prediction concepts — Gulf Watch had rule-based scenario modeling. HADAL should formalize this into a typed, inspectable prediction module with artifact contracts.
- Map integration — Gulf Watch used Leaflet with basic markers. HADAL should add density, layering, and spatial intelligence patterns (informed by Shadowbroker benchmark).

**Gulf Watch as a Live Upstream:**

Gulf Watch is not a frozen codebase that HADAL forked and left behind. Nikola continues to ship meaningful human feature commits upstream. These must be tracked, classified, and adapted into HADAL — not ignored because "we already extracted what we need."

Recent upstream human commits include:
- **Prediction engine enhancements** — 14-day focus window, trend analysis, escalation alerts
- **Aircraft/OpenSky proxy hardening** — auth, caching, rate-limit handling, reliability fixes
- **Mobile filtering improvements** — country/severity filtering UX on mobile viewports

These are not data-refresh churn. They are logic and feature improvements that directly affect HADAL's Operations and Analysis lanes.

**Upstream commit classification rule:**

| Commit Type | Example | HADAL Action |
|-------------|---------|-------------|
| **Automated data refresh** | Pipeline cron updating `incidents.json` | No adaptation needed — HADAL consumes the output, not the commit |
| **Human logic/feature** | New prediction parameters, proxy auth fixes, filter UX | Evaluate for HADAL adaptation — classify by lane |
| **Human infrastructure** | CI/CD changes, deploy config, environment setup | Ignore — HADAL has its own deploy stack |
| **Human data-model change** | New fields in `incidents.json`, new artifact types | Mandatory adaptation — these are contract changes |

**What to avoid:**

- Treating Gulf Watch as a legacy system to be discarded. It is the live capability.
- Treating Gulf Watch as a static foundation that stopped evolving. It has an active human maintainer shipping real features.
- Rewriting working pipeline scripts for aesthetic reasons. If `circuit_breaker.py` works, it stays until there is a functional reason to change it.
- Discarding Gulf Watch's source taxonomy in favor of a new one without migration.
- Ignoring upstream human commits because "HADAL already extracted what it needs." The extraction is ongoing.

**Risk if overused:**
HADAL becomes a prettier Gulf Watch clone with no structural improvement. The product stays as one dense scroll with better CSS.

**Risk if under-tracked:**
Gulf Watch evolves meaningful capabilities upstream (better prediction, better tracking, better filtering) while HADAL's versions of those same features stagnate on the initial extraction. The fork diverges silently.

---

### 2.2 MIT (IranWarLive)

**Classification:** Selective analytical and UI pattern donor

**Role in HADAL:**
MIT donates specific patterns — not product architecture, not data models, not core threat logic. Its value to HADAL is in three areas: visual density conventions (kage aesthetic), analytical UI patterns (bootstrap math, co-pilot widget), and information hierarchy examples.

**What to keep:**

- Kage aesthetic principles: corner brackets, 1px borders, gap-as-border grids, large isolated numbers in bordered cells, generous whitespace (Ma 間), sharp panel structure
- Bootstrap/empirical prediction math patterns (local computation, no API dependency)
- Co-pilot widget concept (future shell surface, post-auth)
- Panel density as a readability tool — MIT proves that dense data can be legible if the grid is precise

**What to adapt:**

- MIT's density targets internal operators. HADAL targets a broader analyst audience. MIT density is a reference ceiling, not a UX target.
- MIT's component architecture is not Gulf Watch's. Do not import MIT component hierarchies wholesale. Extract the pattern, implement in HADAL's component tree.
- MIT's real-time conventions (WebSocket-driven) may inform HADAL's future real-time layer but are not relevant to the current static-JSON pipeline.

**What to avoid:**

- Importing MIT's product structure as HADAL's product structure. MIT is not the source system.
- Using MIT as a design bible. MIT's visual language is a donor; HADAL's Green Fallout aesthetic is the owner.
- Importing MIT's data models. HADAL's data contracts come from Gulf Watch's pipeline output, not from MIT schemas.
- Transplanting MIT components directly. If a pattern is useful, rewrite it in HADAL's stack. Do not fork MIT code.

**Risk if overused:**
HADAL becomes an MIT transplant wearing Gulf Watch data. The product loses its own identity. Users get MIT's information architecture — which was built for a different threat model and different users — with Gulf Watch numbers plugged in.

---

### 2.3 Shadowbroker

**Classification:** Geospatial OSINT benchmark

**Role in HADAL:**
Shadowbroker sets the standard for what serious geospatial OSINT looks like. HADAL's Operations page (map workspace) should benchmark against Shadowbroker's spatial intelligence density, layer management, and geospatial interaction patterns. Shadowbroker is not a code donor or data source — it is the quality bar for HADAL's map workspace.

**What to keep:**

- Expectation of spatial intelligence density: a map workspace should show more than markers on tiles. Layers, zones, overlays, and contextual spatial data are baseline.
- Layer management patterns: toggle-able, categorized, with clear visual hierarchy between active and inactive layers.
- OSINT workflow conventions: source attribution on spatial data, confidence indicators on geolocation, provenance for every marker.
- Geospatial precision standards: distinguish exact coordinates from estimated positions. Never present inferred positions as confirmed.

**What to adapt:**

- Shadowbroker is a pure OSINT tool. HADAL is a threat intelligence terminal with OSINT as one input. HADAL's map workspace serves the Operations lane, not a standalone OSINT workflow.
- Shadowbroker's interaction model is investigation-first. HADAL's map should support both monitoring (passive scan) and investigation (active drill-down) modes.
- Layer density should be calibrated to HADAL's data — military incidents, airspace zones, THAAD sites, trajectories — not Shadowbroker's broader OSINT scope.

**What to avoid:**

- Cloning Shadowbroker's UI. HADAL has its own visual language (Green Fallout). The map workspace should meet Shadowbroker's quality bar without copying its interface.
- Building an OSINT investigation tool. HADAL's map is a theatre awareness surface, not an analyst's OSINT workbench.
- Adding layers for visual impressiveness without data behind them. Every layer must have a real data source or a documented placeholder state.

**Risk if overused:**
HADAL's Operations page becomes a Shadowbroker clone that cannot actually deliver on the implied OSINT depth. Users expect Shadowbroker-grade spatial investigation but get themed markers over Leaflet tiles.

---

### 2.4 Ground Station

**Classification:** Systems/workspace engineering reference

**Role in HADAL:**
Ground Station is the reference for how professional systems present operational state: telemetry panels, system health indicators, status boards, console workspace engineering. It informs how HADAL's shell, topbar, and system-status surfaces should feel — like instruments, not dashboards.

**What to keep:**

- Instrument-panel UX patterns: dedicated readouts for each metric, not cards with icons.
- System health conventions: live/stale/degraded states for every data source, visible at the shell level.
- Telemetry display patterns: numeric readouts with units, trend indicators, and freshness timestamps.
- Workspace engineering: panel resizing, focus modes, persistent layout state. These inform HADAL's future workspace model (post-routing).

**What to adapt:**

- Ground Station targets satellite/mission operators. HADAL targets threat intelligence analysts. The operational context differs. HADAL should adopt the engineering rigor without the domain-specific interaction models.
- Ground Station's workspace density assumes trained operators. HADAL's audience includes analysts who may not be console operators. Information density should be high but legible without training.
- Ground Station's status patterns should inform HADAL's operational observability layer (stale data indicators, pipeline health) defined in HADAL_PLATFORM_PLAN.md.

**What to avoid:**

- Satellite-console cosplay. HADAL is not a ground station. Adopting the visual trappings (orbit tracks, signal strength bars, attitude indicators) without the underlying data creates a costume, not a product.
- Over-engineering the workspace model before routing exists. Ground Station's panel engineering is Phase 3+ work. Do not build workspace infrastructure before the 3-lane page shell is live.
- Using Ground Station aesthetics as a substitute for Green Fallout. Ground Station's visual language (typically blue/grey/white) is not HADAL's.

**Risk if overused:**
HADAL looks like a satellite operations console but processes RSS feeds and static JSON. The mismatch between the implied operational capability and the actual data pipeline undermines credibility.

---

## 3. External Source Stack

These systems do not donate architecture. They inform product positioning, set competitive benchmarks, and may contribute data in future phases.

---

### 3.1 LiveUAmap

**Classification:** Conflict mapping benchmark / potential future enrichment source

**Role in HADAL:**
LiveUAmap is the de facto standard for real-time conflict mapping. It benchmarks how event-to-map correlation should work: fast, geo-accurate, categorized, and timestamped. It may also become a future enrichment source if HADAL adds external event ingestion beyond its current RSS pipeline.

**What to keep:**

- Event-to-map correlation speed as a benchmark: if LiveUAmap shows an event on the map within minutes, HADAL's pipeline should target comparable freshness for its own sources.
- Category-color mapping conventions: users of conflict maps expect consistent color semantics for event types.
- Temporal navigation patterns: LiveUAmap's timeline slider sets expectations for historical browsing.

**What to adapt:**

- LiveUAmap is a map-first product. HADAL is a terminal-first product with a map workspace. The map is one surface, not the product.
- LiveUAmap's data is crowdsourced and aggregated. HADAL's data comes from its own pipeline. If LiveUAmap data is ingested in the future, it enters through the pipeline as an external source with its own trust tier — not as a replacement for Gulf Watch's sources.

**What to avoid:**

- Treating LiveUAmap as a design reference. Its UI is functional but not aligned with HADAL's aesthetic.
- Ingesting LiveUAmap data without source attribution and trust classification. External data enters the pipeline as `Unconfirmed` or `Partial` until verified.
- Building a LiveUAmap clone inside HADAL. The map workspace should serve HADAL's operational questions, not replicate LiveUAmap's global conflict view.

**Risk if overused:**
HADAL's map becomes a themed LiveUAmap embed with Green Fallout CSS. The product loses its terminal identity.

---

### 3.2 GDELT

**Classification:** Structured event taxonomy reference / potential future data enricher

**Role in HADAL:**
GDELT provides a massive structured event database with standardized taxonomy (CAMEO codes), global coverage, and historical depth. Its value to HADAL is as a taxonomy reference and as a potential future enrichment source for trend analysis and historical context.

**What to keep:**

- CAMEO event taxonomy as a reference for HADAL's own event classification. Not as a direct import, but as a maturity benchmark for how event types should be structured.
- Tone and sentiment scoring concepts — GDELT's approach to measuring event intensity may inform HADAL's severity scoring evolution.
- Historical depth as a future enrichment path. GDELT's archive could power HADAL's future Historical Archive surface (Analysis lane).

**What to adapt:**

- GDELT's taxonomy is broader than HADAL's theatre scope. HADAL should maintain its own focused event types (Missile, Drone, Airstrike, Security, Alert) and only reference GDELT's taxonomy for gaps or edge cases.
- GDELT's update cadence and data format differ from Gulf Watch's pipeline. Any future integration requires an ingestion adapter, not a schema replacement.

**What to avoid:**

- Replacing Gulf Watch's pipeline with GDELT ingestion. GDELT is a supplementary source, not a replacement for curated RSS + verification.
- Importing GDELT's full taxonomy into HADAL. HADAL's event model should stay focused on its theatre of operations.
- Treating GDELT scores as ground truth. GDELT is automated and unverified. Its data enters HADAL at the `Inferred` trust tier at best.

**Risk if overused:**
HADAL drowns in GDELT's global event firehose and loses its regional focus and curation quality.

---

### 3.3 WorldMonitor

**Classification:** Original product inspiration / UX benchmark

**Role in HADAL:**
WorldMonitor is cited in the README as the original inspiration for Gulf Watch. It sets the product-level benchmark for what a geopolitical monitoring platform looks like to end users: clean entry, clear situational awareness, accessible analysis.

**What to keep:**

- Product accessibility standard: WorldMonitor proves that intelligence platforms can be usable by non-specialists. HADAL should meet this bar even with its more tactical aesthetic.
- Information hierarchy patterns: WorldMonitor's approach to surfacing "what matters now" should inform HADAL's Overview page.
- User journey clarity: WorldMonitor's navigation model (clear destinations, not infinite scroll) validates HADAL's 3-lane architecture.

**What to adapt:**

- WorldMonitor's visual language is clean and modern. HADAL's Green Fallout aesthetic is deliberately different. The UX clarity should transfer; the visual style should not.
- WorldMonitor's scope is global. HADAL is theatre-focused (Middle East). HADAL can be denser and more specialized because it serves a narrower domain.

**What to avoid:**

- Using WorldMonitor as a design template. HADAL has its own visual identity.
- Matching WorldMonitor's feature breadth at the expense of HADAL's depth. HADAL should go deeper on fewer things, not wider.
- Treating WorldMonitor as a competitive target. HADAL and WorldMonitor serve different users at different depth levels.

**Risk if overused:**
HADAL becomes a dark-themed WorldMonitor clone and loses its operator-grade depth.

---

### 3.4 SOCRadar

**Classification:** Enterprise threat intelligence UX reference

**Role in HADAL:**
SOCRadar represents enterprise-grade threat intelligence UX: alert management, threat feeds, dark web monitoring, vulnerability tracking. It benchmarks how professional TI platforms structure information, manage alerts, and present risk scores.

**What to keep:**

- Alert management patterns: severity-based prioritization, alert grouping, acknowledgment workflows. These inform HADAL's future Alert Rules surface.
- Risk score presentation: SOCRadar's approach to surfacing composite risk scores is a reference for how HADAL presents theatre threat level and prediction confidence.
- Dashboard-to-detail navigation: SOCRadar's drill-down patterns (summary card → detailed view → raw evidence) should inform HADAL's incident feed interaction model.

**What to adapt:**

- SOCRadar is a cyber threat intelligence platform. HADAL is a geopolitical/kinetic threat intelligence terminal. The domain vocabulary differs entirely. Adopt the UX patterns, not the domain model.
- SOCRadar's enterprise conventions (multi-tenant, role-based dashboards, compliance features) are future HADAL concerns (Phase 6+ per HADAL_PLATFORM_PLAN.md). Do not front-load enterprise UX before auth exists.

**What to avoid:**

- Importing SOCRadar's feature set as a roadmap. HADAL's roadmap comes from the HADAL_MACRO_PLAN, not from competitive feature lists.
- Adopting SOCRadar's visual patterns. SOCRadar uses enterprise SaaS aesthetics (rounded cards, gradient charts, light/dark toggle). HADAL's Green Fallout aesthetic is non-negotiable.
- Building dark web monitoring or vulnerability tracking. Those are SOCRadar's domain, not HADAL's.

**Risk if overused:**
HADAL becomes an enterprise SaaS dashboard with a dark theme. The terminal identity and operator-grade feel disappear.

---

### 3.5 Pizzint

**Classification:** OSINT methodology reference

**Role in HADAL:**
Pizzint represents the OSINT practitioner's toolkit: source discovery, data collection methodology, verification workflows, and intelligence cycle practices. Its value to HADAL is methodological, not technical.

**What to keep:**

- Source verification methodology: Pizzint's approach to validating OSINT sources should inform how HADAL documents and audits its 48+ source list.
- Collection discipline: structured approaches to source management, refresh cadence, and coverage gaps.
- Intelligence cycle awareness: collection → processing → analysis → dissemination. HADAL's pipeline already follows this; Pizzint validates the pattern.

**What to adapt:**

- Pizzint targets individual OSINT analysts. HADAL targets platform users. The tooling expectations differ.
- Pizzint's methodology is manual and investigative. HADAL's pipeline is automated. The methodology informs quality standards, not workflow design.

**What to avoid:**

- Building OSINT investigation tools into HADAL. HADAL consumes processed intelligence; it is not an OSINT workbench.
- Adopting Pizzint's tooling recommendations (Maltego, SpiderFoot, etc.) as HADAL dependencies. HADAL's stack is defined and stable.
- Treating OSINT methodology as a user-facing feature. It should inform pipeline quality, not surface as UI.

**Risk if overused:**
HADAL tries to be an OSINT toolkit and loses its identity as a finished intelligence terminal.

---

## 4. Source Classification Matrix

| System | Architecture Donor | Ingestion Source | Product Benchmark | Future Enricher |
|--------|:-:|:-:|:-:|:-:|
| Gulf Watch | **Primary** | **Active** | — | — |
| MIT | **Selective** | — | — | — |
| Shadowbroker | — | — | **Geospatial** | — |
| Ground Station | **Console patterns** | — | **Systems UX** | — |
| LiveUAmap | — | — | **Conflict mapping** | **Phase 4+** |
| GDELT | — | — | **Taxonomy** | **Phase 5+** |
| WorldMonitor | — | — | **Product UX** | — |
| SOCRadar | — | — | **Enterprise TI** | — |
| Pizzint | — | — | — | — |

Reading this table:
- **Architecture Donor:** Directly shapes HADAL's code, structure, or visual language.
- **Ingestion Source:** Provides data that enters the pipeline.
- **Product Benchmark:** Sets the quality bar for a specific HADAL surface.
- **Future Enricher:** May provide supplementary data in later phases.

---

## 5. Synthesis: How HADAL Combines Without Cloning

HADAL's identity comes from a specific combination:

```
Gulf Watch capability
  + MIT analytical precision
  + Shadowbroker spatial standard
  + Ground Station instrument rigor
  + Green Fallout visual identity
  = HADAL
```

The rules that prevent cloning:

1. **Gulf Watch provides the data model and pipeline.** No other source replaces what Gulf Watch built. If HADAL's incident feed works, it is because Gulf Watch's pipeline works. This is the backbone — all other sources are secondary.

2. **MIT provides patterns, not product.** Every MIT-derived pattern must be re-implemented in HADAL's component tree, styled in Green Fallout, and connected to Gulf Watch data. If you cannot point to the Gulf Watch data source behind an MIT-style panel, the panel should not exist.

3. **Shadowbroker sets the bar, not the blueprint.** HADAL's map workspace should meet Shadowbroker's quality expectations for spatial intelligence. It should not replicate Shadowbroker's investigation workflow. HADAL's map serves the Operations lane question: "Where is it happening and what is active?"

4. **Ground Station informs engineering, not aesthetics.** Ground Station's value is in how it structures system state, telemetry, and workspace panels. HADAL should adopt the structural rigor without the satellite-ops visual language.

5. **External sources are context, not architecture.** LiveUAmap, GDELT, WorldMonitor, SOCRadar, and Pizzint inform HADAL's competitive position and may contribute future data. None of them should shape HADAL's component tree, data model, or visual language.

6. **Green Fallout is the visual owner.** No reference system's visual language overrides Green Fallout. MIT's kage patterns are adapted into Green Fallout. Shadowbroker's map density is rendered in Green Fallout. Ground Station's instrument panels are styled in Green Fallout. The aesthetic is non-negotiable.

---

## 6. Implementation Guidance by Lane

### 6.1 Overview Lane

| Source | Influence | Scope |
|--------|-----------|-------|
| Gulf Watch | Hero data, missile strip data, feed data, threat posture | Direct — all data comes from GW pipeline |
| MIT | Kage grid layout, panel density, corner bracket styling | Visual pattern only — applied to GW data |
| WorldMonitor | Information hierarchy benchmark | Reference — "what matters now" should be answerable in seconds |
| Ground Station | Topbar instrument patterns, system health indicators | Shell-level patterns for pressure gauge, clock, alert strip |

**Upstream adaptation targets:**
- Mobile filtering improvements (country/severity) from upstream should inform how Overview's condensed feed handles filtering on small viewports. This is UX discipline, not cosmetics — filtering determines what a mobile user sees first.

**Implementation rule:** Every panel on Overview must render Gulf Watch data. MIT and Ground Station patterns style the presentation. WorldMonitor validates the information hierarchy.

### 6.2 Operations Lane

| Source | Influence | Scope |
|--------|-----------|-------|
| Gulf Watch | Incident markers, airspace data, casualty data, posturing data | Direct — all map content from GW pipeline |
| Shadowbroker | Spatial intelligence density, layer management, geospatial precision | Quality benchmark for map workspace |
| MIT | Tactical rail layout, telemetry panel density | Panel engineering patterns |
| Ground Station | Workspace panel engineering, status boards | Console patterns for multi-panel workspace |
| LiveUAmap | Event-to-map correlation speed, category-color mapping | Benchmark — not architecture |

**Upstream adaptation targets:**
- Aircraft/OpenSky proxy hardening (auth, caching, rate-limiting) from upstream directly enables HADAL's FlightTracker component. The original Gulf Watch had working OpenSky integration — it was lost in the React migration. Nikola's upstream fixes make reconnection viable. This is the highest-priority upstream adaptation for Operations.
- Layer count accuracy: upstream incident data improvements mean HADAL's IwlLeftPanel layer counts can be derived from live data instead of hardcoded values.

**Implementation rule:** The Operations map workspace should meet Shadowbroker's spatial quality bar using Gulf Watch's data. MIT and Ground Station inform panel engineering. LiveUAmap benchmarks correlation speed.

### 6.3 Analysis Lane

| Source | Influence | Scope |
|--------|-----------|-------|
| Gulf Watch | Prediction inputs, economic data, incident history | Direct — all analytical inputs from GW pipeline |
| MIT | Bootstrap prediction math, analytical display patterns | Selective pattern donor for prediction module |
| SOCRadar | Risk score presentation, alert management patterns | UX reference for future alert rules and risk dashboards |
| GDELT | Event taxonomy completeness, historical depth | Future enrichment for trend analysis |
| Ground Station | Telemetry trend display, metric readout engineering | Patterns for prediction output display |

**Upstream adaptation targets:**
- Prediction engine enhancements (14-day focus, trend analysis, escalation alerts) from upstream are the highest-priority Analysis adaptation. HADAL's PredictorEngine already runs MIT-adapted local math on Gulf Watch data — Nikola's upstream improvements to the prediction parameters, trend windows, and alert thresholds should be evaluated and ported. These are logic improvements, not cosmetic changes.
- Escalation alert logic from upstream could inform HADAL's future Alert Rules surface (Operations lane, Phase 5+).

**Implementation rule:** Analysis surfaces present Gulf Watch data through MIT-informed analytical patterns. SOCRadar and GDELT inform future surfaces (Alert Rules, Historical Archive) but do not shape the current build.

---

## 7. Anti-Patterns

### 7.1 Prettier Gulf Watch Clone

**Symptom:** HADAL has the same single-scroll layout with better CSS. No structural improvement.
**Cause:** Gulf Watch's presentation was kept alongside its capability, instead of separating the two.
**Test:** If removing the Green Fallout stylesheet makes HADAL indistinguishable from Gulf Watch, this anti-pattern is active.
**Fix:** Enforce 3-lane separation. Gulf Watch provides capability; HADAL provides structure.

### 7.2 MIT Transplant

**Symptom:** HADAL's component tree mirrors MIT's. Panels exist that display MIT-shaped data that Gulf Watch's pipeline does not produce.
**Cause:** MIT patterns were imported as product features instead of presentation patterns.
**Test:** For every MIT-style panel, ask: "What Gulf Watch data source populates this?" If the answer is "none" or "we would need to build that," the panel should not exist yet.
**Fix:** Every panel must trace to a Gulf Watch pipeline output. No orphan panels.

### 7.3 Shadowbroker Clone

**Symptom:** HADAL's Operations page looks like a themed Shadowbroker with markers over Leaflet tiles but cannot deliver on the implied spatial investigation depth.
**Cause:** Shadowbroker's visual density was copied without its data infrastructure.
**Test:** Can a user click a map element and get meaningful spatial intelligence (provenance, confidence, temporal context)? If not, the density is decorative.
**Fix:** Map density must match data depth. Do not add visual layers without data sources behind them.

### 7.4 Satellite-Console Cosplay

**Symptom:** HADAL has orbit tracks, signal strength bars, attitude indicators, and telemetry panels that process RSS feeds.
**Cause:** Ground Station's visual trappings were adopted without its operational context.
**Test:** Does the UI vocabulary match the data being displayed? If a panel says "TELEMETRY" but shows RSS timestamps, the vocabulary is wrong.
**Fix:** Adopt Ground Station's structural patterns (workspace engineering, status boards) without its domain-specific visual vocabulary.

### 7.5 Fake Intelligence Density

**Symptom:** Panels are full of numbers, bars, and indicators that are either static, hardcoded, or derived from trivial calculations — but presented as operational intelligence.
**Cause:** Visual density was prioritized over information quality. Panels were added for aesthetic reasons.
**Test:** For every metric displayed, ask: "When did this number last change? What would cause it to change? Who acts on this number?" If the answers are "never," "nothing," and "nobody," the metric is decorative.
**Fix:** Every displayed metric must have a data source, an update trigger, and a user action it informs. Remove metrics that fail this test.

### 7.6 Unsourced Operational Metrics

**Symptom:** HADAL displays metrics labeled as "THREAT LEVEL," "CONTAGION," "CASCADE" without documenting how they are computed, what inputs they use, or what confidence level they carry.
**Cause:** Metrics were designed for visual impact rather than analytical rigor.
**Test:** Can a user inspect the methodology behind any displayed metric? Is the computation documented? Is the confidence level shown?
**Fix:** Every operational metric must have: (1) a documented computation method, (2) named data inputs, (3) a confidence or freshness indicator, (4) a label that matches what the metric actually measures.

---

## 8. Reference Decision Checklist

When making an implementation decision that draws from a reference system, answer these questions:

1. **Which reference system is this from?** Name it explicitly.
2. **Is this system an architecture donor, benchmark, or enricher?** Check the classification matrix (Section 4).
3. **Does the Gulf Watch pipeline produce the data this pattern needs?** If not, the pattern is premature.
4. **Is this a pattern adoption or a wholesale import?** Patterns are adapted into HADAL's stack. Imports create dependencies.
5. **Does this reinforce or dilute HADAL's identity?** If it makes HADAL look more like the source system than like HADAL, it dilutes.
6. **Which lane does this affect?** Every change lands in Overview, Operations, or Analysis.
7. **Is this Green Fallout compatible?** Visual patterns must render in HADAL's design tokens.

If any answer is unclear, the implementation should wait until it is clarified.

---

## 9. Document Hierarchy

This document sits in the architecture stack as follows:

```
SYSTEM_BOUNDARIES.md      — who owns what (Gulf Watch / HADAL / MIT)
HADAL_REFERENCE_HIERARCHY.md  — what HADAL takes from each source (this document)
HADAL_PLATFORM_PLAN.md    — how HADAL is built (architecture + phases)
HADAL_MACRO_PLAN.md       — delivery sequence and extraction order
HADAL_PAGE_ARCHITECTURE.md — 3-lane page structure
HADAL_BLUEPRINT.md        — 7-layer pipeline stack
```

SYSTEM_BOUNDARIES.md established the original triangle (Gulf Watch / HADAL / MIT). This document extends that triangle into a full reference hierarchy that includes Shadowbroker, Ground Station, and the external source stack. The boundaries defined in SYSTEM_BOUNDARIES.md still hold. This document adds precision.
