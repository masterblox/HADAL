# HADAL Version Lineage

> This file tracks historical checkpoint meaning.
> Current active product truth is defined by the newer transition docs and the live runtime, not by the older gate-era lane descriptions below.

**Recorded:** 2026-03-18 12:49:43 +04
**Current maturity marker:** `v0.5.0`
**Status:** Active handoff reference

This file tracks the meaningful HADAL checkpoints so future work has a clear baseline.

## Current Marker

HADAL is currently at **`v0.5.0`**.

That means:

- deploy recovery is behind us
- macro architecture is defined
- source/reference hierarchy is defined
- the truth-layer cleanup pass is in place
- the app had a real 3-lane shell extraction phase (Overview / Operations / Analysis)
- scenario residue has been removed from active product behavior
- login gate with NucleusTransition reveal sequence was implemented in the earlier shell phase
- globe rendering is production-quality (clean ring, concentric markers, grain)
- prediction engine adapted from upstream with typed interfaces
- OpenSky hook added for live aircraft tracking
- repo hygiene pass removed ~25KB of dead binaries/screenshots/legacy HTML
- branch reconciled with upstream data refreshes and pushed to remote

It does **not** mean HADAL is at `v1.0`.

Current blockers to `v1.0`:

- some surfaces still rely on static/editorial data
- routing is hash-based (functional, not production-grade)
- no auth/roles/audit trail
- no hardened artifact contract enforcement
- no report-builder workflow
- no service-backed governance layer
- 7 pre-existing eslint errors (non-blocking but should be cleaned)

## Lineage

| Marker | Commit | Meaning |
|--------|--------|---------|
| `v0.1.0` | `599cac3` | Stable Vite shell baseline after the earlier broken migration state |
| `v0.1.1` | `12a74e7` | Build recovery after missing-file and import failures |
| `v0.1.2` | `bfe1fc4` | Fresh-clone verified green recovery; build and lint confirmed from clean remote state |
| `v0.2.0` | `15535cc` | Macro platform plan established |
| `v0.2.1` | `fbe42f1` | Reference hierarchy established |
| `v0.3.0` | not singular | Truth-layer cleanup pass connected visible telemetry to Gulf Watch-derived data and labeled simulated surfaces |
| `v0.4.0` | `6a439eb` | 3-lane shell extraction: Overview / Operations / Analysis |
| `v0.4.2` | `9564077` | Scenario residue removed from active product behavior |
| `v0.5.0` | `e05a8ba` | Release-prep: gate/globe/prediction/OpenSky, repo hygiene, branch reconciled and pushed |

## Meaning of `v0.5.0`

The current product should be understood as:

- **product structure:** 3-lane shell is real and routed (hash-based)
- **entry experience at that checkpoint:** login gate → NucleusTransition → globe reveal → terminal
- **data authority:** improved but incomplete — prediction engine and OpenSky hook are new real-data surfaces
- **prediction layer:** adapted from upstream with typed interfaces, 4-stage pipeline
- **operations workspace:** real but still mixed with some static/editorial content
- **analysis lane:** structurally correct, prediction engine is the strongest surface
- **globe:** production-quality (clean multi-stroke ring, concentric marker halos, permanent grain)
- **repo health:** clean — dead assets removed, branch reconciled with upstream data refreshes
- **government-grade readiness:** not yet

## Next Version Gates

### `v0.5.x` (current range)

Should mean:

- page-level UX tightening is in progress (mobile passes, layout polish)
- remaining fake-authority panels are being removed or explicitly labeled
- static/editorial panels are clearly separated from live telemetry
- login gate and transition sequence are stable

### `v0.6.x`

Should mean:

- artifact contracts are enforced more strictly
- more active modules are Gulf Watch-backed
- routing and lane ownership are stable enough for sustained feature work

### `v0.7.x`

Should mean:

- reporting/workflow layer exists
- prediction and analysis modules are more disciplined
- data freshness and stale-state behavior are clearer

### `v1.0`

Should mean:

- trustworthy live surfaces
- clear governance boundaries
- auditable operator workflow
- hardened platform contracts
- no major fake-authority debt in active product areas

## Rule

Do not bump the HADAL maturity marker casually.

A new marker should only be recorded when:

- the product meaningfully changes state
- the change is checkpointed in git
- the new state is understandable to the next engineer without guesswork
