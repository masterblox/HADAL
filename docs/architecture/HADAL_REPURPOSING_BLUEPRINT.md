# HADAL Repurposing Blueprint

## Purpose

This document defines how HADAL should repurpose the original Gulf Watch codebase into a disciplined threat-intelligence product.

The goal is not to discard Nicola's feature invention. The goal is to preserve the product intelligence he originated, while rebuilding the architecture around it so the system becomes maintainable, extensible, and operator-grade.

---

## Core Decision

HADAL should treat the original Gulf Watch repo as:

- a validated feature inventory
- a usable ingestion and export baseline
- a legacy frontend reference

HADAL should **not** treat it as the final application architecture.

That means:

- keep the product logic where it works
- keep the data contracts where they are useful
- keep the domain concepts and operator workflows
- replace the presentation architecture
- progressively isolate pipeline responsibilities

---

## What Nicola Actually Contributed

The original system already defines the main HADAL product pillars:

- incident feed
- deduplication / circuit breaker
- cross-source verification
- coordinate enrichment
- map theatre and live layers
- analytics panels
- prediction concepts
- airspace / defense visibility
- exportable machine-readable artifacts

Those product pillars remain valid. The architecture around them is what needs to be tightened.

---

## Repurposing Rule Set

### 1. Preserve domain features, not implementation shape

If Gulf Watch solved a real operator need, HADAL keeps the capability.

If Gulf Watch solved it in a monolithic or fragile way, HADAL reimplements it cleanly.

### 2. Separate source-of-truth logic from UI behavior

Anything related to:

- ingestion
- normalization
- scoring
- grouping
- geo enrichment
- derived metrics

must live outside the browser.

### 3. Archive legacy rather than pretending it never existed

The legacy frontend remains useful as a behavioral and interaction reference.

It should live in `legacy/` as a source of truth for:

- panel composition
- feature completeness
- copy patterns
- interaction expectations

### 4. Build HADAL around contracts

The UI should consume stable artifacts, not reverse-engineer logic from raw data.

---

## Source System → HADAL Mapping

### A. Data Pipeline

**Original Gulf Watch role**

- RSS fetching
- source keyword filtering
- location extraction
- casualty extraction
- incident typing
- static JSON generation

**HADAL decision**

- **Keep**

**Reason**

This is the most reusable part of the repo and already produces working intelligence artifacts.

**Required changes**

- split scripts by responsibility
- formalize schemas
- remove product naming leakage
- replace brittle path assumptions
- add clearer versioning and tests around outputs

**Target HADAL modules**

- `scripts/ingestion/*`
- `scripts/normalization/*`
- `scripts/enrichment/*`
- `scripts/exports/*`

---

### B. Circuit Breaker

**Original Gulf Watch role**

- duplicate filtering
- recap filtering
- signature generation
- lightweight confidence tagging

**HADAL decision**

- **Keep, then harden**

**Reason**

This is core product IP. The circuit breaker is one of the most valuable differentiators in the upstream system.

**Required changes**

- preserve the current threshold and behavior unless a measured audit proves otherwise
- expose reason codes more explicitly
- separate dedupe logic from confidence scoring
- log merges and suppressions for analyst auditability

**Target HADAL modules**

- `scripts/verification/circuit_breaker.py`
- `public/data/circuit_breaker_audit.json`

---

### C. Cross-Source Verification

**Original Gulf Watch role**

- group similar incidents
- assign verification status and score
- publish grouped verification artifacts

**HADAL decision**

- **Keep, then normalize**

**Reason**

This is a direct fit for HADAL's trust model.

**Required changes**

- unify score fields and enum names
- define one canonical verification contract
- ensure each incident carries its verification lineage back to source group ids

**Target HADAL modules**

- `scripts/verification/cross_source.py`
- `public/verified_incidents.json`
- `public/data/verification_summary.json`

---

### D. Geospatial Enrichment

**Original Gulf Watch role**

- location extraction from title/content
- city/country fallback coordinates
- event marker positioning

**HADAL decision**

- **Keep, then make precision explicit**

**Reason**

The product needs coordinates everywhere, but HADAL must be honest about precision.

**Required changes**

- add `geo_precision`
- separate exact vs estimated coordinates
- version lookup tables
- keep fallback behavior but surface confidence

**Target HADAL modules**

- `scripts/enrichment/geospatial.py`
- `public/data/geo_reference.json`

---

### E. Legacy Frontend

**Original Gulf Watch role**

- full multi-panel dashboard
- tabs
- feed behavior
- map interactions
- side-rail widgets

**HADAL decision**

- **Archive and mine for behavior**

**Reason**

It is feature-rich but structurally too monolithic for the target product.

**Required changes**

- use as a feature reference only
- extract panel responsibilities into React modules
- keep interaction logic that still serves operator workflow
- discard UI coupling and direct DOM mutation patterns

**Target HADAL modules**

- `src/components/layout/*`
- `src/components/panels/*`
- `src/components/map/*`
- `src/state/*`

---

### F. `hadal.html`

**Current HADAL role**

- visual identity prototype
- tactical terminal aesthetic
- future UI direction

**HADAL decision**

- **Use as design source, not final architecture**

**Reason**

It captures the desired feel, but as a large standalone file it should not become the long-term application structure.

**Required changes**

- preserve visual system
- port the shell and modules into React
- move data loading into services
- isolate map and feed rendering

**Target HADAL modules**

- `src/components/shell/*`
- `src/styles/tokens.css`
- `src/styles/terminal.css`

---

### G. Tracking Layers (Aircraft / Maritime / Satellite / Airspace)

**Original Gulf Watch role**

- map overlays
- proxy-backed tracking
- NOTAM visibility

**HADAL decision**

- **Adapt selectively**

**Reason**

The capability is valuable, but some implementations are placeholder or operationally unsafe.

**Required changes**

- move secrets to env vars only
- mark simulated layers clearly
- separate real vs demo data sources
- load overlays on demand

**Target HADAL modules**

- `api/aircraft.js`
- `src/components/map/layers/*`
- `src/services/airspace.ts`

---

### H. Prediction Engine

**Original Gulf Watch role**

- rule-based recent-pattern prediction
- escalation alerts
- actor/action/target scenario flows

**HADAL decision**

- **Retain as a labeled analytical module**

**Reason**

Prediction belongs in the product, but must remain clearly separated from confirmed reporting.

**Required changes**

- label all outputs as model-derived
- isolate from core incident truth layer
- define clear inputs and explainability fields

**Target HADAL modules**

- `src/components/panels/prediction/*`
- `public/data/prediction_snapshot.json`

---

### I. Reports / False-Claim Workflow

**Original Gulf Watch role**

- user report endpoint
- hidden-incident threshold behavior
- client-side moderation helper

**HADAL decision**

- **Keep the concept, re-evaluate persistence**

**Reason**

The operator feedback loop matters, but flat-file persistence is not a durable long-term design.

**Required changes**

- keep endpoint behavior simple in the short term
- move to proper persistence later
- keep rate and abuse controls out of frontend logic

**Target HADAL modules**

- `api/report.py`
- future `supabase` or database-backed moderation store

---

## Keep / Adapt / Replace / Drop Table

| Area | Decision | Notes |
|------|----------|-------|
| RSS ingestion | Keep | Core input layer is already useful |
| Circuit breaker | Keep | Preserve threshold and audit behavior |
| Verification grouping | Keep | Normalize schema and lineage |
| Geo extraction | Keep | Add explicit precision model |
| Static JSON exports | Keep | Treat as frontend contracts |
| Legacy UI architecture | Replace | Feature reference only |
| `hadal.html` visual system | Adapt | Port design, not file structure |
| Direct DOM-heavy rendering | Replace | Move to React components/state |
| Hardcoded secrets | Drop | Env vars only |
| Sample / simulated sources | Adapt | Clearly labeled, isolated |
| Prediction module | Adapt | Separate from confirmed intelligence |
| User reports concept | Keep | Persistence model should evolve |

---

## Ownership Model

### Nicola / Product source

Owns:

- feature intent
- operational workflows
- what matters to the user
- what panels and signals are important

Does not need to own:

- frontend architecture
- component boundaries
- build system
- state design
- schema discipline

### HADAL architecture owner

Owns:

- application structure
- migration sequencing
- contracts and interfaces
- system boundaries
- frontend modularization
- deployment and maintainability

This split is important. The product invention is not the same job as the application architecture.

---

## Phased Migration Plan

### Phase 1: Stabilize the baseline

- keep legacy app archived
- preserve working JSON outputs
- keep `hadal.html` as visual reference
- ensure buildable Vite shell exists

### Phase 2: Create contracts

- define canonical incident schema
- define verification schema
- define geo precision schema
- define panel input contracts

### Phase 3: Rebuild shell

- top bar
- command rail
- feed rail
- map theatre
- panel layout

### Phase 4: Reattach intelligence modules

- incidents
- verification
- airspace
- finance
- defense
- analytics

### Phase 5: Add advanced systems

- co-pilot
- prediction module
- authenticated analyst workflows
- persistent moderation / reports

---

## Non-Negotiables

- do not reintroduce secrets into source
- do not let the browser become the scoring engine
- do not collapse the app back into a single giant file
- do not remove the circuit breaker casually
- do not blur confirmed reporting with prediction output
- do not throw away legacy references before the new module exists

---

## Definition of Success

The repurposing is successful when HADAL:

- preserves the upstream product intelligence
- improves trust and maintainability
- keeps stable machine-readable artifacts
- replaces monolithic UI structure with modules
- makes ownership and architecture legible to the team

That is the standard for repurposing Gulf Watch into HADAL.
