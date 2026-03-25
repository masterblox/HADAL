# Orchestration — 2026-03-26

This note captures the three active rationale layers around HADAL and how they connect:

- **HADAL** = destination product shell
- **Nikola / Gulf Watch V2** = source capability system
- **Palantir** = institutional architecture reference

The purpose of this document is to stop those three layers from being mixed together during migration work.

---

## 1. HADAL Rationale

### Product Role

HADAL is the target operator-facing product shell for Gulf theatre intelligence. It exists because Gulf Watch capability is worth preserving, but the original delivery model is not the target user experience.

HADAL should provide:

- terminal shell
- lane structure
- navigation
- visual system
- panel hierarchy
- operator workflow framing
- clean UI contracts over Gulf Watch data

HADAL should not provide:

- casual rewrites of useful Gulf Watch logic
- fake telemetry to fill empty shells
- donor architecture imported wholesale from MIT or Palantir
- speculative backend/platform systems that bypass the existing source pipeline

### Current Lane Model

```text
Overview = common operating picture
Maps     = geospatial operations lane
Console  = analyst workbench
```

### Lane Rationales

**Overview**
- fast orientation surface
- answers "what is happening now?"
- dense, authoritative, read-mostly
- not a sparse marketing landing

**Maps**
- dedicated geospatial operations lane
- owns map-first workspace, layers, airspace, spatial drill-down
- should not replace Overview as the shared operating picture

**Console**
- analyst workbench and decision-support lane
- owns editable workflows, deeper analysis posture, future action-capable surfaces
- should not carry the landing spectacle

### Non-Negotiables

- do not reopen the gate
- do not revert the lane-role swap
- do not collapse back into a single overloaded page
- do not let benchmark systems override product truth

---

## 2. Nikola / Gulf Watch V2 Rationale

### System Role

`Gulf Watch V2` is the source capability system, not a design reference. HADAL inherits live intelligence logic, module semantics, and upstream feature direction from it.

### Nikola's Core V2 Module Set

```text
Feed
Map
Argus
Chatter
Ignite
Chronos
Skyline
Maritime
Signals
Venus Trap
```

### Source-System Priorities

**Foundational primitives**
- `Feed` = default entry point, incidents/events list
- `Map` = geospatial complement to the feed

**Serious V2 intelligence modules**
- `Argus` = entity resolution + threat scoring
- `Chatter` = social media intelligence
- `Ignite` = NASA FIRMS thermal detection
- `Chronos` = temporal change detection
- `Skyline` = weather intelligence

**Advanced or unstable/testing layers**
- `Maritime` = AIS vessel tracking
- `Signals` = SIGINT/ELINT, simulated unless specialized hardware exists
- `Venus Trap` = honeypot/cyber layer, explicitly identified by Nikola as confusing and not a good architectural anchor

### What HADAL Must Preserve

- incident/feed logic
- geospatial event mapping
- circuit breaker and verification concepts
- prediction concepts and upstream parameter improvements
- Argus/Chatter/Ignite/Chronos/Skyline semantics
- JSON/data contract stability where Gulf Watch remains the source

### What HADAL Must Not Preserve

- Gulf Watch as one giant scroll
- Gulf Watch as the final UX shell
- Venus Trap as a framing device for the main product architecture

### Immediate Interpretation

For migration priority:

- treat `Feed` and `Map` as source-system primitives
- treat `Argus`, `Chatter`, `Ignite`, `Chronos`, `Skyline` as the highest-value V2 modules to preserve and reorganize
- treat `Maritime`, `Signals`, and `Venus Trap` as conditional/testing layers, not default landing architecture

---

## 3. Palantir Rationale

### System Role

Palantir is an institutional architecture reference, not a donor product and not a source system.

Palantir validates HADAL as an operator-grade product by showing how institutional software handles:

- shared operating pictures
- routed workbench navigation
- dense object views
- decision-support workflows

### Structural Patterns To Borrow

**Common Operating Picture**
- one authoritative theatre surface
- map context + top-line metrics + filters + supporting summaries in one orientation layer

**Routed Workbench Navigation**
- stateful, shareable internal navigation inside deeper workbench surfaces

**Density Scaling**
- stronger grouping and hierarchy as information density rises
- no flat wall-of-panels approach

**Decision Support**
- explicit separation between read-mostly orientation surfaces and action-capable workbench surfaces

### What Not To Copy

- Palantir visual styling
- generic enterprise card language
- Workshop-specific assumptions
- ontology/action vocabulary as-is
- backend/platform expectations HADAL does not yet have

### Why It Matters To HADAL

Palantir does not argue for changing HADAL's lane model. It validates it:

```text
Overview = common operating picture
Maps     = deeper geospatial operations workspace
Console  = action-capable analyst workbench
```

---

## 4. Orchestration Layer

This is the connection logic between the three systems.

### Truth Stack

```text
Nikola / Gulf Watch V2 = capability truth
HADAL                  = product-shell truth
Palantir               = institutional architecture benchmark
```

### Translation Rules

1. **Nikola defines the source modules.**
   - If Gulf Watch V2 has a real intelligence module, HADAL must decide where it belongs.

2. **HADAL decides the product shell.**
   - HADAL reorganizes capability into `Overview`, `Maps`, and `Console`.

3. **Palantir validates structure, not content.**
   - Palantir can justify the shape of a lane, but not the underlying intelligence model.

4. **Do not mix the layers.**
   - Do not let Palantir redefine Gulf Watch capability.
   - Do not let Gulf Watch's original scroll define HADAL's final UX.
   - Do not let HADAL invent fake enterprise systems to imitate Palantir.

### Practical Mapping

| Source module or pattern | HADAL home | Rationale |
|---|---|---|
| Feed | Overview first, Maps support | Feed is the source-system primitive and first-contact intelligence layer |
| Map | Maps first, Overview support | Map is the geospatial core but should not displace the COP |
| Argus | Overview + Console | Priority intelligence layer and analyst relevance |
| Chatter | Overview + Console | Real-time public signal layer |
| Ignite | Maps + Overview support | Spatial/environmental intelligence |
| Chronos | Maps + Console support | Temporal change intelligence |
| Skyline | Maps + Console support | Operational planning/weather intelligence |
| Maritime | Maps later | Advanced domain layer, not default landing |
| Signals | Console/Maps later | Sensitive/testing layer, not a default surface |
| Venus Trap | Deprioritize | Explicitly confusing, not a good architectural anchor |
| Common operating picture pattern | Overview | Institutional validation for the landing surface |
| Decision-support pattern | Console | Institutional validation for the workbench |
| Routed internal navigation | Console later, Maps later | Supports subflows without reopening top-level architecture |

---

## 5. Overnight Conclusion

The architecture is no longer ambiguous.

- **Nikola** tells us what the real module universe is.
- **HADAL** tells us how that universe should be reorganized into product lanes.
- **Palantir** tells us that the `Overview / Maps / Console` split is the correct institutional structure.

### Final Working Summary

```text
Gulf Watch V2 provides the capability.
HADAL provides the product shell.
Palantir validates the institutional shape.
```

```text
Overview = common operating picture
Maps     = geospatial operations lane
Console  = analyst workbench
```

This should be the operating frame for future migration passes until a newer explicit handoff overrides it.
