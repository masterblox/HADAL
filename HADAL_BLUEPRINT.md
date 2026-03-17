# HADAL Blueprint

## Status

**Coming soon:** HADAL is the next-generation intelligence terminal for this repo. The existing Gulf Watch stack remains the current production reference; HADAL should be built as a stricter, more modular system rather than a visual reskin.

---

## Product Intent

HADAL should operate as a threat-intelligence terminal focused on:

- high-signal incident monitoring
- cross-source confidence scoring
- regional airspace and defense visibility
- operator-grade speed, readability, and auditability

The product standard is not "more features." The standard is:

- faster comprehension
- cleaner trust model
- clearer separation between ingestion, analysis, and presentation
- easier future expansion into prediction, alerting, and private analyst workflows

---

## Blueprint Principles

### 1. Separate the pipeline from the interface

Do not let UI code own data shaping rules. HADAL should treat the frontend as a rendering client over well-defined processed datasets.

**Rule:** raw ingestion, normalization, scoring, and export generation belong in backend/scripts or build steps, not in the browser.

### 2. Prefer composable modules over one large page

The current repo includes large single-file surfaces. HADAL should move toward isolated modules with explicit responsibilities.

**Rule:** every major domain gets one owner:

- ingestion
- verification
- geospatial enrichment
- analytics
- delivery/API
- terminal UI

### 3. Design for degraded operation

HADAL should still render a coherent terminal when live feeds fail.

**Rule:** every external dependency needs a fallback path:

- live fetch -> cached JSON
- derived analytics -> last successful snapshot
- optional overlays -> silent disable, not full-app failure

### 4. Trust is a first-class feature

Analysts need to understand why an item appears and how much confidence it deserves.

**Rule:** every surfaced incident should carry:

- source lineage
- verification state
- timestamp freshness
- geographic confidence
- processing path or classifier origin where relevant

### 5. Build for operator workflow, not brochure UX

HADAL should feel like an instrument panel.

**Rule:** default views should emphasize:

- current threat state
- recent changes
- critical anomalies
- actionability

---

## Target Architecture

```text
Sources
  -> ingestion adapters
  -> normalization layer
  -> deduplication / circuit breaker
  -> verification engine
  -> geospatial enrichment
  -> analytics + scoring
  -> published JSON/API artifacts
  -> HADAL terminal UI
```

### Layer 1: Source Ingestion

Responsibility:

- collect RSS, airspace, pricing, and other external inputs
- isolate source-specific parsing logic
- enforce timeout, retry, and response validation rules

Guidelines:

- one adapter per source family
- no source-specific parsing inside shared scoring code
- normalize timestamps to UTC before downstream processing
- mark partial fetches explicitly instead of failing silently

### Layer 2: Normalization

Responsibility:

- convert raw source records into a shared event schema

Minimum normalized event shape:

```json
{
  "id": "stable-event-id",
  "title": "short human-readable summary",
  "timestamp": "2026-03-17T12:00:00Z",
  "country": "uae",
  "region": "gulf",
  "event_type": "missile",
  "severity": "high",
  "sources": [],
  "raw_source_count": 3
}
```

Guidelines:

- define one canonical enum set for severity, event type, and verification status
- produce stable ids before UI delivery
- preserve raw evidence fields separately from display fields

### Layer 3: Deduplication and Verification

Responsibility:

- collapse repeated reports into a single event
- assign confidence and verification state

Guidelines:

- keep signature generation deterministic
- split "same event" logic from "confidence scoring" logic
- persist reason codes for merges and downgrades

Recommended outputs:

- `canonical_event_id`
- `duplicate_of`
- `verification_status`
- `confidence_score`
- `confidence_reasons`

### Layer 4: Geospatial Enrichment

Responsibility:

- attach coordinates, area metadata, and map precision

Guidelines:

- store both coordinates and precision tier
- never pretend estimated coordinates are exact
- keep geocoding lookup tables versioned and testable

Recommended outputs:

- `lat`
- `lon`
- `location_label`
- `geo_precision`

### Layer 5: Analytics and Threat Scoring

Responsibility:

- compute dashboard aggregates and forward-looking heuristics

Guidelines:

- derived metrics must be reproducible from published inputs
- separate descriptive analytics from predictive logic
- label all forecasts as model-derived, never as confirmed intelligence

Recommended split:

- `analytics/summary`
- `analytics/trends`
- `analytics/defense`
- `analytics/prediction`

### Layer 6: Delivery Surface

Responsibility:

- publish stable machine-readable artifacts for frontend and external consumers

Preferred outputs:

- `/public/incidents.json`
- `/public/verified_incidents.json`
- `/public/prices.json`
- `/public/airspace.json`
- `/public/data/*.json`

Guidelines:

- treat output schemas as contracts
- version schemas when breaking fields
- keep UI-only decoration out of shared public artifacts

### Layer 7: HADAL Terminal UI

Responsibility:

- render intelligence artifacts with minimal client-side mutation

Guidelines:

- split UI into modules, not one monolith
- centralize state shape and fetch orchestration
- keep presentational logic separate from threat calculations
- reserve the browser for interaction, filtering, and rendering

Preferred UI domains:

- shell/topbar
- incident rail
- map theatre
- analytics panels
- defense systems panel
- command actions/export

---

## Repository Direction

HADAL should move this repo toward the following structure over time:

```text
api/
  report.py
  aircraft.js

scripts/
  ingestion/
  normalization/
  verification/
  enrichment/
  analytics/
  exports/

public/
  data/
  js/
    core/
    modules/
    services/
  css/
    tokens/
    layout/
    components/

docs/
  architecture/
  operations/
```

This does not require an immediate full refactor. The immediate goal is to enforce these boundaries in all new HADAL work.

---

## Frontend Architecture Guidelines

### UI composition

- keep each panel independently renderable
- avoid hidden coupling across tabs
- prefer explicit render functions per domain panel

### State management

- maintain one source of truth for fetched datasets
- derive filtered views from raw published artifacts
- avoid mutating source arrays in-place

### Styling

- define design tokens first
- separate theme tokens from component styles
- keep HADAL visual identity distinct, but do not bury semantics under effects

### Performance

- fetch in parallel where datasets are independent
- debounce search and expensive filtering
- load heavy map overlays on demand

### Accessibility

- preserve keyboard navigation across terminal controls
- maintain contrast despite the dark tactical aesthetic
- do not use color alone for severity or verification cues

---

## Security and Reliability Guardrails

- never expose admin credentials or trust secrets in client code
- sanitize all user-originated or third-party text before DOM insertion
- treat every external feed as untrusted input
- make stale-data state visible in the UI
- log failures with enough context to diagnose source outages
- prefer fail-soft behavior for optional panels and fail-closed behavior for privileged actions

---

## Build Order

### Phase 1: Contracts

- define HADAL canonical event schema
- define output artifact schemas
- define verification and geo precision enums

### Phase 2: Pipeline hardening

- isolate ingestion adapters
- separate normalization from fetch logic
- formalize dedupe and scoring outputs

### Phase 3: UI shell

- build HADAL shell, topbar, and primary layout
- connect to stable JSON artifacts only
- keep live calculations out of the first UI pass

### Phase 4: Intelligence panels

- incident rail
- map overlays
- threat summary
- defense and airspace modules

### Phase 5: Advanced systems

- prediction engine
- analyst workflows
- alerting and report review
- authenticated private operator tooling

---

## Non-Goals

Avoid these traps while building HADAL:

- rebuilding the entire system as a single HTML file
- mixing speculative prediction output with confirmed incident reporting
- hardcoding UI-specific labels into source-processing scripts
- introducing live dependencies without cached fallbacks
- using aesthetic complexity to hide weak information architecture

---

## Definition of Done for HADAL Architecture Work

An architecture task is only complete when:

- module boundaries are explicit
- inputs and outputs are documented
- fallback behavior is defined
- trust/confidence fields are preserved through the stack
- the UI can consume artifacts without re-implementing backend logic

That is the standard HADAL should hold before expanding feature count.
