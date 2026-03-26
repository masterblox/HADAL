# HADAL Architecture Transition — 2026-03-26

## Status

- **Purpose:** primary execution brief for the current HADAL migration phase
- **Audience:** architecture engineer / implementation lead
- **Grounded in repo state:** `legacy-hadal/main` at `1781c58`
- **Capability source:** `https://gulfwatch-testing.vercel.app/features.html`
- **Supporting references:**
  - `docs/handoff/ORCHESTRATION_2026-03-26.md`
  - `docs/handoff/GULFWATCH_FEATURE_MATCH_REPORT_2026-03-26.md`
  - `docs/architecture/HADAL_PALANTIR_PATTERN_DIGEST.md`

This document is the current architecture transition brief. It exists to remove ambiguity about what HADAL already has, what GulfWatch live has upstream, how Palantir should shape the product structurally, and what gets migrated next.

---

## Locked Product Truth

- `GulfWatch V2` is the source capability system.
- `HADAL` is the product shell and the operator-facing system.
- `Palantir` is a structural benchmark only.
- The lane model is locked:

```text
Overview = common operating picture
Maps     = geospatial operations lane
Console  = analyst workbench
```

- The gate remains removed from the active product flow.
- Do not reopen lane-role decisions.
- Do not treat donor systems or reference systems as product truth.

---

## Current HADAL Runtime

### Built now

- `Overview` is already built as the common operating picture shell using the former Console hero composition.
- `Maps` is already built as the geospatial lane around `IntelWireSection`.
- `Console` is already built as the analyst tile/workbench shell with presets and workbench composition.

### Real runtime surfaces already present

- `incident feed`
  - implemented through `ThreatFeed.tsx`
  - live incidents are rendered into the queue with verification badges and region filtering
- `prediction engine`
  - implemented through `PredictorEngine.tsx`
  - already one of the strongest real analysis surfaces in HADAL
- `missile defense`
  - implemented through `MissileDefenseStrip.tsx`
  - already placed as a support rail surface in `Maps`
- `finance / economic layer`
  - implemented through `EconomicSection.tsx` and market-oriented console/situation surfaces
  - live prices exist; some adjacent context rows remain static reference data
- `airspace table`
  - implemented through `AirspaceTab.tsx`
  - real enough to keep in the active lane model
- `aircraft tracking base`
  - implemented through `useOpenSky`, `LeafletMap.tsx`, and the map workspace ticker/overlay path

### Partial or shell surfaces already present

- `Argus`
  - visible in `Overview` and `Console`
  - still a proxy/derived tile, not yet a full upstream-equivalent entity-resolution capability
- `Chatter`
  - visible in `Overview` and `Console`
  - not yet a real social-source collection capability inside HADAL
- `Ignite`
  - visible in `Overview` and `Console`
  - not yet equivalent to GulfWatch live thermal/FIRMS coverage
- `Chronos`
  - visible in `Console`
  - not yet a fully surfaced multi-window change-detection capability
- `Skyline`
  - present as an honest shell
  - explicitly says no weather data / awaiting integration
- `Signals`
  - present only as a procedural visual tile
  - not a real SIGINT/ELINT capability
- `Venus Trap`
  - exists only as an artifact tile/component
  - not promoted in the active runtime and not trustworthy as a live module

### Runtime caveat

The current HADAL runtime is ahead of several stale documents.

Any document that still describes:
- `Overview / Operations / Analysis`
- login gate as the active entry flow
- `Operations` and `Analysis` as the current product lanes

should be treated as stale architecture memory, not current implementation truth.

---

## GulfWatch Upstream Capability Delta

| Feature | GulfWatch Live | HADAL Now | Action | Target Lane | Palantir Role |
|---|---|---|---|---|---|
| Feed | live capability and default upstream surface | real and already present | keep | Overview + Maps support | COP |
| Tactical Map | live capability | partial; real lane exists but still mixed with static overlays | wire | Maps | MAP WORKSPACE |
| Circuit Breaker | live platform capability | logic is inherited but not surfaced as a first-class HADAL module | surface later / preserve logic now | cross-lane | NONE |
| Prediction Engine | live platform capability | real and already strong in HADAL | keep + tighten | Console | WORKBENCH |
| Missile Defense | live platform capability | real and already present | keep | Maps support rail | MAP WORKSPACE |
| Finance Panel | live platform capability | real core with some static context around it | keep + label static subparts honestly | Console / support surfaces | WORKBENCH |
| Argus | live intelligence module | partial tile/module shell | wire | Overview + Console | COP / WORKBENCH |
| Chatter | live intelligence module | partial tile/module shell | wire | Overview + Console | COP / WORKBENCH |
| Ignite | live intelligence module | partial tile/module shell | wire | Overview first, Maps second | COP / MAP WORKSPACE |
| Chronos | live intelligence module | partial tile/module shell | wire | Console | WORKBENCH |
| Skyline | live intelligence module | shell only, honest no-data state | adapt from upstream | Maps / Console support | MAP WORKSPACE / WORKBENCH |
| Government Sources | live platform capability | implied through feed and verification framing, not surfaced cleanly | surface | Overview + feed verification context | COP |
| Data Exports | live platform capability | partial; tactical export exists, broader export surface does not | expand | Console | WORKBENCH |
| Maritime | live intelligence module upstream | absent in meaningful HADAL runtime | defer until real | Maps | MAP WORKSPACE |
| Signals | live capability upstream claim, but highly sensitive and unstable | shell-only / procedural tile | demote until real | Console only if real later | NONE |
| Venus Trap | live upstream claim but unstable and confusing as architecture anchor | artifact only / not promoted | do not promote | none | NONE |

### Delta interpretation

- **keep** = capability already exists in HADAL in the correct structural home; only harden, clarify, or tighten it
- **wire** = visible HADAL shell already exists, but it must be connected to real upstream-backed logic/data
- **adapt from upstream** = capability exists upstream but must be brought into HADAL without copying GulfWatch UI literally
- **surface later / preserve logic now** = do not invent a new module yet; preserve the underlying logic and expose it only when it serves the lane model cleanly
- **expand** = existing capability exists in smaller form and should grow into a fuller surface
- **defer until real** = do not build or promote this in the current tranche
- **demote until real** = keep it out of authoritative surfaces and remove any implication that it is live intelligence
- **do not promote** = leave out of the active architecture until an explicit later decision says otherwise

---

## Palantir Structural Translation

Palantir is allowed to shape HADAL structurally. It is not allowed to define product truth, feature truth, or implementation claims.

### Structural rules

- `Overview` must behave like a common operating picture:
  - dense
  - read-mostly
  - shared operating picture
  - answers what is happening now
- `Maps` must behave like a map workspace:
  - geospatial drill-down
  - layer management
  - overlays
  - operational investigation
- `Console` must behave like a workbench:
  - prediction
  - reports / exports
  - analyst interaction
  - future action-capable decision-support posture

### Palantir may shape

- density strategy
- routed workbench posture
- panel composition
- separation between orientation surfaces and action surfaces
- progressive hierarchy as information density rises

### Palantir may not shape

- feature inventory
- product truth
- data contracts
- gate behavior
- lane reversal
- literal visual copying

### Practical mapping

- `Overview` uses Palantir logic as a COP discipline, not as visual inspiration.
- `Maps` uses Palantir logic as a geospatial-workspace discipline, not as a reason to replace the COP.
- `Console` uses Palantir logic as a workbench discipline, not as a prompt to invent enterprise systems HADAL does not have.

---

## Migration Actions

### Keep

Retain the current HADAL implementation and only harden, clarify, or honestly label it.

Apply this to:
- Feed
- Prediction Engine
- Missile Defense
- core finance/economic surface
- current lane model
- Overview COP shell
- Maps workspace shell
- Console workbench shell

### Wire

Connect an existing HADAL shell or partial module to real upstream-backed capability.

Apply this to:
- Tactical Map parity
- Argus
- Chatter
- Ignite
- Chronos

### Adapt

Port upstream capability into HADAL framing without copying GulfWatch UI or breaking the lane model.

Apply this to:
- Skyline

### Surface

Expose a capability that already exists conceptually in HADAL, but is not yet visible as a disciplined runtime surface.

Apply this to:
- Government Sources framing

### Expand

Take a smaller existing capability and extend it into the fuller runtime surface GulfWatch live implies.

Apply this to:
- Data Exports

### Defer

Do not build or promote the capability in the current tranche.

Apply this to:
- Maritime

### Demote

Keep the capability out of primary surfaces and strip away live-authority framing until it is real.

Apply this to:
- Signals

### Do not promote

Do not move the capability into the active architecture or landing surfaces.

Apply this to:
- Venus Trap

---

## Immediate Execution Order

1. clean stale docs that conflict with `Overview / Maps / Console`
2. preserve current runtime lane model and gate removal
3. wire partial modules already visible in HADAL
4. expand export and verification surfacing
5. pull in highest-value upstream-only capability (`Skyline`) after partial-module wiring
6. leave Maritime / Signals / Venus Trap out of promoted architecture until real

### Practical priority inside that order

- **first:** normalize docs so the repo stops telling two stories
- **second:** protect the current runtime structure from architecture churn
- **third:** improve parity by wiring what already exists visually in HADAL
- **fourth:** only then add new upstream capability where the target lane is already clear

---

## Non-Negotiables

- no gate restore
- no lane reversal back to `Operations / Analysis`
- no sparse/minimal reinterpretation of `Overview`
- no fake telemetry promoted as real capability
- no treating Palantir like a donor repo or product source
- no treating GulfWatch's old one-page scroll as HADAL's target UX
- no promotion of `Signals` or `Venus Trap` as authoritative active surfaces until they are real and explicitly approved

---

## Engineer Read Rule

For any capability in the system, this brief should let the engineer answer immediately:
- do we already have it in HADAL?
- if yes, is it real, partial, or shell-only?
- if no, is it upstream-only or intentionally deferred?
- which lane owns it?
- what is the exact migration action?
- does Palantir influence its structure?

If another document conflicts with this one on current lane truth or current migration order, this document wins for the current phase.
