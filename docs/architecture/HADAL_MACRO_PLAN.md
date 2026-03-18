# HADAL Macro Plan

This is the macro execution plan for turning HADAL from a single-scroll prototype shell into a user-facing product structure.

This document is not the page blueprint itself. It is the delivery sequence, ownership logic, and dependency order for the next major phase.

Use it with:

- [HADAL_PAGE_ARCHITECTURE.md](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/docs/architecture/HADAL_PAGE_ARCHITECTURE.md)
- [SYSTEM_BOUNDARIES.md](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/docs/architecture/SYSTEM_BOUNDARIES.md)

---

## Strategic Goal

Move HADAL from:

- one dense infinite-scroll intelligence canvas

to:

- a clear user-facing product with page-level task separation
- cleaner frontend boundaries
- predictable extraction order
- lower cognitive load for non-internal users

The macro objective is not "more pages."

It is:

1. clearer user journeys
2. cleaner module ownership
3. lower implementation chaos
4. a better base for prediction, reporting, and future government-facing workflows

---

## Product Model

HADAL should separate into three product lanes:

### 1. Overview

Question answered:

`What is happening now?`

Responsibilities:

- current operating picture
- top-level threat posture
- condensed feed and theater summary

### 2. Operations

Question answered:

`Where is it happening and what is active right now?`

Responsibilities:

- live map workspace
- airspace
- casualties
- posturing
- tactical overlays and telemetry

### 3. Analysis

Question answered:

`What does it mean, what may happen next, and what should users do with it?`

Responsibilities:

- economics
- prediction
- future `ICEBERG`
- reporting / exports / historical analysis

---

## Non-Negotiable Principles

- HADAL is user-facing, not an internal-only cockpit.
- Gulf Watch capability should be preserved, but not preserved as one giant scroll.
- Gulf Watch is a live upstream, not a frozen reference. Nikola ships meaningful human feature commits (prediction improvements, tracking reliability, mobile filtering) that must be tracked and selectively adapted into HADAL's lanes. Automated data-refresh commits are consumed automatically and require no adaptation.
- MIT density is a reference, not a user-experience target.
- No major logic should remain trapped in decorative homepage stacking.
- The map workspace must become a destination, not a buried section.
- Prediction must not be introduced as an API-dependent gimmick before the local data and math model are stable.
- Reporting and exports should not clutter the homepage.

---

## Phase Plan

## Phase 0: Stabilize The Ground

Objective:

- stop adding new sections to the scroll
- freeze the current shape long enough to extract cleanly

Tasks:

- lock the three-page architecture
- keep repo organization stable
- avoid casual new modules in `App.tsx`
- document current page ownership

Exit condition:

- everyone builds against the same page model

---

## Phase 1: Introduce Page Shell

Objective:

- create the structural frame for the three-page product

Tasks:

- add top-level routing or page state
- define `Overview`, `Operations`, and `Analysis`
- create placeholder pages with stable titles and navigation
- keep existing modules intact while relocating them

Implementation rule:

- routing first
- internal redesign later

Exit condition:

- HADAL no longer depends on one infinite scroll for its product structure

---

## Phase 2: Extract Operations

Objective:

- turn the current embedded intelligence workspace into its own destination

Source:

- [IntelWireSection.tsx](/Users/carlosprada/Library/Mobile%20Documents/com~apple~CloudDocs/HADAL/src/components/intel/IntelWireSection.tsx)

Tasks:

- move `IntelWireSection` to `Operations`
- preserve existing internal tabs:
  - map
  - airspace
  - casualties
  - posturing
- keep current left/right tactical rail logic intact for the first pass

Reason:

- this is the highest-value extraction with the lowest ambiguity

Exit condition:

- the live operational workspace is no longer buried in the homepage scroll

---

## Phase 3: Rebuild Overview

Objective:

- make the homepage useful for first-contact users

Tasks:

- keep `HeroGrid`
- keep `MissileDefenseStrip`
- keep a shortened `ThreatFeed`
- remove the deep ops workspace from the page
- add clear navigation into `Operations` and `Analysis`

Overview should become:

- orientation
- summary
- current picture

Not:

- full workstation

Exit condition:

- the homepage reads as a usable landing/intelligence summary page

---

## Phase 4: Stand Up Analysis

Objective:

- give prediction and deeper structured intelligence a real home before overbuilding them

Tasks:

- move `EconomicSection` into `Analysis`
- add prediction placeholder
- add reporting/export placeholder
- define the future slot for `ICEBERG`

Implementation rule:

- page exists before advanced engines are fully finished

Exit condition:

- prediction and reporting stop being "future things somewhere in the scroll"

---

## Phase 5: Prediction Foundation

Objective:

- implement prediction as a local, inspectable engineering module before any backend/API work

Inputs:

- Gulf Watch data artifacts
- MIT empirical/bootstrap logic

Tasks:

- normalize verified incidents into HADAL prediction inputs
- port/adapt local bootstrap math
- combine with Gulf Watch sequence logic
- produce frontend-safe output contract
- wire first prediction card/module into `Analysis`

Rules:

- local math first
- no remote API dependence
- no backend-first shortcut

Exit condition:

- HADAL has a working local prediction core

---

## Phase 6: Reporting And User Workflows

Objective:

- support real user actions, not just passive reading

Tasks:

- design reporting/export workflow inside `Analysis`
- define user-safe exports
- define archive/history handling
- separate admin-adjacent actions from homepage content

Exit condition:

- HADAL starts behaving like a real product, not just an intelligence wall

---

## Upstream Adaptation Note

Gulf Watch upstream improvements do not create new phases. They slot into existing phases:

| Upstream Change | Slots Into | Rationale |
|----------------|-----------|-----------|
| Prediction enhancements (14-day focus, trend analysis, escalation alerts) | Phase 5 (Prediction Foundation) | Improves existing prediction math — port parameters, not rewrite |
| Aircraft/OpenSky proxy hardening (auth, cache, rate-limit) | Phase 2 (Extract Operations) | Enables FlightTracker reconnection once Operations is a standalone page |
| Mobile filtering improvements (country/severity) | Phase 3 (Rebuild Overview) | UX discipline for condensed feed on small viewports |

See `HADAL_IMPLEMENTATION_MATRIX.md §4A` for the full adaptation queue with priorities and target files.

---

## Module Ownership

### Overview owns

- `HeroGrid`
- `MissileDefenseStrip`
- compact `ThreatFeed`
- top-level threat posture summaries

### Operations owns

- `IntelWireSection`
- `AirspaceTab`
- `CasualtiesTab`
- `PosturingTab`
- map layers / telemetry / tactical interactions

### Analysis owns

- `EconomicSection`
- prediction
- future `ICEBERG`
- report/export workflows

---

## Dependency Order

The work should happen in this order:

1. page shell
2. Operations extraction
3. Overview simplification
4. Analysis placeholder
5. prediction foundation
6. reporting workflows

Do not reverse this by trying to finish prediction before the page architecture exists.

---

## Tomorrow Morning Priorities

If there is limited time, do these in order:

1. implement routing / page shell
2. move `IntelWireSection` into `Operations`
3. trim homepage into `Overview`
4. stub `Analysis`

If there is extra time:

5. define local prediction module contract

If there is still extra time:

6. wire the first prediction placeholder card into `Analysis`

---

## Success Criteria

This macro phase is successful when:

- HADAL is no longer one infinite scroll
- the map workspace has its own page
- the homepage is faster to read and easier to understand
- prediction has a proper destination
- tomorrow's implementation work has a clear order with low ambiguity

---

## Final Read

The next phase of HADAL is not about adding more visual material.

It is about separating:

- the operating picture
- the operational workspace
- the analytical layer

That separation is the foundation for everything else.
