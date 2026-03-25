# HADAL Palantir Pattern Digest

**Status:** Active reference
**Purpose:** Capture the Palantir `build.palantir.com` patterns that are useful to HADAL without treating Palantir as a source system.
**Relates to:** [SYSTEM_BOUNDARIES.md](SYSTEM_BOUNDARIES.md), [HADAL_REFERENCE_HIERARCHY.md](HADAL_REFERENCE_HIERARCHY.md), [HADAL_PAGE_ARCHITECTURE.md](HADAL_PAGE_ARCHITECTURE.md)

This document exists to stop a common mistake:

- Palantir is **not** a donor codebase for HADAL.
- Palantir is **not** a replacement for Gulf Watch as capability source.
- Palantir **is** a high-quality architecture reference for institutional operational software.

Use Palantir examples to understand **surface architecture**, **information density**, and **operator workflow patterns**. Do not copy their product structure blindly and do not let these references override the current lane model.

---

## 1. Reference Classification

Palantir belongs in the same class as a benchmark/reference system, not a source system:

```text
Gulf Watch = live capability backbone
HADAL      = target product shell
MIT        = selective donor
Palantir   = institutional architecture reference
```

Palantir contributes:

- page composition patterns
- workbench/navigation patterns
- dense object-view organization
- decision-support interaction patterns

Palantir does **not** contribute:

- HADAL's threat model
- HADAL's lane model
- HADAL's design identity
- HADAL's source data contracts

---

## 2. Key Palantir References

### 2.1 Common Operating Picture

Reference observed:
- `Build a common operating picture with geospatial data`

Core pattern:
- one shared operational surface
- geospatial context as the center of gravity
- top-line metrics for quick leadership orientation
- filters and tables close to the map, not on separate pages
- charts and summaries supporting decision-making in the same surface

What HADAL should borrow:
- the idea that the top-level theatre surface is a **shared operating picture**, not just a visual hero
- top metrics, map context, and filtered summaries should reinforce one another
- the landing surface should answer "what is happening now?" quickly and densely

What HADAL should not borrow:
- Palantir's visual language
- generic enterprise card styling
- platform-specific Workshop assumptions

HADAL mapping:
- `Overview` should behave like HADAL's common operating picture
- `Maps` should provide the deeper geospatial workspace that the COP points into

---

### 2.2 Navigation Bar with URL Routing

Reference observed:
- `Navigation Bar with URL Routing in Workshop`

Core pattern:
- collapsible vertical navigation
- single-page tabbed/workbench environment
- URL state is shareable and routable
- operators can move between views without losing context

What HADAL should borrow:
- lane and subview navigation should be stateful and shareable
- deeper workbench areas should support internal navigation without becoming separate products
- routing should reflect user context, not just static page names

What HADAL should not borrow:
- Workshop-specific assumptions about module headers
- unnecessary nav complexity before the lane model stabilizes

HADAL mapping:
- `Topbar` stays as lane switcher
- future `Console` workbench can adopt deeper routed subviews
- `Maps` can eventually support internal tab state without re-opening the full architecture

---

### 2.3 Scaling Full Object Views with Information Density

Reference observed:
- `Scaling full object views with information density`

Core pattern:
- density should scale in stages
- richer information requires stronger grouping and hierarchy
- object views should gain structure as complexity rises
- dense interfaces fail when everything is treated as one flat layer

What HADAL should borrow:
- Overview, Maps, and Console should each have an explicit density strategy
- dense modules need stronger structural grouping, not more whitespace or more cards
- high-density surfaces should separate orientation, details, and actions

What HADAL should not borrow:
- generic object-view nomenclature if it obscures the operator flow
- enterprise CRUD framing where HADAL needs intelligence framing

HADAL mapping:
- `Overview` = orientation density
- `Maps` = operational detail density
- `Console` = action and analysis density

This is the strongest argument against collapsing HADAL back into a single overloaded surface.

---

### 2.4 Write-back Enabled Decision Support

Reference observed:
- `Write-back enabled Decision Support`

Core pattern:
- operator applications should not stop at read-only display
- decisions, actions, and edits are part of the same operational loop
- support logic, automation, and human action should connect

What HADAL should borrow:
- the distinction between a **common operating picture** and an **action-capable workbench**
- operator-facing actions belong in a dedicated workbench, not on the landing page
- decision support is a structural concern, not a visual garnish

What HADAL should not borrow:
- Palantir ontology/action vocabulary as-is
- assumptions about backend systems HADAL does not yet have

HADAL mapping:
- `Console` should be the decision-support and analyst workbench lane
- `Overview` should stay read-mostly and orientation-first
- future write-back or analyst workflows should land in `Console`, not in `Overview`

---

## 3. Direct Architecture Implications for HADAL

These references reinforce the current locked lane model.

### 3.1 Overview

`Overview` should be treated as the theatre **common operating picture**.

It must:

- open immediately into the core operating picture
- provide fast orientation
- combine the most important signals into one coherent surface
- feel authoritative and dense without becoming a workbench

It must not:

- become sparse marketing
- become a generic dashboard
- become the editing/workflow lane

### 3.2 Maps

`Maps` should be treated as the dedicated geospatial operations lane.

It must:

- hold the map-first workspace
- support geospatial investigation and layer-based operational context
- act as the deeper drill-down destination from Overview

It must not:

- replace Overview as the shared operating picture
- become a general-purpose workbench for analyst actions

### 3.3 Console

`Console` should be treated as the analyst workbench and decision-support lane.

It must:

- hold editable/interactive analyst workflows
- become the place for scenario handling, write-back posture, and workbench state
- support deeper navigation and richer action patterns over time

It must not:

- be forced to carry the landing spectacle
- be reduced to a decorative or secondary lane

---

## 4. Borrow / Reject Matrix

| Palantir Pattern | Keep | Reject | HADAL Home |
|---|---|---|---|
| Common operating picture | Shared theatre surface with map context + metrics + summary | Generic enterprise dashboard styling | Overview |
| Collapsible routed workbench nav | Stateful, shareable subviews | Premature nav complexity | Console, later Maps |
| Density scaling | Progressive structuring as detail grows | Flat wall-of-data layouts | All lanes |
| Decision support | Action-capable analyst workbench | Backend/platform assumptions not yet implemented | Console |
| Geospatial operational surface | Layered map workspace | Copying Workshop-specific UI | Maps |

---

## 5. Adoption Rules

If a future prompt references Palantir:

1. Treat Palantir as an **institutional architecture benchmark**, not a donor product.
2. Borrow only the structural pattern being referenced.
3. Re-map the pattern into the locked HADAL lane model.
4. Preserve HADAL identity: green-on-black, sharp paneling, no decorative enterprise polish.
5. Do not let Palantir references reopen:
   - gate removal
   - lane-role swap
   - Overview as the COP
   - Console as the workbench

---

## 6. One-Sentence Summary

Palantir validates HADAL's current direction: `Overview` should be the common operating picture, `Maps` the geospatial operations lane, and `Console` the action-capable analyst workbench.
