# HADAL Version Lineage

**Recorded:** 2026-03-18 12:49:43 +04
**Current maturity marker:** `v0.4.2`
**Status:** Active handoff reference

This file tracks the meaningful HADAL checkpoints so future work has a clear baseline.

## Current Marker

HADAL is currently at **`v0.4.2`**.

That means:

- deploy recovery is behind us
- macro architecture is defined
- source/reference hierarchy is defined
- the truth-layer cleanup pass is in place
- the app now has a real 3-lane shell
- scenario residue has been removed from active product behavior

It does **not** mean HADAL is at `v1.0`.

Current blockers to `v1.0`:

- some surfaces still rely on static/editorial data
- routing is still transitional hash routing
- no auth/roles/audit trail
- no hardened artifact contract enforcement
- no report-builder workflow
- no service-backed governance layer

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

## Meaning of `v0.4.2`

The current product should be understood as:

- **product structure:** real
- **data authority:** improved but incomplete
- **prediction layer:** present
- **operations workspace:** real but still mixed with some static/editorial content
- **analysis lane:** structurally correct, still evolving
- **government-grade readiness:** not yet

## Next Version Gates

### `v0.5.x`

Should mean:

- page-level UX tightening is complete
- remaining fake-authority panels are removed or explicitly labeled
- static/editorial panels are clearly separated from live telemetry

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
